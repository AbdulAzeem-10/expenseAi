const RESEND_URL = "https://api.resend.com/emails";

export async function sendEmail({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  if (!from) throw new Error("Missing RESEND_FROM_EMAIL");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ from, to, subject, html }),
      signal: controller.signal,
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = result?.message ?? result?.error ?? `HTTP ${res.status}`;
      throw new Error(`Resend request failed: ${detail}`);
    }

    return { id: typeof result?.id === "string" ? result.id : null };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Resend request timed out after 20 seconds.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
