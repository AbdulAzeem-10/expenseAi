// Scheduled weekly. Sends at most one recap per user in a rolling seven-day window.
import { getCategoryConfig, type CategoryKey } from "../../../constants/categories.ts";
import { escapeHtml, wrapEmail } from "../_shared/emailLayout.ts";
import { sendEmail } from "../_shared/resend.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const PAGE_SIZE = 1000;
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
  },
  required: ["tips"],
};

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

function fallbackTips(byCategory: Record<string, number>, totalExpense: number, totalIncome: number) {
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const tips = top
    ? [`Review ${top[0]} spending and choose one purchase you can reduce next week.`]
    : [];
  if (totalIncome > 0 && totalExpense > totalIncome) {
    tips.push("Your expenses were higher than your income this week; postpone nonessential purchases while you rebalance.");
  } else if (totalExpense > 0) {
    tips.push("Set aside a small amount after your next income arrives to build a consistent savings habit.");
  } else {
    tips.push("Keep recording purchases so next week's recap can highlight useful spending patterns.");
  }
  return tips;
}

function cleanTips(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tip): tip is string => typeof tip === "string")
    .map((tip) => tip.replace(/\s+/g, " ").trim())
    .filter((tip) => tip.length > 0 && tip.length <= 240)
    .slice(0, 4);
}

async function generateTips(
  currency: string,
  byCategory: Record<string, number>,
  totalExpense: number,
  totalIncome: number,
) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing; using rule-based weekly tips.");
    return fallbackTips(byCategory, totalExpense, totalIncome);
  }

  const breakdown = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => `${category}: ${formatMoney(amount, currency)}`)
    .join(", ");
  const prompt = `You are a friendly personal finance coach. Write 2-4 short, specific, actionable tips (20 words maximum each) based on this user's last 7 days. Be encouraging, avoid generic advice, and do not invent facts. Return JSON with a tips array.\n\nIncome: ${formatMoney(totalIncome, currency)}\nExpenses: ${formatMoney(totalExpense, currency)}\nSpending by category: ${breakdown || "none"}`;
  const errors: string[] = [];

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${GEMINI_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      });
      if (!response.ok) {
        const details = await response.text();
        errors.push(`${model}: ${response.status} ${details.slice(0, 300)}`);
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.find(
        (part: { text?: string }) => typeof part.text === "string",
      )?.text;
      if (!text) {
        errors.push(`${model}: response did not contain tip text`);
        continue;
      }

      try {
        const tips = cleanTips(JSON.parse(text)?.tips);
        if (tips.length >= 2) return tips;
        errors.push(`${model}: returned fewer than two valid tips`);
      } catch {
        errors.push(`${model}: returned invalid JSON`);
      }
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "request failed"}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  console.warn("Gemini tips unavailable; using rule-based tips.", errors);
  return fallbackTips(byCategory, totalExpense, totalIncome);
}

async function getLastWeekTransactions(supabase: ReturnType<typeof createSupabaseAdmin>, userId: string, from: string, to: string) {
  const transactions: { type: string; amount: number; category: string }[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount, category")
      .eq("user_id", userId)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data ?? [];
    transactions.push(...rows);
    if (rows.length < PAGE_SIZE) return transactions;
  }
}

