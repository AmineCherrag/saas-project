import Decimal from "decimal.js";
import { Trade, DashboardMetrics, CalendarDayStats } from "@/types";
import { TradeStore } from "../trades/trade-store";

export interface TimeRangeFilter {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  timeRange?: "7d" | "30d" | "90d" | "ytd" | "1y" | "all";
}

export interface EquityCurvePoint {
  date: string;
  tradeId: string;
  symbol: string;
  tradeNetPnl: number;
  cumulativePnl: number;
  peakPnl: number;
  drawdown: number;
  drawdownPct: number;
}

export interface DailyPnlPoint {
  date: string;
  netPnl: number;
  grossPnl: number;
  fees: number;
  tradeCount: number;
  winningCount: number;
  losingCount: number;
  breakEvenCount: number;
  winRate: number;
}

export interface CalendarMonthData {
  yearMonth: string; // YYYY-MM
  monthName: string; // e.g. "October 2026"
  days: {
    date: string; // YYYY-MM-DD
    dayNumber: number; // 1-31
    dayOfWeek: number; // 0-6
    isCurrentMonth: boolean;
    netPnl: number;
    tradeCount: number;
    winningCount: number;
    losingCount: number;
    winRate: number;
    trades: Trade[];
  }[];
  weeklySummaries: {
    weekIndex: number;
    startDate: string;
    endDate: string;
    netPnl: number;
    tradeCount: number;
    greenDays: number;
    redDays: number;
  }[];
  monthSummary: {
    netPnl: number;
    grossPnl: number;
    fees: number;
    totalTrades: number;
    tradingDays: number;
    greenDays: number;
    redDays: number;
    breakEvenDays: number;
    dayWinRate: number;
    bestDay: { date: string; netPnl: number } | null;
    worstDay: { date: string; netPnl: number } | null;
  };
}

export interface ExecutiveDashboardData {
  metrics: DashboardMetrics;
  longStats: {
    tradeCount: number;
    winRate: number;
    netPnl: number;
    avgTrade: number;
  };
  shortStats: {
    tradeCount: number;
    winRate: number;
    netPnl: number;
    avgTrade: number;
  };
  equityCurve: EquityCurvePoint[];
  dailyPnlSeries: DailyPnlPoint[];
  recentTrades: Trade[];
}

