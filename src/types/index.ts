// TradePulse Core TypeScript Data Types

export type UserRole = "USER" | "ADMIN";

export type AccountType =
  | "CASH"
  | "MARGIN"
  | "PROP_EVALUATION"
  | "PROP_FUNDED"
  | "DEMO";

export type AssetClass =
  | "STOCKS"
  | "FUTURES"
  | "FOREX"
  | "CRYPTO"
  | "OPTIONS"
  | "CFDS";

export type AccountStatus = "ACTIVE" | "ARCHIVED" | "BREACHED";

export type TradeDirection = "LONG" | "SHORT";

export type TradeStatus = "OPEN" | "CLOSED";

export type ExecutionType = "ENTRY" | "EXIT";

export type OrderAction = "BUY" | "SELL";

export type TagType = "MISTAKE" | "SETUP" | "MARKET_CONDITION" | "CUSTOM";

export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | "UNPAID"
  | "EXPIRED";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  baseCurrency: string;
  timezone: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface TradingAccount {
  id: string;
  userId: string;
  name: string;
  brokerName: string;
  accountType: AccountType;
  assetClass: AssetClass;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  status: AccountStatus;
  description?: string;
  createdAt: string;
}

export interface Execution {
  id: string;
  tradeId: string;
  executionType: ExecutionType;
  orderAction: OrderAction;
  timestamp: string;
  price: number;
  quantity: number;
  fees: number;
  notes?: string;
}

export interface TradeTag {
  id: string;
  tradeId: string;
  tagType: TagType;
  tagValue: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountId: string;
  accountName?: string;
  playbookId?: string;
  playbookName?: string;
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  status: TradeStatus;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  contractMultiplier: number;
  stopLoss?: number;
  takeProfit?: number;
  initialRisk?: number;
  grossPnl: number;
  fees: number;
  commissions: number;
  netPnl: number;
  returnPct?: number;
  rMultiple?: number;
  rating?: number;
  marketSession?: string;
  notes?: string;
  tags?: TradeTag[];
  executions?: Execution[];
  attachments?: string[];
  createdAt: string;
}

export interface Playbook {
  id: string;
  userId: string;
  name: string;
  description?: string;
  setupRules: string;
  entryCriteria: string;
  exitCriteria: string;
  riskRules: string;
  preferredSession?: string;
  winRate?: number;
  tradeCount?: number;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  entryDate: string; // YYYY-MM-DD
  title: string;
  preSessionPlan?: string;
  postSessionReview?: string;
  emotionalScore?: number; // 1-10
  marketSentiment?: "Bullish" | "Bearish" | "Neutral";
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DisciplineRule {
  id: string;
  userId: string;
  title: string;
  description?: string;
  ruleType: "DAILY" | "WEEKLY" | "PER_TRADE";
  targetValue?: string;
  isActive: boolean;
  createdAt: string;
}

export interface DisciplineLog {
  id: string;
  userId: string;
  ruleId: string;
  logDate: string;
  isAdhered: boolean;
  notes?: string;
}

export interface DashboardMetrics {
  netPnl: number;
  grossPnl: number;
  totalFees: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number; // percentage (0 - 100)
  profitFactor: number;
  expectancy: number;
  avgWinner: number;
  avgLoser: number;
  winLossRatio: number;
  avgRMultiple: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  largestWinner: number;
  largestLoser: number;
  avgHoldingTimeMinutes: number;
}

export interface CalendarDayStats {
  date: string; // YYYY-MM-DD
  netPnl: number;
  tradeCount: number;
  winRate: number;
  trades?: Trade[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: "starter" | "pro" | "elite";
  priceMonthly: number;
  priceYearly: number;
  maxAccounts: number;
  maxTradesPerMonth: number;
  hasCsvImport: boolean;
  hasAdvancedAnalytics: boolean;
  hasPlaybooks: boolean;
  hasAiMentor: boolean;
  hasReplay: boolean;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval: "monthly" | "yearly";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "PAID" | "PENDING" | "FAILED";
  planName: string;
  date: string;
  pdfUrl?: string;
}

export interface ImportBatch {
  id: string;
  userId: string;
  accountId: string;
  brokerPreset: string;
  fileName: string;
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
  tradeIds: string[];
  status: "COMPLETED" | "REVERTED";
  createdAt: string;
}

export interface ImportPreviewRow {
  rowIndex: number;
  symbol: string;
  direction: TradeDirection;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  fees: number;
  commissions: number;
  netPnl?: number;
  isValid: boolean;
  isDuplicate: boolean;
  validationError?: string;
  fingerprint: string;
}

export interface ImportPreviewResult {
  fileName: string;
  brokerPreset: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  detectedHeaders: string[];
  sampleRows: ImportPreviewRow[];
}

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketCategory =
  | "BILLING"
  | "BUG_REPORT"
  | "FEATURE_REQUEST"
  | "BROKER_IMPORT"
  | "GENERAL";

export interface TicketMessage {
  id: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  messages: TicketMessage[];
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  mrr: number;
  totalSubscribers: number;
  activeSubscribers: number;
  trialingSubscribers: number;
  churnRate: number;
  totalTradesLogged: number;
  totalAccountsConnected: number;
  openTicketsCount: number;
}

