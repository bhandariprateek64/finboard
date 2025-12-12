"use client";

import { useMemo, useState } from "react";
import { useFetchData } from "@/lib/hooks/useFetchData";
import { Widget } from "@/store/useDashboardStore";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartWidgetProps {
  widget: Widget;
}

/**
 * Normalize a number of common API shapes into an array of row objects
 * suitable for Recharts. Reasons:
 * - Some providers return an array of rows
 * - Time-series providers often return an object keyed by datetime
 * - Numeric values are sometimes strings and should be preserved as-is
 */
function normalizeSeriesData(raw: unknown): Array<Record<string, unknown>> {
  if (!raw) return [];

  // Already an array of rows
  if (Array.isArray(raw)) {
    return raw.map((item, idx) =>
      typeof item === "object" && item !== null
        ? ({ ...(item as Record<string, unknown>), _index: idx } as Record<string, unknown>)
        : ({ value: item, _index: idx } as Record<string, unknown>)
    );
  }

  // An object where keys are time/index and values are row objects
  if (typeof raw === "object" && raw !== null) {
    return Object.entries(raw as Record<string, unknown>).map(([key, value], idx) => {
      const payload = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : { value };
      return { name: key, ...payload, _index: idx } as Record<string, unknown>;
    });
  }

  return [];
}

