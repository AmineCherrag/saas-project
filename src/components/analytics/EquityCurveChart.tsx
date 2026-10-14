"use client";

import React, { useState } from "react";
import { EquityCurvePoint } from "@/lib/analytics/analytics-service";

interface EquityCurveChartProps {
  data: EquityCurvePoint[];
  height?: number;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data,
  height = 300,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<EquityCurvePoint | null>(null);

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
        No closed trades available to render equity curve.
      </div>
    );
  }

  // Find min and max for scaling
  const values = data.map((d) => d.cumulativePnl);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  const width = 800;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  const getX = (index: number) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const zeroY = getY(0);

  // Generate path string
  const points = data.map((d, i) => `${getX(i)},${getY(d.cumulativePnl)}`).join(" ");
  const firstX = getX(0);
  const lastX = getX(data.length - 1);
  const areaPath = `M ${firstX},${zeroY} L ${points} L ${lastX},${zeroY} Z`;
  const linePath = `M ${points.split(" ")[0]} L ${points}`;

  const isNetPositive = data[data.length - 1].cumulativePnl >= 0;
  const strokeColor = isNetPositive ? "var(--brand-emerald)" : "var(--brand-crimson)";
  const gradientId = `equityGradient_${isNetPositive ? "green" : "red"}`;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              stopColor={strokeColor}
              stopOpacity={isNetPositive ? "0.35" : "0.15"}
            />
            <stop
              offset="100%"
              stopColor={strokeColor}
              stopOpacity="0.0"
            />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const val = minVal + pct * range;
          const y = getY(val);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray={val === 0 ? "none" : "3,3"}
                strokeWidth={val === 0 ? "1.5" : "1"}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fill="var(--text-muted)"
                fontSize="11"
                textAnchor="end"
                fontFamily="inherit"
              >
                ${val >= 0 ? "+" : ""}{Math.round(val).toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        {/* Gradient Area Fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Main Line */}
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Data Points */}
        {data.map((point, i) => (
          <circle
            key={point.tradeId || i}
            cx={getX(i)}
            cy={getY(point.cumulativePnl)}
            r={hoveredPoint?.tradeId === point.tradeId ? 6 : 3.5}
            fill={point.tradeNetPnl >= 0 ? "var(--brand-emerald)" : "var(--brand-crimson)"}
            stroke="#121826"
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "r 0.15s ease" }}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* Hover Crosshair */}
        {hoveredPoint && (
          <line
            x1={getX(data.indexOf(hoveredPoint))}
            y1={padding.top}
            x2={getX(data.indexOf(hoveredPoint))}
            y2={height - padding.bottom}
            stroke="var(--text-muted)"
            strokeDasharray="2,2"
            strokeWidth="1"
          />
        )}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
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
          <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "3px" }}>
            {new Date(hoveredPoint.date).toLocaleString("en-US")} • <strong>{hoveredPoint.symbol}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span>Trade P&L:</span>
            <strong style={{ color: hoveredPoint.tradeNetPnl >= 0 ? "var(--brand-emerald)" : "var(--brand-crimson)" }}>
              {hoveredPoint.tradeNetPnl >= 0 ? "+" : ""}${hoveredPoint.tradeNetPnl.toFixed(2)}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
            <span>Cumulative:</span>
            <strong style={{ color: hoveredPoint.cumulativePnl >= 0 ? "var(--brand-emerald)" : "var(--brand-crimson)" }}>
              ${hoveredPoint.cumulativePnl.toFixed(2)}
            </strong>
          </div>
          {hoveredPoint.drawdown > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", color: "var(--brand-crimson)" }}>
              <span>Drawdown:</span>
              <span>-${hoveredPoint.drawdown.toFixed(2)} ({hoveredPoint.drawdownPct.toFixed(1)}%)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
