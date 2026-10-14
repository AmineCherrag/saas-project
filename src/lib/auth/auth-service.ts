import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  StoredUser,
  UserSession,
} from "./types";
import {
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetPasswordSchema,
  profileUpdateSchema,
} from "./validation";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
} from "./crypto";
import { UserStore } from "./user-store";

export class AuthService {
  /**
   * Register a new user
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const validated = registerSchema.parse(input);

    // Check if email already registered
    const existing = UserStore.findByEmail(validated.email);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    // Hash password with bcrypt work factor 12
    const passwordHash = await hashPassword(validated.password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const verificationToken = generateSecureToken();

    const newUser: StoredUser = {
      id: userId,
      email: validated.email,
      passwordHash,
      name: validated.name,
      role: "USER",
      baseCurrency: validated.baseCurrency,
      timezone: validated.timezone,
      emailVerified: false,
      verificationToken,
      twoFactorEnabled: false,
      isSuspended: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    UserStore.create(newUser);

    // Issue initial session (30-day expiration)
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const session: UserSession = {
      sessionId: sessionToken,
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      expiresAt,
    };
    UserStore.saveSession(session);

    // Audit log
    UserStore.logAudit({
      userId: newUser.id,
      action: "USER_REGISTERED",
      details: { email: newUser.email, baseCurrency: newUser.baseCurrency },
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        baseCurrency: newUser.baseCurrency,
        timezone: newUser.timezone,
        emailVerified: newUser.emailVerified,
        twoFactorEnabled: newUser.twoFactorEnabled,
      },
      sessionToken,
      expiresAt,
    };
  }

  /**
   * Authenticate user credentials and issue session
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const validated = loginSchema.parse(input);

    const user = UserStore.findByEmail(validated.email);
    if (!user) {
      UserStore.logAudit({
        action: "LOGIN_FAILED",
        details: { email: validated.email, reason: "USER_NOT_FOUND" },
      });
      throw new Error("Invalid email or password.");
    }

    if (user.isSuspended) {
      UserStore.logAudit({
        userId: user.id,
        action: "LOGIN_BLOCKED",
        details: { reason: "ACCOUNT_SUSPENDED" },
      });
      throw new Error("This account has been suspended. Please contact customer support.");
    }

    const isValidPassword = await verifyPassword(validated.password, user.passwordHash);
    if (!isValidPassword) {
      UserStore.logAudit({
        userId: user.id,
        action: "LOGIN_FAILED",
        details: { email: user.email, reason: "INCORRECT_PASSWORD" },
      });
      throw new Error("Invalid email or password.");
    }

    // Issue session token
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const session: UserSession = {
      sessionId: sessionToken,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt,
    };
    UserStore.saveSession(session);

    UserStore.logAudit({
      userId: user.id,
      action: "USER_LOGGED_IN",
      details: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        baseCurrency: user.baseCurrency,
        timezone: user.timezone,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      sessionToken,
      expiresAt,
    };
  }

  /**
   * Verify email using cryptographic token
   */
  static verifyEmail(token: string): boolean {
    const user = UserStore.findByVerificationToken(token);
    if (!user) {
      throw new Error("Invalid or expired email verification token.");
    }

    UserStore.update(user.id, {
      emailVerified: true,
      verificationToken: undefined,
    });

    UserStore.logAudit({
      userId: user.id,
      action: "EMAIL_VERIFIED",
    });

    return true;
  }

  /**
   * Request password reset token (valid for 1 hour)
   */
  static requestPasswordReset(email: string): string | null {
    const validated = resetRequestSchema.parse({ email });
    const user = UserStore.findByEmail(validated.email);
    if (!user) {
      // Return null quietly to prevent email enumeration attack
      return null;
    }

    const resetToken = generateSecureToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    UserStore.update(user.id, {
      resetToken,
      resetTokenExpiry,
    });

    UserStore.logAudit({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
    });

    return resetToken;
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const validated = resetPasswordSchema.parse({ token, newPassword });

    const user = UserStore.findByResetToken(validated.token);
    if (!user) {
      throw new Error("Invalid or expired password reset token.");
    }

    // Verify expiry
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      throw new Error("Password reset token has expired. Please request a new one.");
    }

    const passwordHash = await hashPassword(validated.newPassword);

    UserStore.update(user.id, {
      passwordHash,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    // Invalidate all active sessions for security
    const sessions = UserStore.getAllSessions().filter((s) => s.userId === user.id);
    for (const s of sessions) {
      UserStore.deleteSession(s.sessionId);
    }

    UserStore.logAudit({
      userId: user.id,
      action: "PASSWORD_RESET_COMPLETED",
    });

    return true;
  }

  /**
   * Update user preferences
   */
  static updateProfile(
    userId: string,
    updates: { name?: string; baseCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY"; timezone?: string; avatarUrl?: string }
  ): StoredUser {
    const validated = profileUpdateSchema.parse(updates);
    const updated = UserStore.update(userId, validated);
    if (!updated) {
      throw new Error("User not found.");
    }

    UserStore.logAudit({
      userId,
      action: "PROFILE_UPDATED",
      details: validated,
    });

    return updated;
  }

  /**
   * Verify session from token
   */
  static getSession(sessionToken: string): UserSession | null {
    return UserStore.findSession(sessionToken);
  }

  /**
   * Logout user by invalidating session
   */
  static logout(sessionToken: string): void {
    const session = UserStore.findSession(sessionToken);
    if (session) {
      UserStore.logAudit({
        userId: session.userId,
        action: "USER_LOGGED_OUT",
      });
      UserStore.deleteSession(sessionToken);
    }
  }

  /**
   * Export all user data for GDPR/CCPA compliance
   */
  static exportUserData(userId: string) {
    const user = UserStore.findById(userId);
    if (!user) throw new Error("User not found.");

    const auditLogs = UserStore.getAuditLogs(userId);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        baseCurrency: user.baseCurrency,
        timezone: user.timezone,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      auditLogs,
    };
  }

  /**
   * Delete user account and cascade purge
   */
  static deleteAccount(userId: string): boolean {
    UserStore.logAudit({
      userId,
      action: "ACCOUNT_DELETED",
    });
    return UserStore.delete(userId);
  }
}
