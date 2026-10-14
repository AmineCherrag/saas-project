import Decimal from "decimal.js";
import { Trade } from "@/types";
import { AnalyticsService, TimeRangeFilter } from "./analytics-service";

export interface DimensionMetric {
  key: string;
  label: string;
  tradeCount: number;
  winningCount: number;
  losingCount: number;
  breakEvenCount: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  profitFactor: number;
  avgTrade: number;
  avgWinner: number;
  avgLoser: number;
  totalFees: number;
  avgRMultiple?: number;
}

export interface MistakeCostMetric {
  tagValue: string;
  occurrenceCount: number;
  totalLossAttributed: number;
  avgLossPerMistake: number;
  largestLoss: number;
}

export interface QuantitativeReport {
  hourlyDistribution: DimensionMetric[];
  sessionDistribution: DimensionMetric[];
  dayOfWeekDistribution: DimensionMetric[];
  symbolDistribution: DimensionMetric[];
  playbookDistribution: DimensionMetric[];
  durationDistribution: DimensionMetric[];
  mistakeCostLedger: MistakeCostMetric[];
  totalDisciplineCost: number;
  summary: {
    totalTrades: number;
    totalNetPnl: number;
    bestHour: string;
    bestDayOfWeek: string;
    bestSession: string;
    bestSymbol: string;
    bestPlaybook: string;
  };
}

