"use client";

import React from "react";

interface WinLossDonutProps {
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
  size?: number;
}

export const WinLossDonut: React.FC<WinLossDonutProps> = ({
  wins,
  losses,
  breakEvens,
  winRate,
  size = 180,
}) => {
  const total = wins + losses + breakEvens;

  if (total === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "8px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "12px",
          textAlign: "center",
          padding: "16px",
        }}
      >
        No Trades
      </div>
    );
  }

  const radius = 60;
  const strokeWidth = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const winPct = wins / total;
  const lossPct = losses / total;
  const bePct = breakEvens / total;

  const winStroke = winPct * circumference;
  const lossStroke = lossPct * circumference;
  const beStroke = bePct * circumference;

  // SVG strokeDashoffset calculation
  const winOffset = 0;
  const lossOffset = -winStroke;
  const beOffset = -(winStroke + lossStroke);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--bg-subtle)"
            strokeWidth={strokeWidth}
          />

          {/* Win Segment (Emerald) */}
          {wins > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="var(--brand-emerald)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${winStroke} ${circumference}`}
              strokeDashoffset={winOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}

          {/* Loss Segment (Crimson) */}
          {losses > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="var(--brand-crimson)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${lossStroke} ${circumference}`}
              strokeDashoffset={lossOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}

          {/* Break-even Segment (Slate) */}
          {breakEvens > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="var(--text-muted)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${beStroke} ${circumference}`}
              strokeDashoffset={beOffset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          )}
        </svg>

        {/* Center Win Rate */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>
            {winRate.toFixed(1)}%
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Win Rate
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--brand-emerald)" }} />
          <span style={{ color: "var(--text-secondary)" }}>
            Wins: <strong>{wins}</strong> ({Math.round(winPct * 100)}%)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--brand-crimson)" }} />
          <span style={{ color: "var(--text-secondary)" }}>
            Losses: <strong>{losses}</strong> ({Math.round(lossPct * 100)}%)
          </span>
        </div>
        {breakEvens > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-secondary)" }}>
              Break-Even: <strong>{breakEvens}</strong> ({Math.round(bePct * 100)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
