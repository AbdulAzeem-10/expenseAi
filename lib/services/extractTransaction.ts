import {
  CATEGORY_KEYS_EXPENSE,
  CATEGORY_KEYS_INCOME,
} from "@/constants/categories";
import type { ExtractedTransaction } from "@/types/transaction";

export type { ExtractedTransaction } from "@/types/transaction";

// Keep stable multimodal Flash endpoints in fallback order. Avoid preview IDs:
// preview availability and quotas are less predictable for production use.
const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["EXPENSE", "INCOME"], nullable: true },
    amount: { type: "number", nullable: true },
    category: {
      type: "string",
      enum: [...CATEGORY_KEYS_EXPENSE, ...CATEGORY_KEYS_INCOME],
      nullable: true,
    },
    description: { type: "string", nullable: true },
    date: { type: "string", nullable: true },
    transcript: { type: "string", nullable: true },
  },
  required: ["type", "amount", "category", "description", "date", "transcript"],
};

async function callGemini(promptText: string, inlineData: { mimeType: string; data: string }) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY");

  const errors: string[] = [];
  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptText }, { inlineData }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body?.error?.message;
        errors.push(`${model} (${res.status})${detail ? `: ${String(detail).slice(0, 160)}` : ""}`);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        errors.push(`${model}: empty response`);
        continue;
      }
      const result = JSON.parse(text) as ExtractedTransaction;
      return result;
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "request failed"}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  const allTemporarilyUnavailable = errors.length > 0 && errors.every((error) =>
    /\((503|429)\)|timed out|abort|empty response/i.test(error)
  );
  if (allTemporarilyUnavailable) {
    throw new Error(`Google AI is temporarily busy. Tried ${GEMINI_MODELS.length} Flash models; please try again shortly.`);
  }

  throw new Error(`AI extraction failed across ${GEMINI_MODELS.length} Flash models. ${errors.at(-1) ?? "Please try again."}`);
}

export async function extractTransactionFromReceipt(
  base64Image: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  const prompt = `You are reading a receipt photo for a personal finance app. Extract the transaction details.

- "type" is always "EXPENSE" for a receipt.
- "amount" is the final total paid (a plain number, no currency symbols).
- "category" must be exactly one of: ${CATEGORY_KEYS_EXPENSE.join(", ")}.
- "description" is a short label, ideally the merchant/store name.
- "date" is the receipt date in YYYY-MM-DD format, if visible.
- "transcript" should be null.
- If any field can't be confidently determined from the image, set it to null. Do not guess.`;

  return callGemini(prompt, { mimeType, data: base64Image });
}

export async function extractTransactionFromVoice(
  base64Audio: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are transcribing a short voice note for a personal finance app where the user is logging a transaction (e.g. "I spent 400 on groceries yesterday" or "Got 5000 rupees freelance payment today"). Today's date is ${today}. Extract the transaction details.

- "type" is "EXPENSE" or "INCOME" based on what the user said.
- "amount" is the amount mentioned (a plain number, no currency symbols).
- "category" must be exactly one of: ${CATEGORY_KEYS_EXPENSE.join(", ")}, ${CATEGORY_KEYS_INCOME.join(", ")} (pick from the expense list if type is EXPENSE, income list if INCOME).
- "description" is a short label summarizing what it was for.
- "date" should be null unless the user clearly mentioned a specific date (e.g. "yesterday", "on Monday") — resolve relative dates to YYYY-MM-DD using ${today} as today's date.
- "transcript" is the verbatim transcription of what was said.
- If any field can't be confidently determined, set it to null. Do not guess.`;

  return callGemini(prompt, { mimeType, data: base64Audio });
}
