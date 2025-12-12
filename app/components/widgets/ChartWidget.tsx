'use client';

import { useMemo, useState } from 'react';
import { useFetchData } from '@/lib/hooks/useFetchData';
import { Widget } from '@/store/useDashboardStore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartWidgetProps {
  widget: Widget;
}

export default function ChartWidget({ widget }: ChartWidgetProps) {
  const { data, loading, error, refetch } = useFetchData(
    widget.apiUrl,
    widget.dataKey,
    {
      autoFetch: true,
      refreshInterval: widget.refreshInterval,
    }
  );

  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Parse data for charts
  const chartData = useMemo(() => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data.map((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          return { ...item, index: idx } as Record<string, unknown>;
        }
        return { value: item, index: idx };
      });
    }

    if (typeof data === 'object') {
      // Convert object to array format for charting
      return Object.entries(data).map(([key, value], idx) => ({
        name: key,
        value: typeof value === 'number' ? value : 0,
        index: idx,
      }));
    }

    return [];
  }, [data]);

  // Get numeric columns for charting
  const numericColumns = useMemo(() => {
    if (chartData.length === 0) return [];

    const firstRow = chartData[0];
    if (typeof firstRow !== 'object' || firstRow === null) return [];

    return Object.keys(firstRow)
      .filter((key) => {
        const values = chartData.map((row) => (row as Record<string, unknown>)[key]);
        return values.some((val) => typeof val === 'number');
      })
      .slice(0, 3); // Limit to 3 series for readability
  }, [chartData]);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{widget.name}</h3>
          <p className="text-xs text-gray-500 mt-1">Chart</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:text-gray-400"
          title="Refresh data"
        >
          {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
        </button>
      </div>

      {/* Chart Type Selector */}
      {chartData.length > 0 && !loading && !error && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-xs font-medium rounded ${
              chartType === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-xs font-medium rounded ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bar
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !chartData.length && (
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
          <button
            onClick={refetch}
            className="mt-3 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && chartData.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-sm text-gray-500">No data to display</p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && chartData.length > 0 && numericColumns.length > 0 && (
        <div className="flex-1 flex items-center justify-center mb-4">
          <ResponsiveContainer width="100%" height={250}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                {numericColumns.map((col, idx) => (
                  <Line
                    key={col}
                    type="monotone"
                    dataKey={col}
                    stroke={colors[idx % colors.length]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                {numericColumns.map((col, idx) => (
                  <Bar
                    key={col}
                    dataKey={col}
                    fill={colors[idx % colors.length]}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Meta Info */}
      <div className="border-t border-gray-100 mt-4 pt-3">
        <p className="text-xs text-gray-500">
          <strong>Data Points:</strong> {chartData.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <strong>Series:</strong> {numericColumns.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <strong>Refresh:</strong> Every {widget.refreshInterval}s
        </p>
      </div>
    </div>
  );
}
