// Scheduled daily. Each budget can send one 80% and one 100% alert per UTC month.
import { escapeHtml, wrapEmail } from "../_shared/emailLayout.ts";
import { sendEmail } from "../_shared/resend.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";

const THRESHOLDS = [100, 80] as const;
const PAGE_SIZE = 1000;

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function startOfUtcMonth(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function isSameUtcMonth(value: string | null, now: Date) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) &&
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth();
}

async function getMonthlyExpenseTotal(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  from: string,
  to: string,
) {
  let total = 0;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "EXPENSE")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    total += rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    if (rows.length < PAGE_SIZE) return total;
  }
}

Deno.serve(async () => {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date();
    const monthStart = startOfUtcMonth(now);

    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select("id, user_id, amount, last_alert_sent, last_alert_threshold")
      .order("id", { ascending: true });
    if (budgetsError) throw budgetsError;

    let sent = 0;
    const failures: { budgetId: string; message: string }[] = [];

    for (const budget of budgets ?? []) {
      try {
        const budgetAmount = Number(budget.amount);
        if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) continue;

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("email, name, currency")
          .eq("clerk_id", budget.user_id)
          .maybeSingle();
        if (userError) throw userError;
        if (!user?.email) continue;

        const spent = await getMonthlyExpenseTotal(
          supabase,
          budget.user_id,
          monthStart,
          now.toISOString(),
        );
        const percent = (spent / budgetAmount) * 100;
        const priorThreshold = isSameUtcMonth(budget.last_alert_sent, now)
          ? Number(budget.last_alert_threshold ?? 0)
          : 0;
        const threshold = THRESHOLDS.find((value) => percent >= value && priorThreshold < value);
        if (!threshold) continue;

        const currency = typeof user.currency === "string" ? user.currency : "USD";
        const remaining = budgetAmount - spent;
        const monthLabel = new Intl.DateTimeFormat("en", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(now);
        const subject = threshold === 100
          ? "ExpenseAi budget alert: monthly budget reached"
          : `ExpenseAi budget alert: ${threshold}% of your ${monthLabel} budget used`;
        const displayName = escapeHtml(user.name?.trim() || "there");
        const html = wrapEmail(`
          <p style="margin:0 0 16px;">Hi ${displayName},</p>
          <p style="margin:0 0 20px;">
            ${threshold === 100
              ? `You've reached your <strong>${monthLabel}</strong> budget.`
              : `You've used <strong>${threshold}%</strong> of your <strong>${monthLabel}</strong> budget. Here is an early heads-up to help pace the rest of the month.`}
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Spent so far</td><td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${escapeHtml(formatMoney(spent, currency))}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Monthly budget</td><td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${escapeHtml(formatMoney(budgetAmount, currency))}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">${remaining >= 0 ? "Remaining" : "Over by"}</td><td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;color:${remaining >= 0 ? "#1A1D26" : "#FF6B4A"};">${escapeHtml(formatMoney(Math.abs(remaining), currency))}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Used</td><td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${percent.toFixed(0)}%</td></tr>
          </table>
          <p style="margin:0;color:#5C5F68;">${threshold === 100
            ? "Review recent transactions in ExpenseAi and adjust your budget if your needs have changed."
            : "Keep an eye on spending for the rest of the month to stay within your budget."}</p>
        `);

        const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
        await sendEmail({
          to: user.email,
          subject,
          html,
          idempotencyKey: `budget-${budget.id}-${monthKey}-${threshold}`,
        });
        const { error: updateError } = await supabase
          .from("budgets")
          .update({ last_alert_sent: now.toISOString(), last_alert_threshold: threshold })
          .eq("id", budget.id);
        if (updateError) throw updateError;
        sent++;
      } catch (error) {
        failures.push({
          budgetId: String(budget.id),
          message: error instanceof Error ? error.message : "Unknown error",
        });
        console.error("Budget alert failed", budget.id, error);
      }
    }

    return Response.json({ sent, failed: failures.length, failures });
  } catch (error) {
    console.error("Budget alert run failed", error);
    return Response.json({ error: "Budget alert run failed." }, { status: 500 });
  }
});