function formatWeekLabel(from: Date, to: Date) {
  const formatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${formatter.format(from)} – ${formatter.format(to)}`;
}

function utcWeekKey(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  try {
    const supabase = createSupabaseAdmin();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nowIso = now.toISOString();
    const fromIso = weekAgo.toISOString();

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("clerk_id, email, name, currency, weekly_tip_sent_at")
      .order("clerk_id", { ascending: true });
    if (usersError) throw usersError;

    let sent = 0;
    const failures: { userId: string; message: string }[] = [];

    for (const user of users ?? []) {
      if (!user.email) continue;
      const lastSentAt = user.weekly_tip_sent_at ? new Date(user.weekly_tip_sent_at).getTime() : 0;
      if (Number.isFinite(lastSentAt) && lastSentAt > 0 && now.getTime() - lastSentAt < 7 * 24 * 60 * 60 * 1000) continue;

      try {
        const transactions = await getLastWeekTransactions(supabase, user.clerk_id, fromIso, nowIso);
        if (transactions.length === 0) continue;

        const totalExpense = transactions
          .filter((tx) => tx.type === "EXPENSE")
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        const totalIncome = transactions
          .filter((tx) => tx.type === "INCOME")
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        const byCategory: Record<string, number> = {};
        for (const tx of transactions) {
          if (tx.type === "EXPENSE") byCategory[tx.category] = (byCategory[tx.category] ?? 0) + Number(tx.amount || 0);
        }

        const currency = typeof user.currency === "string" ? user.currency : "USD";
        const tips = await generateTips(currency, byCategory, totalExpense, totalIncome);
        const topCategories = Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category, amount]) => {
            const config = getCategoryConfig(category as CategoryKey);
            const label = config?.label ?? category;
            return `<li style="padding:6px 0;color:#5C5F68;">${escapeHtml(label)}: <strong style="color:#1A1D26;">${escapeHtml(formatMoney(amount, currency))}</strong></li>`;
          })
          .join("");

        // Atomically claim the weekly send so overlapping cron invocations cannot duplicate it.
        let claim = supabase.from("users")
          .update({ weekly_tip_sent_at: nowIso })
          .eq("clerk_id", user.clerk_id);
        claim = user.weekly_tip_sent_at
          ? claim.eq("weekly_tip_sent_at", user.weekly_tip_sent_at)
          : claim.is("weekly_tip_sent_at", null);
        const { data: claimed, error: claimError } = await claim.select("clerk_id").maybeSingle();
        if (claimError) throw claimError;
        if (!claimed) continue;

        const label = formatWeekLabel(weekAgo, now);
        const subject = `Your ExpenseAi weekly recap and tips (${label})`;
        const displayName = escapeHtml(user.name?.trim() || "there");
        const html = wrapEmail(`
          <p style="margin:0 0 16px;">Hi ${displayName},</p>
          <p style="margin:0 0 20px;">Here's your ExpenseAi recap for <strong>${label}</strong>, with a few tips for the week ahead.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Income</td><td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;color:#238B52;">+${escapeHtml(formatMoney(totalIncome, currency))}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Expenses</td><td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;color:#B94436;">-${escapeHtml(formatMoney(totalExpense, currency))}</td></tr>
            <tr><td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Net</td><td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${escapeHtml(formatMoney(totalIncome - totalExpense, currency))}</td></tr>
          </table>
          ${topCategories ? `<p style="margin:0 0 6px;font-weight:600;">Top spending categories</p><ul style="margin:0 0 20px;padding-left:18px;list-style:none;">${topCategories}</ul>` : ""}
          <p style="margin:0 0 8px;font-weight:600;">Tips for you</p>
          <ol style="margin:0;padding-left:18px;">${tips.map((tip) => `<li style="padding:4px 0;">${escapeHtml(tip)}</li>`).join("")}</ol>
        `);

        try {
          const weekKey = utcWeekKey(now);
          await sendEmail({
            to: user.email,
            subject,
            html,
            idempotencyKey: `weekly-tips-${user.clerk_id}-${weekKey}`,
          });
          sent++;
        } catch (emailError) {
          let rollback = supabase.from("users")
            .update({ weekly_tip_sent_at: user.weekly_tip_sent_at })
            .eq("clerk_id", user.clerk_id)
            .eq("weekly_tip_sent_at", nowIso);
          const { error: rollbackError } = await rollback;
          if (rollbackError) console.error("Could not release weekly email claim", user.clerk_id, rollbackError);
          throw emailError;
        }
      } catch (error) {
        failures.push({
          userId: String(user.clerk_id),
          message: error instanceof Error ? error.message : "Unknown error",
        });
        console.error("Weekly tips email failed", user.clerk_id, error);
      }
    }

    return Response.json({ sent, failed: failures.length, failures });
  } catch (error) {
    console.error("Weekly tips run failed", error);
    return Response.json({ error: "Weekly tips run failed." }, { status: 500 });
  }
});
