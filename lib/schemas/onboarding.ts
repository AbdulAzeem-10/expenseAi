import { z } from "zod";

const balancePattern = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/;

export const onboardingSchema = z.object({
  startingBalance: z
    .string()
    .trim()
    .min(1, "Enter your starting balance.")
    .regex(balancePattern, "Enter a valid amount (up to 2 decimal places)."),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