export class AnalyticsService {
  /**
   * Filter user trades by account, status, and date range
   */
  static getFilteredTrades(userId: string, filters: TimeRangeFilter = {}): Trade[] {
    let trades = TradeStore.findByUserId(userId).filter((t) => t.status === "CLOSED");

    // Filter by account
    if (filters.accountId && filters.accountId !== "all") {
      trades = trades.filter((t) => t.accountId === filters.accountId);
    }

    // Filter by relative time range or explicit dates
    const now = new Date();
    let computedStart: Date | null = null;
    let computedEnd: Date | null = null;

    if (filters.timeRange && filters.timeRange !== "all") {
      computedEnd = new Date(now.getTime());
      if (filters.timeRange === "7d") {
        computedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.timeRange === "30d") {
        computedStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (filters.timeRange === "90d") {
        computedStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      } else if (filters.timeRange === "1y") {
        computedStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      } else if (filters.timeRange === "ytd") {
        computedStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      }
    }

    if (filters.startDate) {
      computedStart = new Date(filters.startDate);
    }
    if (filters.endDate) {
      computedEnd = new Date(filters.endDate);
    }

    if (computedStart) {
      trades = trades.filter((t) => new Date(t.entryTime).getTime() >= computedStart!.getTime());
    }
    if (computedEnd) {
      trades = trades.filter((t) => new Date(t.entryTime).getTime() <= computedEnd!.getTime());
    }

    // Sort chronologically ascending for analytical progression
    return trades.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
  }

  /**
   * Compute complete executive dashboard metrics with high-precision arithmetic
   */
  static getDashboardAnalytics(userId: string, filters: TimeRangeFilter = {}): ExecutiveDashboardData {
    const trades = this.getFilteredTrades(userId, filters);

    let grossProfit = new Decimal(0);
    let grossLoss = new Decimal(0);
    let totalGrossPnl = new Decimal(0);
    let totalFees = new Decimal(0);
    let totalNetPnl = new Decimal(0);

    let winningCount = 0;
    let losingCount = 0;
    let breakEvenCount = 0;

    let largestWinner = 0;
    let largestLoser = 0;
    let totalR = new Decimal(0);
    let tradesWithR = 0;
    let totalHoldingMinutes = 0;
    let tradesWithDuration = 0;

    // Direction breakdown
    let longCount = 0;
    let longWins = 0;
    let longNet = new Decimal(0);

    let shortCount = 0;
    let shortWins = 0;
    let shortNet = new Decimal(0);

    // Equity Curve Points
    const equityCurve: EquityCurvePoint[] = [];
    let cumulativePnl = new Decimal(0);
    let peakEquity = new Decimal(0);
    let maxDrawdown = new Decimal(0);
    let maxDrawdownPct = new Decimal(0);

    for (const trade of trades) {
      const net = new Decimal(trade.netPnl);
      const gross = new Decimal(trade.grossPnl);
      const fees = new Decimal(trade.fees).plus(trade.commissions);

      totalNetPnl = totalNetPnl.plus(net);
      totalGrossPnl = totalGrossPnl.plus(gross);
      totalFees = totalFees.plus(fees);

      cumulativePnl = cumulativePnl.plus(net);
      if (cumulativePnl.greaterThan(peakEquity)) {
        peakEquity = cumulativePnl;
      }
      const currentDrawdown = peakEquity.minus(cumulativePnl);
      if (currentDrawdown.greaterThan(maxDrawdown)) {
        maxDrawdown = currentDrawdown;
        if (peakEquity.greaterThan(0)) {
          const ddPct = currentDrawdown.dividedBy(peakEquity).times(100);
          if (ddPct.greaterThan(maxDrawdownPct)) {
            maxDrawdownPct = ddPct;
          }
        }
      }

      equityCurve.push({
        date: trade.entryTime,
        tradeId: trade.id,
        symbol: trade.symbol,
        tradeNetPnl: net.toNumber(),
        cumulativePnl: cumulativePnl.toNumber(),
        peakPnl: peakEquity.toNumber(),
        drawdown: currentDrawdown.toNumber(),
        drawdownPct: peakEquity.greaterThan(0) ? currentDrawdown.dividedBy(peakEquity).times(100).toNumber() : 0,
      });

      if (net.greaterThan(0)) {
        winningCount++;
        grossProfit = grossProfit.plus(net);
        if (net.toNumber() > largestWinner) {
          largestWinner = net.toNumber();
        }
      } else if (net.lessThan(0)) {
        losingCount++;
        grossLoss = grossLoss.plus(net.abs());
        if (net.toNumber() < largestLoser) {
          largestLoser = net.toNumber();
        }
      } else {
        breakEvenCount++;
      }

      if (trade.rMultiple !== undefined && trade.rMultiple !== null) {
        totalR = totalR.plus(trade.rMultiple);
        tradesWithR++;
      }

      if (trade.exitTime) {
        const entryMs = new Date(trade.entryTime).getTime();
        const exitMs = new Date(trade.exitTime).getTime();
        if (exitMs > entryMs) {
          totalHoldingMinutes += (exitMs - entryMs) / (1000 * 60);
          tradesWithDuration++;
        }
      }

      // Direction metrics
      if (trade.direction === "LONG") {
        longCount++;
        longNet = longNet.plus(net);
        if (net.greaterThan(0)) longWins++;
      } else {
        shortCount++;
        shortNet = shortNet.plus(net);
        if (net.greaterThan(0)) shortWins++;
      }
    }

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? new Decimal(winningCount).dividedBy(totalTrades).times(100).toNumber() : 0;
    const profitFactor = grossLoss.greaterThan(0)
      ? grossProfit.dividedBy(grossLoss).toNumber()
      : grossProfit.greaterThan(0)
      ? 999
      : 0;
    const expectancy = totalTrades > 0 ? totalNetPnl.dividedBy(totalTrades).toNumber() : 0;
    const avgWinner = winningCount > 0 ? grossProfit.dividedBy(winningCount).toNumber() : 0;
    const avgLoser = losingCount > 0 ? grossLoss.dividedBy(losingCount).toNumber() : 0;
    const winLossRatio = avgLoser > 0 ? new Decimal(avgWinner).dividedBy(avgLoser).toNumber() : avgWinner > 0 ? 999 : 0;
    const avgRMultiple = tradesWithR > 0 ? totalR.dividedBy(tradesWithR).toNumber() : 0;
    const avgHoldingTimeMinutes = tradesWithDuration > 0 ? Math.round(totalHoldingMinutes / tradesWithDuration) : 0;

    // Daily distribution series
    const dailyMap = new Map<string, { net: Decimal; gross: Decimal; fees: Decimal; wins: number; losses: number; be: number }>();
    for (const trade of trades) {
      const dayKey = trade.entryTime.substring(0, 10);
      const existing = dailyMap.get(dayKey) || {
        net: new Decimal(0),
        gross: new Decimal(0),
        fees: new Decimal(0),
        wins: 0,
        losses: 0,
        be: 0,
      };

      const tradeNet = new Decimal(trade.netPnl);
      existing.net = existing.net.plus(tradeNet);
      existing.gross = existing.gross.plus(trade.grossPnl);
      existing.fees = existing.fees.plus(trade.fees + trade.commissions);

      if (tradeNet.greaterThan(0)) existing.wins++;
      else if (tradeNet.lessThan(0)) existing.losses++;
      else existing.be++;

      dailyMap.set(dayKey, existing);
    }

    const dailyPnlSeries: DailyPnlPoint[] = Array.from(dailyMap.entries())
      .map(([date, data]) => {
        const count = data.wins + data.losses + data.be;
        return {
          date,
          netPnl: data.net.toNumber(),
          grossPnl: data.gross.toNumber(),
          fees: data.fees.toNumber(),
          tradeCount: count,
          winningCount: data.wins,
          losingCount: data.losses,
          breakEvenCount: data.be,
          winRate: count > 0 ? (data.wins / count) * 100 : 0,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const metrics: DashboardMetrics = {
      netPnl: totalNetPnl.toNumber(),
      grossPnl: totalGrossPnl.toNumber(),
      totalFees: totalFees.toNumber(),
      totalTrades,
      winningTrades: winningCount,
      losingTrades: losingCount,
      breakEvenTrades: breakEvenCount,
      winRate: Math.round(winRate * 10) / 10,
      profitFactor: Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      avgWinner: Math.round(avgWinner * 100) / 100,
      avgLoser: Math.round(avgLoser * 100) / 100,
      winLossRatio: Math.round(winLossRatio * 100) / 100,
      avgRMultiple: Math.round(avgRMultiple * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown.toNumber() * 100) / 100,
      maxDrawdownPct: Math.round(maxDrawdownPct.toNumber() * 10) / 10,
      largestWinner,
      largestLoser,
      avgHoldingTimeMinutes,
    };

    return {
      metrics,
      longStats: {
        tradeCount: longCount,
        winRate: longCount > 0 ? Math.round((longWins / longCount) * 1000) / 10 : 0,
        netPnl: longNet.toNumber(),
        avgTrade: longCount > 0 ? Math.round(longNet.dividedBy(longCount).toNumber() * 100) / 100 : 0,
      },
      shortStats: {
        tradeCount: shortCount,
        winRate: shortCount > 0 ? Math.round((shortWins / shortCount) * 1000) / 10 : 0,
        netPnl: shortNet.toNumber(),
        avgTrade: shortCount > 0 ? Math.round(shortNet.dividedBy(shortCount).toNumber() * 100) / 100 : 0,
      },
      equityCurve,
      dailyPnlSeries,
      recentTrades: [...trades].reverse().slice(0, 10),
    };
  }

  /**
   * Compute interactive monthly performance calendar with daily drill-down and weekly rollups
   */
  static getCalendarAnalytics(
    userId: string,
    yearMonth: string, // YYYY-MM
    accountId?: string
  ): CalendarMonthData {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed month

    const monthStartDate = new Date(Date.UTC(year, monthIndex, 1));
    const nextMonthStartDate = new Date(Date.UTC(year, monthIndex + 1, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    // Fetch user trades for this month
    let trades = TradeStore.findByUserId(userId).filter((t) => {
      if (t.status !== "CLOSED") return false;
      if (accountId && accountId !== "all" && t.accountId !== accountId) return false;
      const tradeDate = new Date(t.entryTime);
      return tradeDate >= monthStartDate && tradeDate < nextMonthStartDate;
    });

    // Group trades by day (1 to lastDayOfMonth)
    const dayTradesMap = new Map<number, Trade[]>();
    for (let day = 1; day <= lastDayOfMonth; day++) {
      dayTradesMap.set(day, []);
    }

    for (const trade of trades) {
      const tradeDate = new Date(trade.entryTime);
      const dayNum = tradeDate.getUTCDate();
      const list = dayTradesMap.get(dayNum) || [];
      list.push(trade);
      dayTradesMap.set(dayNum, list);
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = `${monthNames[monthIndex]} ${year}`;

    const days = [];
    let monthNetPnl = new Decimal(0);
    let monthGrossPnl = new Decimal(0);
    let monthFees = new Decimal(0);
    let greenDays = 0;
    let redDays = 0;
    let breakEvenDays = 0;
    let tradingDays = 0;

    let bestDay: { date: string; netPnl: number } | null = null;
    let worstDay: { date: string; netPnl: number } | null = null;

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayDate = new Date(Date.UTC(year, monthIndex, day));
      const dayOfWeek = dayDate.getUTCDay(); // 0 = Sunday, 6 = Saturday

      const dayTrades = dayTradesMap.get(day) || [];
      let dayNet = new Decimal(0);
      let dayGross = new Decimal(0);
      let dayFees = new Decimal(0);
      let wins = 0;
      let losses = 0;

      for (const t of dayTrades) {
        const net = new Decimal(t.netPnl);
        dayNet = dayNet.plus(net);
        dayGross = dayGross.plus(t.grossPnl);
        dayFees = dayFees.plus(t.fees + t.commissions);
        if (net.greaterThan(0)) wins++;
        else if (net.lessThan(0)) losses++;
      }

      const tradeCount = dayTrades.length;
      const dayWinRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
      const dayNetNum = dayNet.toNumber();

      if (tradeCount > 0) {
        tradingDays++;
        monthNetPnl = monthNetPnl.plus(dayNet);
        monthGrossPnl = monthGrossPnl.plus(dayGross);
        monthFees = monthFees.plus(dayFees);

        if (dayNet.greaterThan(0)) {
          greenDays++;
        } else if (dayNet.lessThan(0)) {
          redDays++;
        } else {
          breakEvenDays++;
        }

        if (!bestDay || dayNetNum > bestDay.netPnl) {
          bestDay = { date: dateStr, netPnl: dayNetNum };
        }
        if (!worstDay || dayNetNum < worstDay.netPnl) {
          worstDay = { date: dateStr, netPnl: dayNetNum };
        }
      }

      days.push({
        date: dateStr,
        dayNumber: day,
        dayOfWeek,
        isCurrentMonth: true,
        netPnl: dayNetNum,
        tradeCount,
        winningCount: wins,
        losingCount: losses,
        winRate: Math.round(dayWinRate * 10) / 10,
        trades: dayTrades,
      });
    }

    // Calculate weekly rollups
    const weeklySummaries = [];
    let currentWeekDays: typeof days = [];
    let weekIndex = 1;

    for (let i = 0; i < days.length; i++) {
      currentWeekDays.push(days[i]);
      // End of week on Saturday (dayOfWeek === 6) or last day of month
      if (days[i].dayOfWeek === 6 || i === days.length - 1) {
        let weekNet = new Decimal(0);
        let weekTrades = 0;
        let weekGreen = 0;
        let weekRed = 0;

        for (const wd of currentWeekDays) {
          weekNet = weekNet.plus(wd.netPnl);
          weekTrades += wd.tradeCount;
          if (wd.tradeCount > 0) {
            if (wd.netPnl > 0) weekGreen++;
            else if (wd.netPnl < 0) weekRed++;
          }
        }

        weeklySummaries.push({
          weekIndex,
          startDate: currentWeekDays[0].date,
          endDate: currentWeekDays[currentWeekDays.length - 1].date,
          netPnl: weekNet.toNumber(),
          tradeCount: weekTrades,
          greenDays: weekGreen,
          redDays: weekRed,
        });

        weekIndex++;
        currentWeekDays = [];
      }
    }

    const dayWinRate = tradingDays > 0 ? (greenDays / tradingDays) * 100 : 0;

    return {
      yearMonth,
      monthName,
      days,
      weeklySummaries,
      monthSummary: {
        netPnl: monthNetPnl.toNumber(),
        grossPnl: monthGrossPnl.toNumber(),
        fees: monthFees.toNumber(),
        totalTrades: trades.length,
        tradingDays,
        greenDays,
        redDays,
        breakEvenDays,
        dayWinRate: Math.round(dayWinRate * 10) / 10,
        bestDay,
        worstDay,
      },
    };
  }
}
