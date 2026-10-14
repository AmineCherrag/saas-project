import { TradingAccount, AccountStatus } from "@/types";
import {
  createAccountSchema,
  updateAccountSchema,
  CreateAccountInput,
  UpdateAccountInput,
} from "./validation";
import { AccountStore } from "./account-store";
import { UserStore } from "../auth/user-store";

export class AccountService {
  /**
   * Create a new trading account for a tenant
   */
  static createAccount(userId: string, input: CreateAccountInput): TradingAccount {
    const validated = createAccountSchema.parse(input);

    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAccount: TradingAccount = {
      id: accountId,
      userId,
      name: validated.name,
      brokerName: validated.brokerName,
      accountType: validated.accountType,
      assetClass: validated.assetClass,
      initialBalance: validated.initialBalance,
      currentBalance: validated.initialBalance,
      currency: validated.currency,
      status: "ACTIVE",
      description: validated.description,
      createdAt: new Date().toISOString(),
    };

    AccountStore.create(newAccount);

    UserStore.logAudit({
      userId,
      action: "ACCOUNT_CREATED",
      details: { accountId, name: newAccount.name, broker: newAccount.brokerName },
    });

    return newAccount;
  }

  /**
   * Retrieve all trading accounts belonging to a specific user
   */
  static getAccountsByUser(userId: string, status?: AccountStatus): TradingAccount[] {
    return AccountStore.findByUserId(userId, status);
  }

  /**
   * Retrieve a specific trading account ensuring strict tenant isolation
   */
  static getAccountById(userId: string, accountId: string): TradingAccount {
    const account = AccountStore.findById(accountId);
    if (!account || account.userId !== userId) {
      throw new Error("Trading account not found or access denied.");
    }
    return account;
  }

  /**
   * Update trading account details
   */
  static updateAccount(
    userId: string,
    accountId: string,
    input: UpdateAccountInput
  ): TradingAccount {
    const existing = this.getAccountById(userId, accountId);
    const validated = updateAccountSchema.parse(input);

    const updated = AccountStore.update(existing.id, validated);
    if (!updated) {
      throw new Error("Failed to update trading account.");
    }

    UserStore.logAudit({
      userId,
      action: "ACCOUNT_UPDATED",
      details: { accountId, updates: validated },
    });

    return updated;
  }

  /**
   * Archive a trading account without deleting historical data
   */
  static archiveAccount(userId: string, accountId: string): TradingAccount {
    return this.updateAccount(userId, accountId, { status: "ARCHIVED" });
  }

  /**
   * Delete a trading account permanently
   */
  static deleteAccount(userId: string, accountId: string): boolean {
    const existing = this.getAccountById(userId, accountId);
    const success = AccountStore.delete(existing.id);

    if (success) {
      UserStore.logAudit({
        userId,
        action: "ACCOUNT_DELETED",
        details: { accountId },
      });
    }

    return success;
  }

  /**
   * Adjust account balance after closed trade execution
   */
  static adjustAccountBalance(
    userId: string,
    accountId: string,
    netPnlDelta: number
  ): TradingAccount {
    const account = this.getAccountById(userId, accountId);
    const newBalance = Math.round((account.currentBalance + netPnlDelta) * 100) / 100;

    const updated = AccountStore.update(account.id, { currentBalance: newBalance });
    if (!updated) {
      throw new Error("Failed to update account balance.");
    }

    return updated;
  }
}
