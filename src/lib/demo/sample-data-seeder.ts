import { UserStore } from "../auth/user-store";
import { AccountStore } from "../accounts/account-store";
import { TradeStore } from "../trades/trade-store";
import { PlaybookStore } from "../playbooks/playbook-store";
import { DisciplineStore } from "../discipline/discipline-store";
import { JournalStore } from "../journal/journal-store";
import { StoredUser, UserSession } from "../auth/types";
import { TradingAccount, Trade, Playbook, DisciplineRule, JournalEntry } from "@/types";
import { generateSecureToken } from "../auth/crypto";

export const DEMO_USER_ID = "usr_sample_demo";
export const DEMO_USER_EMAIL = "demo@tradepulse.io";

export const DEMO_ACCOUNT_ID_1 = "acc_demo_sample_101";
export const DEMO_ACCOUNT_ID_2 = "acc_demo_sample_102";

export class SampleDataSeeder {
  /**
   * Ensure sample demo user, accounts, trades, playbooks, discipline rules, and journal are seeded
   */
  static seedDemoEnvironment(): { sessionToken: string; expiresAt: string } {
    // 1. Ensure Demo User
    let demoUser = UserStore.findById(DEMO_USER_ID);
    if (!demoUser) {
      demoUser = {
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        passwordHash: "$2a$12$DVRFyPw67woi5NJVkg5KFOocsIC4dQuXrO22DwyQj5Sl1ijj.dH/a", // Demo123!
        name: "Demo Trader (Sample Account)",
        role: "USER",
        baseCurrency: "USD",
        timezone: "America/New_York",
        emailVerified: true,
        twoFactorEnabled: false,
        isSuspended: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
      };
      UserStore.create(demoUser);
    }

    // 2. Ensure Sample Accounts
    const existingAccounts = AccountStore.findByUserId(DEMO_USER_ID);
    if (existingAccounts.length === 0) {
      const sampleAccounts: TradingAccount[] = [
        {
          id: DEMO_ACCOUNT_ID_1,
          userId: DEMO_USER_ID,
          name: "Apex 50k Prop Firm (Sample)",
          brokerName: "Tradovate",
          accountType: "PROP_EVALUATION",
          assetClass: "FUTURES",
          initialBalance: 50000.0,
          currentBalance: 53420.0,
          currency: "USD",
          status: "ACTIVE",
          description: "Isolated sample evaluation account with simulated trade data",
          createdAt: "2026-09-01T08:00:00.000Z",
        },
        {
          id: DEMO_ACCOUNT_ID_2,
          userId: DEMO_USER_ID,
          name: "Equities Swing Portfolio (Sample)",
          brokerName: "Interactive Brokers",
          accountType: "MARGIN",
          assetClass: "STOCKS",
          initialBalance: 25000.0,
          currentBalance: 26850.0,
          currency: "USD",
          status: "ACTIVE",
          description: "Isolated sample equities trading account",
          createdAt: "2026-09-15T08:00:00.000Z",
        },
      ];

      for (const acc of sampleAccounts) {
        AccountStore.create(acc);
      }
    }

    // 3. Ensure Sample Trades
    const existingTrades = TradeStore.findByUserId(DEMO_USER_ID);
    if (existingTrades.length === 0) {
      const sampleTrades: Trade[] = [
        {
          id: "trd_demo_01",
          userId: DEMO_USER_ID,
          accountId: DEMO_ACCOUNT_ID_1,
          accountName: "Apex 50k Prop Firm (Sample)",
          symbol: "NQ",
          assetClass: "FUTURES",
          direction: "LONG",
          status: "CLOSED",
          entryTime: "2026-10-12 14:32:00",
          exitTime: "2026-10-12 14:48:00",
          entryPrice: 18250.25,
          exitPrice: 18275.5,
          quantity: 2,
          contractMultiplier: 20.0,
          stopLoss: 18235.0,
          takeProfit: 18285.0,
          initialRisk: 610.0,
          grossPnl: 1010.0,
          fees: 12.5,
          commissions: 6.0,
          netPnl: 991.5,
          returnPct: 1.86,
          rMultiple: 1.63,
          rating: 5,
          marketSession: "NY Open",
          playbookName: "NY Open Breakout",
          notes: "Sample trade: Clean liquidity sweep of Asian session high during early NY open.",
          tags: [{ id: "tag_demo_1", tradeId: "trd_demo_01", tagType: "SETUP", tagValue: "Liquidity Sweep" }],
          executions: [
            {
              id: "exec_demo_1a",
              tradeId: "trd_demo_01",
              executionType: "ENTRY",
              orderAction: "BUY",
              timestamp: "2026-10-12 14:32:00",
              price: 18250.25,
              quantity: 2,
              fees: 9.25,
            },
            {
              id: "exec_demo_1b",
              tradeId: "trd_demo_01",
              executionType: "EXIT",
              orderAction: "SELL",
              timestamp: "2026-10-12 14:48:00",
              price: 18275.5,
              quantity: 2,
              fees: 9.25,
            },
          ],
          createdAt: "2026-10-12T14:48:00.000Z",
        },
        {
          id: "trd_demo_02",
          userId: DEMO_USER_ID,
          accountId: DEMO_ACCOUNT_ID_1,
          accountName: "Apex 50k Prop Firm (Sample)",
          symbol: "ES",
          assetClass: "FUTURES",
          direction: "SHORT",
          status: "CLOSED",
          entryTime: "2026-10-12 10:15:00",
          exitTime: "2026-10-12 10:45:00",
          entryPrice: 5042.5,
          exitPrice: 5034.0,
          quantity: 2,
          contractMultiplier: 50.0,
          stopLoss: 5047.5,
          takeProfit: 5030.0,
          initialRisk: 500.0,
          grossPnl: 850.0,
          fees: 9.5,
          commissions: 5.0,
          netPnl: 835.5,
          returnPct: 1.58,
          rMultiple: 1.67,
          rating: 4,
          marketSession: "London Close",
          playbookName: "VWAP Rejection",
          notes: "Sample trade: Rejection at upper standard deviation of VWAP band.",
          tags: [{ id: "tag_demo_2", tradeId: "trd_demo_02", tagType: "SETUP", tagValue: "VWAP Rejection" }],
          executions: [],
          createdAt: "2026-10-12T10:45:00.000Z",
        },
        {
          id: "trd_demo_03",
          userId: DEMO_USER_ID,
          accountId: DEMO_ACCOUNT_ID_1,
          accountName: "Apex 50k Prop Firm (Sample)",
          symbol: "CL",
          assetClass: "FUTURES",
          direction: "LONG",
          status: "CLOSED",
          entryTime: "2026-10-11 13:00:00",
          exitTime: "2026-10-11 13:30:00",
          entryPrice: 78.4,
          exitPrice: 78.05,
          quantity: 1,
          contractMultiplier: 1000.0,
          stopLoss: 78.05,
          initialRisk: 350.0,
          grossPnl: -350.0,
          fees: 8.0,
          commissions: 4.0,
          netPnl: -362.0,
          returnPct: -0.68,
          rMultiple: -1.03,
          rating: 3,
          marketSession: "NY Open",
          playbookName: "Momentum Continuation",
          notes: "Sample trade: Stopped out cleanly according to risk plan.",
          tags: [{ id: "tag_demo_3", tradeId: "trd_demo_03", tagType: "MISTAKE", tagValue: "Chased Entry" }],
          executions: [],
          createdAt: "2026-10-11T13:30:00.000Z",
        },
        {
          id: "trd_demo_04",
          userId: DEMO_USER_ID,
          accountId: DEMO_ACCOUNT_ID_2,
          accountName: "Equities Swing Portfolio (Sample)",
          symbol: "NVDA",
          assetClass: "STOCKS",
          direction: "LONG",
          status: "CLOSED",
          entryTime: "2026-10-10 15:30:00",
          exitTime: "2026-10-11 16:00:00",
          entryPrice: 128.5,
          exitPrice: 134.2,
          quantity: 100,
          contractMultiplier: 1.0,
          initialRisk: 400.0,
          grossPnl: 570.0,
          fees: 2.0,
          commissions: 0.0,
          netPnl: 568.0,
          returnPct: 4.42,
          rMultiple: 1.42,
          rating: 5,
          marketSession: "NY Afternoon",
          playbookName: "Tech Earnings Swing",
          notes: "Sample trade: Multi-day consolidation breakout.",
          tags: [{ id: "tag_demo_4", tradeId: "trd_demo_04", tagType: "SETUP", tagValue: "Consolidation Break" }],
          executions: [],
          createdAt: "2026-10-11T16:00:00.000Z",
        },
        {
          id: "trd_demo_05",
          userId: DEMO_USER_ID,
          accountId: DEMO_ACCOUNT_ID_1,
          accountName: "Apex 50k Prop Firm (Sample)",
          symbol: "NQ",
          assetClass: "FUTURES",
          direction: "SHORT",
          status: "OPEN",
          entryTime: "2026-10-13 14:00:00",
          entryPrice: 18320.0,
          quantity: 1,
          contractMultiplier: 20.0,
          stopLoss: 18350.0,
          takeProfit: 18240.0,
          initialRisk: 600.0,
          grossPnl: 0,
          fees: 6.0,
          commissions: 3.0,
          netPnl: -9.0,
          rating: 4,
          marketSession: "NY Open",
          playbookName: "NY Open Breakout",
          notes: "Sample trade: Active open swing short.",
          tags: [],
          executions: [],
          createdAt: "2026-10-13T14:00:00.000Z",
        },
      ];

      for (const t of sampleTrades) {
        TradeStore.create(t);
      }
    }

    // 4. Ensure Sample Playbooks
    const existingPlaybooks = PlaybookStore.findByUserId(DEMO_USER_ID);
    if (existingPlaybooks.length === 0) {
      const samplePlaybook: Playbook = {
        id: "pb_demo_1",
        userId: DEMO_USER_ID,
        name: "NY Open Breakout (Sample)",
        description: "5-minute liquidity sweep followed by market structure shift at 09:30 AM NY Open",
        setupRules: "1. Identify Asian session high/low. 2. Wait for sweep and 5m displacement.",
        entryCriteria: "Close outside the first 15-minute range with above-average volume",
        exitCriteria: "Trail stop behind 5m swing pivots; scale out 50% at 2R",
        riskRules: "Max 1.0% account equity risk per trade ($500 max loss)",
        preferredSession: "NY Open",
        createdAt: "2026-09-01T00:00:00.000Z",
      };
      PlaybookStore.create(samplePlaybook);
    }

    // 5. Ensure Sample Discipline Rules
    const existingRules = DisciplineStore.getRulesByUserId(DEMO_USER_ID);
    if (existingRules.length === 0) {
      const sampleRule: DisciplineRule = {
        id: "rule_demo_1",
        userId: DEMO_USER_ID,
        title: "Max 3 Trades Per Day (Sample)",
        description: "Strictly cease trading after 3 executed setups to prevent overtrading fatigue",
        ruleType: "DAILY",
        isActive: true,
        createdAt: "2026-09-01T00:00:00.000Z",
      };
      DisciplineStore.createRule(sampleRule);
    }

    // 6. Issue dedicated session token
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const session: UserSession = {
      sessionId: sessionToken,
      userId: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      name: "Demo Trader (Sample Account)",
      role: "USER",
      expiresAt,
    };
    UserStore.saveSession(session);

    return { sessionToken, expiresAt };
  }
}
