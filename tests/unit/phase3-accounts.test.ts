import { describe, it, expect, beforeEach } from "vitest";
import { AccountService } from "@/lib/accounts/account-service";
import { AccountStore } from "@/lib/accounts/account-store";

describe("Phase 3: Trading Accounts Management Suite", () => {
  const userA = "usr_tenant_alpha";
  const userB = "usr_tenant_bravo";
  let accountIdUserA = "";

  it("successfully creates a trading account for User A", () => {
    const newAccount = AccountService.createAccount(userA, {
      name: "Apex 50k Futures #1",
      brokerName: "Tradovate",
      accountType: "PROP_EVALUATION",
      assetClass: "FUTURES",
      initialBalance: 50000.0,
      currency: "USD",
      description: "Prop evaluation challenge account",
    });

    expect(newAccount.id).toBeDefined();
    expect(newAccount.userId).toBe(userA);
    expect(newAccount.name).toBe("Apex 50k Futures #1");
    expect(newAccount.brokerName).toBe("Tradovate");
    expect(newAccount.accountType).toBe("PROP_EVALUATION");
    expect(newAccount.assetClass).toBe("FUTURES");
    expect(newAccount.initialBalance).toBe(50000.0);
    expect(newAccount.currentBalance).toBe(50000.0);
    expect(newAccount.status).toBe("ACTIVE");

    accountIdUserA = newAccount.id;
  });

  it("retrieves all active accounts scoped strictly to User A", () => {
    // Also create another account for User A
    AccountService.createAccount(userA, {
      name: "Interactive Brokers Live",
      brokerName: "Interactive Brokers",
      accountType: "MARGIN",
      assetClass: "STOCKS",
      initialBalance: 25000.0,
      currency: "USD",
    });

    const userAAccounts = AccountService.getAccountsByUser(userA);
    expect(userAAccounts.length).toBeGreaterThanOrEqual(2);
    userAAccounts.forEach((acc) => {
      expect(acc.userId).toBe(userA);
    });
  });

  it("guarantees multi-tenant data isolation: User B cannot access User A's account", () => {
    // User B attempts to access account created by User A
    expect(() => {
      AccountService.getAccountById(userB, accountIdUserA);
    }).toThrow("Trading account not found or access denied");

    // User B attempts to update User A's account
    expect(() => {
      AccountService.updateAccount(userB, accountIdUserA, {
        name: "Hacked Account Name",
      });
    }).toThrow("Trading account not found or access denied");

    // User B attempts to delete User A's account
    expect(() => {
      AccountService.deleteAccount(userB, accountIdUserA);
    }).toThrow("Trading account not found or access denied");
  });

  it("updates account details and category rules", () => {
    const updated = AccountService.updateAccount(userA, accountIdUserA, {
      name: "Apex 50k Funded Account (Passed)",
      accountType: "PROP_FUNDED",
      description: "Funded account milestone",
    });

    expect(updated.name).toBe("Apex 50k Funded Account (Passed)");
    expect(updated.accountType).toBe("PROP_FUNDED");
    expect(updated.description).toBe("Funded account milestone");
  });

  it("adjusts current balance accurately upon profit/loss realized", () => {
    // Win +$1,250.50
    const afterWin = AccountService.adjustAccountBalance(userA, accountIdUserA, 1250.5);
    expect(afterWin.currentBalance).toBe(51250.5);

    // Loss -$320.00
    const afterLoss = AccountService.adjustAccountBalance(userA, accountIdUserA, -320.0);
    expect(afterLoss.currentBalance).toBe(50930.5);
  });

  it("archives an account without deleting historical data", () => {
    const archived = AccountService.archiveAccount(userA, accountIdUserA);
    expect(archived.status).toBe("ARCHIVED");

    // Filter by ACTIVE should no longer include this archived account
    const activeAccounts = AccountService.getAccountsByUser(userA, "ACTIVE");
    const found = activeAccounts.find((a) => a.id === accountIdUserA);
    expect(found).toBeUndefined();

    // Filter by ARCHIVED should include it
    const archivedAccounts = AccountService.getAccountsByUser(userA, "ARCHIVED");
    const foundArchived = archivedAccounts.find((a) => a.id === accountIdUserA);
    expect(foundArchived).toBeDefined();
  });

  it("deletes account successfully when confirmed", () => {
    const deleted = AccountService.deleteAccount(userA, accountIdUserA);
    expect(deleted).toBe(true);

    expect(() => {
      AccountService.getAccountById(userA, accountIdUserA);
    }).toThrow("not found");
  });
});
