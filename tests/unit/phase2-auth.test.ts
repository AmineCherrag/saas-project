import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "@/lib/auth/auth-service";
import { UserStore } from "@/lib/auth/user-store";

describe("Phase 2: Authentication & User Management Suite", () => {
  const testEmail = `test_${Date.now()}@tradepulse.io`;
  const testPassword = "SecureTradingPass123!";
  let createdUserId = "";
  let sessionToken = "";

  it("successfully registers a new user with bcrypt-hashed credentials", async () => {
    const response = await AuthService.register({
      name: "Alex Quantitative",
      email: testEmail,
      password: testPassword,
      baseCurrency: "USD",
      timezone: "America/New_York",
    });

    expect(response.user.email).toBe(testEmail.toLowerCase());
    expect(response.user.name).toBe("Alex Quantitative");
    expect(response.user.role).toBe("USER");
    expect(response.user.baseCurrency).toBe("USD");
    expect(response.user.emailVerified).toBe(false);
    expect(response.sessionToken).toBeDefined();

    createdUserId = response.user.id;
    sessionToken = response.sessionToken;

    // Verify raw user password in store is bcrypt hashed, never plain text
    const stored = UserStore.findById(createdUserId);
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toBe(testPassword);
    expect(stored?.passwordHash.startsWith("$2a$") || stored?.passwordHash.startsWith("$2b$")).toBe(true);
  });

  it("rejects duplicate registration attempts with identical email", async () => {
    await expect(
      AuthService.register({
        name: "Duplicate User",
        email: testEmail,
        password: "AnotherPassword123!",
      })
    ).rejects.toThrow("already exists");
  });

  it("enforces strong password validation rules", async () => {
    // Missing uppercase and numbers
    await expect(
      AuthService.register({
        name: "Weak Pass",
        email: "weak@tradepulse.io",
        password: "weakpassword",
      })
    ).rejects.toThrow();

    // Less than 8 characters
    await expect(
      AuthService.register({
        name: "Short Pass",
        email: "short@tradepulse.io",
        password: "Ab1!",
      })
    ).rejects.toThrow();
  });

  it("authenticates valid credentials and issues 30-day session", async () => {
    const loginRes = await AuthService.login({
      email: testEmail,
      password: testPassword,
    });

    expect(loginRes.user.id).toBe(createdUserId);
    expect(loginRes.sessionToken).toBeDefined();

    // Check session in store
    const session = AuthService.getSession(loginRes.sessionToken);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(createdUserId);
  });

  it("rejects login attempts with incorrect passwords", async () => {
    await expect(
      AuthService.login({
        email: testEmail,
        password: "WrongPassword999!",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("verifies user email address using cryptographic token", () => {
    const user = UserStore.findById(createdUserId);
    expect(user?.verificationToken).toBeDefined();

    const isVerified = AuthService.verifyEmail(user!.verificationToken!);
    expect(isVerified).toBe(true);

    const updatedUser = UserStore.findById(createdUserId);
    expect(updatedUser?.emailVerified).toBe(true);
    expect(updatedUser?.verificationToken).toBeUndefined();
  });

  it("handles password recovery and invalidates existing sessions", async () => {
    const resetToken = AuthService.requestPasswordReset(testEmail);
    expect(resetToken).not.toBeNull();

    const newPassword = "BrandNewSecurePass987!";
    const resetSuccess = await AuthService.resetPassword(resetToken!, newPassword);
    expect(resetSuccess).toBe(true);

    // Old sessions must be invalidated for security
    const oldSession = AuthService.getSession(sessionToken);
    expect(oldSession).toBeNull();

    // Must be able to login with new password
    const newLogin = await AuthService.login({
      email: testEmail,
      password: newPassword,
    });
    expect(newLogin.user.id).toBe(createdUserId);
  });

  it("updates user profile preferences correctly", () => {
    const updated = AuthService.updateProfile(createdUserId, {
      name: "Alex Q. Senior",
      baseCurrency: "EUR",
      timezone: "Europe/London",
    });

    expect(updated.name).toBe("Alex Q. Senior");
    expect(updated.baseCurrency).toBe("EUR");
    expect(updated.timezone).toBe("Europe/London");
  });

  it("exports machine-readable GDPR/CCPA data bundle", () => {
    const bundle = AuthService.exportUserData(createdUserId);
    expect(bundle.user.id).toBe(createdUserId);
    expect(bundle.user.email).toBe(testEmail.toLowerCase());
    expect(Array.isArray(bundle.auditLogs)).toBe(true);
    expect(bundle.auditLogs.length).toBeGreaterThan(0);
  });

  it("permanently purges account and active sessions upon deletion", () => {
    const isDeleted = AuthService.deleteAccount(createdUserId);
    expect(isDeleted).toBe(true);

    const checkUser = UserStore.findById(createdUserId);
    expect(checkUser).toBeNull();
  });
});