function computeMetricsForGroup(key: string, label: string, groupTrades: Trade[]): DimensionMetric {
  let grossProfit = new Decimal(0);
  let grossLoss = new Decimal(0);
  let totalNetPnl = new Decimal(0);
  let totalFees = new Decimal(0);
  let winningCount = 0;
  let losingCount = 0;
  let breakEvenCount = 0;
  let totalR = new Decimal(0);
  let rCount = 0;

  for (const t of groupTrades) {
    const net = new Decimal(t.netPnl);
    totalNetPnl = totalNetPnl.plus(net);
    totalFees = totalFees.plus(t.fees + t.commissions);

    if (net.greaterThan(0)) {
      winningCount++;
      grossProfit = grossProfit.plus(net);
    } else if (net.lessThan(0)) {
      losingCount++;
      grossLoss = grossLoss.plus(net.abs());
    } else {
      breakEvenCount++;
    }

    if (t.rMultiple !== undefined && t.rMultiple !== null) {
      totalR = totalR.plus(t.rMultiple);
      rCount++;
    }
  }

  const count = groupTrades.length;
  const winRate = count > 0 ? (winningCount / count) * 100 : 0;
  const profitFactor = grossLoss.greaterThan(0)
    ? grossProfit.dividedBy(grossLoss).toNumber()
    : grossProfit.greaterThan(0)
    ? 999
    : 0;
  const avgTrade = count > 0 ? totalNetPnl.dividedBy(count).toNumber() : 0;
  const avgWinner = winningCount > 0 ? grossProfit.dividedBy(winningCount).toNumber() : 0;
  const avgLoser = losingCount > 0 ? grossLoss.dividedBy(losingCount).toNumber() : 0;
  const avgRMultiple = rCount > 0 ? totalR.dividedBy(rCount).toNumber() : undefined;

  return {
    key,
    label,
    tradeCount: count,
    winningCount,
    losingCount,
    breakEvenCount,
    winRate: Math.round(winRate * 10) / 10,
    grossProfit: Math.round(grossProfit.toNumber() * 100) / 100,
    grossLoss: Math.round(grossLoss.toNumber() * 100) / 100,
    netPnl: Math.round(totalNetPnl.toNumber() * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgTrade: Math.round(avgTrade * 100) / 100,
    avgWinner: Math.round(avgWinner * 100) / 100,
    avgLoser: Math.round(avgLoser * 100) / 100,
    totalFees: Math.round(totalFees.toNumber() * 100) / 100,
    avgRMultiple: avgRMultiple !== undefined ? Math.round(avgRMultiple * 100) / 100 : undefined,
  };
}

export function deduceMarketSession(entryTimeStr: string, specifiedSession?: string): string {
  if (specifiedSession && specifiedSession.trim().length > 0) {
    return specifiedSession.trim();
  }

  const date = new Date(entryTimeStr);
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const totalMinutes = hour * 60 + minute;

  // EST mapping (UTC - 4 / - 5, standard US market hours ~ 13:30 to 20:00 UTC)
  if (totalMinutes >= 810 && totalMinutes < 930) {
    return "NY Open (09:30 - 11:30 EST)";
  } else if (totalMinutes >= 930 && totalMinutes < 1080) {
    return "NY Midday (11:30 - 14:00 EST)";
  } else if (totalMinutes >= 1080 && totalMinutes < 1200) {
    return "NY Power Hour (14:00 - 16:00 EST)";
  } else if (totalMinutes >= 480 && totalMinutes < 810) {
    return "London / Pre-Market";
  } else if (totalMinutes >= 1200 && totalMinutes < 1440) {
    return "After Hours";
  } else {
    return "Asian Session";
  }
}

export function deduceDurationBucket(entryTimeStr: string, exitTimeStr?: string): string {
  if (!exitTimeStr) return "Open / Intraday";
  const start = new Date(entryTimeStr).getTime();
  const end = new Date(exitTimeStr).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return "Scalp (< 5m)";

  const diffMinutes = (end - start) / (1000 * 60);
  if (diffMinutes < 5) return "Scalp (< 5m)";
  if (diffMinutes <= 15) return "Momentum (5 - 15m)";
  if (diffMinutes <= 60) return "Trend (15 - 60m)";
  if (diffMinutes <= 240) return "Session (1 - 4h)";
  return "Swing (> 4h)";
}

export class ReportingService {
  /**
   * Compute comprehensive multi-dimensional quantitative report
   */
  static getQuantitativeReport(userId: string, filters: TimeRangeFilter = {}): QuantitativeReport {
    const trades = AnalyticsService.getFilteredTrades(userId, filters);

    // 1. Hourly Distribution (00:00 to 23:00)
    const hourlyMap = new Map<number, Trade[]>();
    for (const t of trades) {
      const h = new Date(t.entryTime).getUTCHours();
      const list = hourlyMap.get(h) || [];
      list.push(t);
      hourlyMap.set(h, list);
    }
    const hourlyDistribution: DimensionMetric[] = Array.from(hourlyMap.entries())
      .map(([hour, group]) => {
        const hourLabel = `${String(hour).padStart(2, "0")}:00`;
        return computeMetricsForGroup(String(hour), hourLabel, group);
      })
      .sort((a, b) => parseInt(a.key, 10) - parseInt(b.key, 10));

    // 2. Market Session Breakdown
    const sessionMap = new Map<string, Trade[]>();
    for (const t of trades) {
      const sess = deduceMarketSession(t.entryTime, t.marketSession);
      const list = sessionMap.get(sess) || [];
      list.push(t);
      sessionMap.set(sess, list);
    }
    const sessionDistribution: DimensionMetric[] = Array.from(sessionMap.entries())
      .map(([sess, group]) => computeMetricsForGroup(sess, sess, group))
      .sort((a, b) => b.tradeCount - a.tradeCount);

    // 3. Day of Week Distribution (Monday = 1, Friday = 5)
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayMap = new Map<number, Trade[]>();
    for (const t of trades) {
      const day = new Date(t.entryTime).getUTCDay();
      const list = dayMap.get(day) || [];
      list.push(t);
      dayMap.set(day, list);
    }
    const dayOfWeekDistribution: DimensionMetric[] = [1, 2, 3, 4, 5, 0, 6]
      .filter((dayNum) => dayMap.has(dayNum))
      .map((dayNum) => {
        const group = dayMap.get(dayNum)!;
        return computeMetricsForGroup(String(dayNum), dayNames[dayNum], group);
      });

    // 4. Symbol & Instrument Breakdown
    const symbolMap = new Map<string, Trade[]>();
    for (const t of trades) {
      const sym = t.symbol.trim().toUpperCase();
      const list = symbolMap.get(sym) || [];
      list.push(t);
      symbolMap.set(sym, list);
    }
    const symbolDistribution: DimensionMetric[] = Array.from(symbolMap.entries())
      .map(([sym, group]) => computeMetricsForGroup(sym, sym, group))
      .sort((a, b) => b.netPnl - a.netPnl);

    // 5. Playbook Setup Breakdown
    const playbookMap = new Map<string, Trade[]>();
    for (const t of trades) {
      const pb = t.playbookName || "Uncategorized";
      const list = playbookMap.get(pb) || [];
      list.push(t);
      playbookMap.set(pb, list);
    }
    const playbookDistribution: DimensionMetric[] = Array.from(playbookMap.entries())
      .map(([pb, group]) => computeMetricsForGroup(pb, pb, group))
      .sort((a, b) => b.netPnl - a.netPnl);

    // 6. Holding Duration Buckets
    const durationBuckets = [
      "Scalp (< 5m)",
      "Momentum (5 - 15m)",
      "Trend (15 - 60m)",
      "Session (1 - 4h)",
      "Swing (> 4h)",
    ];
    const durationMap = new Map<string, Trade[]>();
    for (const b of durationBuckets) {
      durationMap.set(b, []);
    }
    for (const t of trades) {
      const bucket = deduceDurationBucket(t.entryTime, t.exitTime);
      const list = durationMap.get(bucket) || [];
      list.push(t);
      durationMap.set(bucket, list);
    }
    const durationDistribution: DimensionMetric[] = durationBuckets
      .filter((b) => (durationMap.get(b)?.length || 0) > 0)
      .map((b) => computeMetricsForGroup(b, b, durationMap.get(b)!));

    // 7. Mistake Cost Ledger & Discipline Leakage
    const mistakeMap = new Map<string, { count: number; loss: Decimal; largest: number }>();
    let totalDisciplineLoss = new Decimal(0);

    for (const t of trades) {
      if (t.tags) {
        for (const tag of t.tags) {
          if (tag.tagType === "MISTAKE" && tag.tagValue) {
            const val = tag.tagValue.trim();
            const existing = mistakeMap.get(val) || { count: 0, loss: new Decimal(0), largest: 0 };
            existing.count++;

            // If trade resulted in a net loss, attribute it to this mistake
            if (t.netPnl < 0) {
              const lossAmount = new Decimal(t.netPnl).abs();
              existing.loss = existing.loss.plus(lossAmount);
              totalDisciplineLoss = totalDisciplineLoss.plus(lossAmount);
              if (lossAmount.toNumber() > existing.largest) {
                existing.largest = lossAmount.toNumber();
              }
            }
            mistakeMap.set(val, existing);
          }
        }
      }
    }

    const mistakeCostLedger: MistakeCostMetric[] = Array.from(mistakeMap.entries())
      .map(([tagValue, data]) => {
        const lossNum = data.loss.toNumber();
        return {
          tagValue,
          occurrenceCount: data.count,
          totalLossAttributed: Math.round(lossNum * 100) / 100,
          avgLossPerMistake: data.count > 0 ? Math.round((lossNum / data.count) * 100) / 100 : 0,
          largestLoss: Math.round(data.largest * 100) / 100,
        };
      })
      .sort((a, b) => b.totalLossAttributed - a.totalLossAttributed);

    // Identify top performers for summary highlights
    const bestHour = hourlyDistribution.length > 0
      ? [...hourlyDistribution].sort((a, b) => b.netPnl - a.netPnl)[0].label
      : "—";
    const bestDayOfWeek = dayOfWeekDistribution.length > 0
      ? [...dayOfWeekDistribution].sort((a, b) => b.netPnl - a.netPnl)[0].label
      : "—";
    const bestSession = sessionDistribution.length > 0
      ? [...sessionDistribution].sort((a, b) => b.netPnl - a.netPnl)[0].label
      : "—";
    const bestSymbol = symbolDistribution.length > 0
      ? symbolDistribution[0].label
      : "—";
    const bestPlaybook = playbookDistribution.length > 0
      ? playbookDistribution[0].label
      : "—";

    const totalNetPnl = trades.reduce((sum, t) => sum + t.netPnl, 0);

    return {
      hourlyDistribution,
      sessionDistribution,
      dayOfWeekDistribution,
      symbolDistribution,
      playbookDistribution,
      durationDistribution,
      mistakeCostLedger,
      totalDisciplineCost: Math.round(totalDisciplineLoss.toNumber() * 100) / 100,
      summary: {
        totalTrades: trades.length,
        totalNetPnl: Math.round(totalNetPnl * 100) / 100,
        bestHour,
        bestDayOfWeek,
        bestSession,
        bestSymbol,
        bestPlaybook,
      },
    };
  }
}
