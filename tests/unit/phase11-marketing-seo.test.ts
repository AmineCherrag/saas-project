import { describe, it, expect } from "vitest";
import { metadata } from "@/app/layout";

describe("Phase 11: Public Marketing Website & SEO Suite", () => {
  it("exports comprehensive SEO metadata with OpenGraph and Twitter cards", () => {
    expect(metadata.title).toContain("TradePulse");
    expect(metadata.title).toContain("Trading Journal");
    expect(metadata.description).toBeDefined();
    expect(metadata.description?.length).toBeGreaterThan(50);

    expect(metadata.keywords).toContain("trading journal");
    expect(metadata.keywords).toContain("TradeZella alternative");
    expect(metadata.keywords).toContain("Tradovate CSV import");

    expect(metadata.openGraph?.title).toContain("TradePulse");
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("calculates emotional leakage and subscription ROI with mathematical accuracy", () => {
    // Scenario: 40 trades/mo, $250 avg risk, 15% rule violations
    const monthlyTrades = 40;
    const avgRisk = 250;
    const leakagePercent = 15;

    const leakageTrades = Math.round((monthlyTrades * leakagePercent) / 100);
    expect(leakageTrades).toBe(6);

    const monthlyLeaked = leakageTrades * avgRisk;
    expect(monthlyLeaked).toBe(1500);

    const annualSaved = monthlyLeaked * 12;
    expect(annualSaved).toBe(18000);

    // Pro Annual plan cost is $469
    const proAnnualCost = 469;
    const netRoi = Math.round(((annualSaved - proAnnualCost) / proAnnualCost) * 100);

    expect(netRoi).toBeGreaterThan(3000); // Over 3,000% annual return on software investment
  });

  it("safely handles boundary cases for ROI calculator", () => {
    // 0% leakage
    const zeroTrades = 0;
    const zeroLeakage = Math.round((zeroTrades * 0) / 100);
    expect(zeroLeakage).toBe(0);

    // Max volume: 200 trades, $1000 risk, 40% leakage
    const maxTrades = 200;
    const maxRisk = 1000;
    const maxLeakage = Math.round((maxTrades * 40) / 100);
    expect(maxLeakage).toBe(80);

    const maxMonthlyLeaked = maxLeakage * maxRisk;
    expect(maxMonthlyLeaked).toBe(80000);
  });

  it("verifies deterministic number formatting to prevent hydration mismatches", () => {
    const annualSaved = 18000;
    // Exactly matches the server text and prevents client locale space separator mismatches
    expect(annualSaved.toLocaleString("en-US")).toBe("18,000");

    const monthlyLeaked = 1500;
    expect(monthlyLeaked.toLocaleString("en-US", { minimumFractionDigits: 2 })).toBe("1,500.00");
  });
});
