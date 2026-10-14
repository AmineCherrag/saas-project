import { z } from "zod";

export const tradeDirectionSchema = z.enum(["LONG", "SHORT"]);
export const tradeStatusSchema = z.enum(["OPEN", "CLOSED"]);
export const assetClassSchema = z.enum([
  "STOCKS",
  "FUTURES",
  "FOREX",
  "CRYPTO",
  "OPTIONS",
  "CFDS",
]);

export const tagTypeSchema = z.enum([
  "MISTAKE",
  "SETUP",
  "MARKET_CONDITION",
  "CUSTOM",
]);

export const tradeTagSchema = z.object({
  id: z.string().optional(),
  type: tagTypeSchema,
  value: z.string().min(1).max(50),
});

export const executionFillSchema = z.object({
  id: z.string().optional(),
  executionType: z.enum(["ENTRY", "EXIT"]),
  orderAction: z.enum(["BUY", "SELL"]),
  timestamp: z.string(),
  price: z.number().positive("Execution price must be positive"),
  quantity: z.number().positive("Quantity must be positive"),
  fees: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const createTradeSchema = z.object({
  accountId: z.string().min(1, "Trading account is required"),
  symbol: z.string().min(1, "Ticker/Symbol is required").toUpperCase().trim(),
  assetClass: assetClassSchema.optional().default("STOCKS"),
  direction: tradeDirectionSchema,
  status: tradeStatusSchema.optional().default("CLOSED"),
  entryTime: z.string().min(1, "Entry timestamp is required"),
  exitTime: z.string().optional(),
  entryPrice: z.number().positive("Entry price must be positive"),
  exitPrice: z.number().positive("Exit price must be positive").optional(),
  quantity: z.number().positive("Position quantity must be positive"),
  contractMultiplier: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  fees: z.number().min(0).optional().default(0),
  commissions: z.number().min(0).optional().default(0),
  playbookId: z.string().optional(),
  playbookName: z.string().optional(),
  rating: z.number().min(1).max(5).optional().default(3),
  marketSession: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(tradeTagSchema).optional().default([]),
  executions: z.array(executionFillSchema).optional().default([]),
});

export const updateTradeSchema = createTradeSchema.partial();

export const tradeFilterSchema = z.object({
  accountId: z.string().optional(),
  assetClass: assetClassSchema.optional(),
  direction: tradeDirectionSchema.optional(),
  symbol: z.string().optional(),
  status: tradeStatusSchema.optional(),
  playbookId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rating: z.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z.enum(["entryTime", "netPnl", "returnPct", "rMultiple"]).default("entryTime"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTradeInput = z.input<typeof createTradeSchema>;
export type UpdateTradeInput = z.input<typeof updateTradeSchema>;
export type TradeFilters = z.input<typeof tradeFilterSchema>;
