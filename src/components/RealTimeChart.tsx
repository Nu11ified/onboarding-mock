"use client";

import { useEffect, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type DataPoint = {
  timestamp: number;
  value: number;
  lowerBound: number;
  upperBound: number;
};

type ChannelData = {
  channelId: string;
  name: string;
  unit: string;
  data: DataPoint[];
  currentValue: number;
  lowerBound: number;
  upperBound: number;
  healthScore: number;
  status: "healthy" | "warning" | "critical";
};

export function RealTimeChart({ channel }: { channel: ChannelData }) {
  const [data, setData] = useState(channel.data);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setData(channel.data);
    setAnimationKey((prev) => prev + 1);
  }, [channel.data]);

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Format value with unit
  const formatValue = (value: number) => {
    return `${value.toFixed(2)} ${channel.unit}`;
  };

  // Determine chart color based on status
  const getChartColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "#10b981"; // emerald-500
      case "warning":
        return "#f59e0b"; // amber-500
      case "critical":
        return "#ef4444"; // rose-500
      default:
        return "#8b5cf6"; // purple-500
    }
  };

  const chartColor = getChartColor(channel.status);

  return (
    <div className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">
              {channel.name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                channel.status === "healthy" &&
                  "bg-emerald-100 text-emerald-700",
                channel.status === "warning" && "bg-amber-100 text-amber-700",
                channel.status === "critical" && "bg-rose-100 text-rose-700"
              )}
            >
              <Activity className="h-3 w-3" />
              {channel.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Current: {formatValue(channel.currentValue)} · Health:{" "}
            {channel.healthScore}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart
          key={animationKey}
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fontSize: 10 }}
            stroke="#94a3b8"
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            domain={[
              channel.lowerBound - (channel.upperBound - channel.lowerBound) * 0.1,
              channel.upperBound + (channel.upperBound - channel.lowerBound) * 0.1,
            ]}
            tick={{ fontSize: 10 }}
            stroke="#94a3b8"
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #c7d2fe",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            labelFormatter={(label) => formatTime(label as number)}
            formatter={(value: number) => [formatValue(value), "Value"]}
          />

          {/* Upper bound line */}
          <ReferenceLine
            y={channel.upperBound}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Upper: ${channel.upperBound}${channel.unit}`,
              position: "right",
              fill: "#ef4444",
              fontSize: 10,
            }}
          />

          {/* Lower bound line */}
          <ReferenceLine
            y={channel.lowerBound}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Lower: ${channel.lowerBound}${channel.unit}`,
              position: "right",
              fill: "#ef4444",
              fontSize: 10,
            }}
          />

          {/* Healthy zone area (subtle) */}
          <Area
            type="monotone"
            dataKey={() => channel.upperBound}
            fill="#dcfce7"
            fillOpacity={0.2}
            stroke="none"
          />
          <Area
            type="monotone"
            dataKey={() => channel.lowerBound}
            fill="#ffffff"
            fillOpacity={1}
            stroke="none"
          />

          {/* Actual value line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-in-out"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span>In Range</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-rose-500"></div>
            <span>Bounds</span>
          </div>
        </div>
        <span className="text-slate-400">Last 60s</span>
      </div>
    </div>
  );
}
