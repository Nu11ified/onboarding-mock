"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Filter, BarChart3, TrendingUp, Activity } from "lucide-react";
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

type GraphType = "line" | "bar" | "scatter";
type TimeRange = "1m" | "5m" | "15m" | "30m" | "1h";

const COLORS = [
  "#8b5cf6", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ef4444", // rose
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#a855f7", // violet
  "#84cc16", // lime
  "#f43f5e", // red
];

export function MultiChannelChart({ channels }: { channels: ChannelData[] }) {
  const [graphType, setGraphType] = useState<GraphType>("line");
  const [timeRange, setTimeRange] = useState<TimeRange>("1m");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    channels.slice(0, 6).map((ch) => ch.channelId)
  );

  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = Date.now();
    const ranges = {
      "1m": 60 * 1000,
      "5m": 5 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      "30m": 30 * 60 * 1000,
      "1h": 60 * 60 * 1000,
    };
    const cutoff = now - ranges[timeRange];

    // Combine all channel data into unified timeline
    const timelineMap = new Map<number, Record<string, number>>();

    channels
      .filter((ch) => selectedChannels.includes(ch.channelId))
      .forEach((channel) => {
        channel.data
          .filter((point) => point.timestamp >= cutoff)
          .forEach((point) => {
            if (!timelineMap.has(point.timestamp)) {
              timelineMap.set(point.timestamp, {});
            }
            timelineMap.get(point.timestamp)![channel.channelId] = point.value;
          });
      });

    // Convert to array and sort by timestamp
    return Array.from(timelineMap.entries())
      .map(([timestamp, values]) => ({
        timestamp,
        ...values,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [channels, selectedChannels, timeRange]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const selectedChannelObjects = channels.filter((ch) =>
    selectedChannels.includes(ch.channelId)
  );

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 10, right: 30, left: 10, bottom: 10 },
    };

    switch (graphType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #c7d2fe",
                borderRadius: "12px",
                fontSize: "11px",
              }}
              labelFormatter={(label) => formatTime(label as number)}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => {
                const channel = channels.find((ch) => ch.channelId === value);
                return channel ? `${channel.name} (${channel.unit})` : value;
              }}
            />
            {selectedChannelObjects.map((channel, idx) => (
              <Line
                key={channel.channelId}
                type="monotone"
                dataKey={channel.channelId}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
                name={channel.channelId}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
            />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #c7d2fe",
                borderRadius: "12px",
                fontSize: "11px",
              }}
              labelFormatter={(label) => formatTime(label as number)}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => {
                const channel = channels.find((ch) => ch.channelId === value);
                return channel ? `${channel.name} (${channel.unit})` : value;
              }}
            />
            {selectedChannelObjects.map((channel, idx) => (
              <Bar
                key={channel.channelId}
                dataKey={channel.channelId}
                fill={COLORS[idx % COLORS.length]}
                name={channel.channelId}
              />
            ))}
          </BarChart>
        );

      case "scatter":
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fontSize: 11 }}
              stroke="#94a3b8"
              type="number"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #c7d2fe",
                borderRadius: "12px",
                fontSize: "11px",
              }}
              labelFormatter={(label) => formatTime(label as number)}
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => {
                const channel = channels.find((ch) => ch.channelId === value);
                return channel ? `${channel.name} (${channel.unit})` : value;
              }}
            />
            {selectedChannelObjects.map((channel, idx) => (
              <Scatter
                key={channel.channelId}
                name={channel.channelId}
                data={filteredData.map((point) => ({
                  timestamp: point.timestamp,
                  value: point[channel.channelId as keyof typeof point],
                }))}
                fill={COLORS[idx % COLORS.length]}
                shape="circle"
              />
            ))}
          </ScatterChart>
        );

      default:
        return <div />;
    }
  };

  return (
    <div className="rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-md">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Multi-Channel Analysis
            </h3>
            <p className="text-sm text-slate-500">
              Compare multiple sensor channels with advanced visualization
            </p>
          </div>
          <Filter className="h-5 w-5 text-purple-500" />
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Graph Type */}
        <div className="flex items-center gap-2 rounded-full border border-purple-100 bg-white p-1">
          <button
            onClick={() => setGraphType("line")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              graphType === "line"
                ? "bg-purple-600 text-white"
                : "text-slate-600 hover:bg-purple-50"
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Line
          </button>
          <button
            onClick={() => setGraphType("bar")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              graphType === "bar"
                ? "bg-purple-600 text-white"
                : "text-slate-600 hover:bg-purple-50"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Bar
          </button>
          <button
            onClick={() => setGraphType("scatter")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              graphType === "scatter"
                ? "bg-purple-600 text-white"
                : "text-slate-600 hover:bg-purple-50"
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            Scatter
          </button>
        </div>

        {/* Time Range */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Time:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="rounded-full border border-purple-100 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-purple-400 focus:outline-none"
          >
            <option value="1m">Last 1 min</option>
            <option value="5m">Last 5 min</option>
            <option value="15m">Last 15 min</option>
            <option value="30m">Last 30 min</option>
            <option value="1h">Last 1 hour</option>
          </select>
        </div>

        {/* Selected count */}
        <div className="ml-auto text-xs text-slate-500">
          {selectedChannels.length} of {channels.length} channels selected
        </div>
      </div>

      {/* Channel Selection */}
      <div className="mb-6 flex flex-wrap gap-2">
        {channels.map((channel, idx) => (
          <button
            key={channel.channelId}
            onClick={() => toggleChannel(channel.channelId)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              selectedChannels.includes(channel.channelId)
                ? "border-purple-400 bg-purple-50 text-purple-700"
                : "border-purple-100 bg-white text-slate-600 hover:border-purple-200"
            )}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            {channel.name}
            {selectedChannels.includes(channel.channelId) && (
              <span className="text-[10px] opacity-70">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 md:grid-cols-4">
        {selectedChannelObjects.slice(0, 4).map((channel, idx) => (
          <div
            key={channel.channelId}
            className="rounded-2xl border border-purple-100 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-xs font-semibold text-slate-700">
                {channel.name}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {channel.currentValue.toFixed(1)}
              <span className="ml-1 text-xs font-normal text-slate-400">
                {channel.unit}
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              Health: {channel.healthScore}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
