import { z } from "zod";

export const accountTypeSchema = z.enum([
  "CASH",
  "MARGIN",
  "PROP_EVALUATION",
  "PROP_FUNDED",
  "DEMO",
]);

export const assetClassSchema = z.enum([
  "STOCKS",
  "FUTURES",
  "FOREX",
  "CRYPTO",
  "OPTIONS",
  "CFDS",
]);

export const accountStatusSchema = z.enum([
  "ACTIVE",
  "ARCHIVED",
  "BREACHED",
]);

export const createAccountSchema = z.object({
  name: z.string().min(2, "Account name must be at least 2 characters").max(60),
  brokerName: z.string().min(2, "Broker name is required").max(60),
  accountType: accountTypeSchema.default("CASH"),
  assetClass: assetClassSchema.default("STOCKS"),
  initialBalance: z.number().min(0, "Initial balance must be zero or positive"),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]).default("USD"),
  description: z.string().max(250).optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  brokerName: z.string().min(2).max(60).optional(),
  accountType: accountTypeSchema.optional(),
  assetClass: assetClassSchema.optional(),
  initialBalance: z.number().min(0).optional(),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]).optional(),
  status: accountStatusSchema.optional(),
  description: z.string().max(250).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
