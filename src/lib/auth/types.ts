import { UserRole } from "@/types";

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  baseCurrency: string;
  timezone: string;
  emailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: string; // ISO String
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: string; // ISO string
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    baseCurrency: string;
    timezone: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  };
  sessionToken: string;
  expiresAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  baseCurrency?: string;
  timezone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