export default function ChartWidget({ widget }: ChartWidgetProps) {
  // `fetched` is the parsed portion of the API response extracted by
  // `useFetchData` according to the user's selected `dataKey`.
  const { data: fetched, loading, error, refetch } = useFetchData(widget.apiUrl, widget.dataKey, {
    autoFetch: true,
    refreshInterval: widget.refreshInterval,
  });

  const [chartType, setChartType] = useState<"line" | "bar" | "candle">("line");

  // Normalize the fetched API response into a flat series suitable for
  // Recharts. We accept three common shapes:
  //  - An array of records -> map to rows
  //  - An object whose values are records keyed by time/date -> convert to rows
  //  - A single scalar or unsupported shape -> empty
  const seriesData = useMemo(() => normalizeSeriesData(fetched), [fetched]);

  // Determine which keys in the normalized rows look numeric and are
  // therefore suitable to render as series. We parse numeric-looking
  // strings to support APIs that return numbers as strings.
  const numericSeriesKeys = useMemo(() => {
    if (seriesData.length === 0) return [];

    const firstRow = seriesData[0] as Record<string, unknown>;
    if (!firstRow || typeof firstRow !== "object") return [];

    return Object.keys(firstRow)
      .filter((key) => {
        if (["_index", "name", "time", "date"].includes(key)) return false;

        const values = seriesData.map((row) => (row as Record<string, unknown>)[key]);
        return values.some((v) => {
          if (typeof v === "number") return true;
          if (typeof v === "string") return !isNaN(parseFloat(v as string));
          return false;
        });
      })
      .slice(0, 5);
  }, [seriesData]);

  // Detect whether the normalized rows contain an OHLC-style series. We
  // do a case-insensitive contains-check because providers use different
  // key names like "1. open" or "open".
  const hasOhlcSeries = useMemo(() => {
    if (seriesData.length === 0) return false;
    const firstRow = seriesData[0] as Record<string, unknown>;
    const keys = Object.keys(firstRow || {});
    return ["open", "high", "low", "close"].every((needle) => keys.some((k) => k.toLowerCase().includes(needle)));
  }, [seriesData]);

  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

  // Custom candlestick shape component
  const CandleStick = (props: any) => {
    const { x, y, width, height, payload, yAxis } = props;

    if (!payload || payload.open === undefined) return null;

    const yScale = yAxis.scale;
    const candleWidth = Math.max(width * 0.6, 4);

    // Map values to pixel positions
    const openY = yScale(payload.open);
    const closeY = yScale(payload.close);
    const highY = yScale(payload.high);
    const lowY = yScale(payload.low);

    const candleX = x + width / 2;
    const isGreen = payload.close >= payload.open;

    return (
      <g>
        {/* Wick (high-low) */}
        <line x1={candleX} y1={highY} x2={candleX} y2={lowY} stroke={isGreen ? "#10b981" : "#ef4444"} strokeWidth={1} />

        {/* Body (open-close) */}
        <rect x={candleX - candleWidth / 2} y={Math.min(openY, closeY)} width={candleWidth} height={Math.abs(openY - closeY) || 1} fill={isGreen ? "#10b981" : "#ef4444"} stroke={isGreen ? "#059669" : "#dc2626"} strokeWidth={1} />
      </g>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{widget.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chart</p>
        </div>
        <button onClick={refetch} disabled={loading} className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:text-gray-400" title="Refresh data">
          {loading ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {/* Chart Type Selector */}
      {seriesData.length > 0 && !loading && !error && (
        <div className="mb-4 flex gap-2 flex-wrap">
          <button onClick={() => setChartType("line")} className={`px-3 py-1 text-xs font-medium rounded ${chartType === "line" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
            Line
          </button>
          <button onClick={() => setChartType("bar")} className={`px-3 py-1 text-xs font-medium rounded ${chartType === "bar" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
            Bar
          </button>
          {hasOhlcSeries && (
            <button onClick={() => setChartType("candle")} className={`px-3 py-1 text-xs font-medium rounded ${chartType === "candle" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
              🕯️ Candle
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !seriesData.length && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Loading chart data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center bg-red-50 rounded p-4 mb-4">
          <p className="text-sm font-medium text-red-800 text-center">{error}</p>
          <button onClick={refetch} className="mt-3 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-100 rounded">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && seriesData.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-sm text-gray-500">No data to display</p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && seriesData.length > 0 && numericSeriesKeys.length > 0 && (
        <div className="flex-1 flex items-center justify-center mb-4">
          <ResponsiveContainer width="100%" height={250}>
            {chartType === "line" ? (
              <LineChart data={seriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "12px" }} tick={{ fill: "#6b7280" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
                <Legend />
                {numericSeriesKeys.map((col, idx) => (
                  <Line key={col} type="monotone" dataKey={col} stroke={colors[idx % colors.length]} dot={false} strokeWidth={2} />
                ))}
              </LineChart>
            ) : chartType === "bar" ? (
              <BarChart data={seriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "12px" }} tick={{ fill: "#6b7280" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
                <Legend />
                {numericSeriesKeys.map((col, idx) => (
                  <Bar key={col} dataKey={col} fill={colors[idx % colors.length]} />
                ))}
              </BarChart>
            ) : chartType === "candle" && hasOhlcSeries ? (
              <ComposedChart data={seriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "12px" }} tick={{ fill: "#6b7280" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }}
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const data = payload[0].payload as any;
                    return (
                      <div className="bg-white p-2 border border-gray-300 rounded text-xs">
                        <p className="text-gray-700">
                          <strong>Open:</strong> ${data.open?.toFixed(2)}
                        </p>
                        <p className="text-gray-700">
                          <strong>High:</strong> ${data.high?.toFixed(2)}
                        </p>
                        <p className="text-gray-700">
                          <strong>Low:</strong> ${data.low?.toFixed(2)}
                        </p>
                        <p className="text-gray-700">
                          <strong>Close:</strong> ${data.close?.toFixed(2)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="close" shape={<CandleStick />} isAnimationActive={false} />
              </ComposedChart>
            ) : null}
          </ResponsiveContainer>
        </div>
      )}

      {/* Meta Info */}
      <div className="border-t border-gray-100 mt-4 pt-3">
        <p className="text-xs text-gray-500">
          <strong>Data Points:</strong> {seriesData.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <strong>Series:</strong> {numericSeriesKeys.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <strong>Refresh:</strong> Every {widget.refreshInterval}s
        </p>
      </div>
    </div>
  );
}
