import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  baseCurrency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]).default("USD"),
  timezone: z.string().default("America/New_York"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const resetRequestSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  baseCurrency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]).optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
