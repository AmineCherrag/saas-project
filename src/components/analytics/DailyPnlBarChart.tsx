"use client";

import React, { useState } from "react";
import { DailyPnlPoint } from "@/lib/analytics/analytics-service";

interface DailyPnlBarChartProps {
  data: DailyPnlPoint[];
  height?: number;
}

export const DailyPnlBarChart: React.FC<DailyPnlBarChartProps> = ({
  data,
  height = 260,
}) => {
  const [hoveredBar, setHoveredBar] = useState<DailyPnlPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: "14px",
          background: "rgba(255, 255, 255, 0.01)",
          borderRadius: "var(--radius-md)",
          border: "1px dashed var(--border-subtle)",
        }}
      >
        No daily trade activity recorded in this period.
      </div>
    );
  }

  const values = data.map((d) => d.netPnl);
  const maxAbs = Math.max(100, ...values.map((v) => Math.abs(v)));

  const width = 800;
  const padding = { top: 20, right: 20, bottom: 35, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const zeroY = padding.top + chartHeight / 2;
  const barWidth = Math.max(6, Math.min(32, (chartWidth / data.length) * 0.7));
  const step = chartWidth / data.length;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {/* Zero baseline */}
        <line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke="var(--border-default)"
          strokeWidth="1.5"
        />

        {/* Top and Bottom reference lines */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={width - padding.right}
          y2={padding.top}
          stroke="var(--border-subtle)"
          strokeDasharray="3,3"
          strokeWidth="1"
        />
        <text
          x={padding.left - 10}
          y={padding.top + 4}
          fill="var(--text-muted)"
          fontSize="10"
          textAnchor="end"
        >
          +${Math.round(maxAbs).toLocaleString("en-US")}
        </text>

        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="var(--border-subtle)"
          strokeDasharray="3,3"
          strokeWidth="1"
        />
        <text
          x={padding.left - 10}
          y={height - padding.bottom + 4}
          fill="var(--text-muted)"
          fontSize="10"
          textAnchor="end"
        >
          -${Math.round(maxAbs).toLocaleString("en-US")}
        </text>

        {/* Bars */}
        {data.map((day, i) => {
          const x = padding.left + i * step + (step - barWidth) / 2;
          const barHeight = Math.abs((day.netPnl / maxAbs) * (chartHeight / 2));
          const y = day.netPnl >= 0 ? zeroY - barHeight : zeroY;
          const isGreen = day.netPnl >= 0;

          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx="2"
                fill={isGreen ? "var(--brand-emerald)" : "var(--brand-crimson)"}
                opacity={hoveredBar?.date === day.date ? 1 : 0.85}
                style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
                onMouseEnter={() => setHoveredBar(day)}
                onMouseLeave={() => setHoveredBar(null)}
              />
              {/* Date label at bottom for selected intervals */}
              {(data.length <= 15 || i % Math.ceil(data.length / 10) === 0) && (
                <text
                  x={x + barWidth / 2}
                  y={height - 12}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {day.date.substring(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoveredBar && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "20px",
            background: "rgba(18, 24, 38, 0.95)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            fontSize: "12px",
            boxShadow: "var(--shadow-md)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>
            {hoveredBar.date} • {hoveredBar.tradeCount} trade{hoveredBar.tradeCount === 1 ? "" : "s"}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span>Net P&L:</span>
            <strong style={{ color: hoveredBar.netPnl >= 0 ? "var(--brand-emerald)" : "var(--brand-crimson)" }}>
              {hoveredBar.netPnl >= 0 ? "+" : ""}${hoveredBar.netPnl.toFixed(2)}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span>Wins / Losses:</span>
            <span>
              {hoveredBar.winningCount}W / {hoveredBar.losingCount}L ({hoveredBar.winRate.toFixed(0)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
