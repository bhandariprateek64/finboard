'use client';

import { useFetchData } from '@/lib/hooks/useFetchData';
import { Widget } from '@/store/useDashboardStore';

interface FinanceCardProps {
  widget: Widget;
}

export default function FinanceCard({ widget }: FinanceCardProps) {
  const { data, loading, error, refetch } = useFetchData(
    widget.apiUrl,
    widget.dataKey,
    {
      autoFetch: true,
      refreshInterval: widget.refreshInterval,
    }
  );

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';

    if (typeof value === 'number') {
      // Format currency if value looks like a price
      if (value > 0) {
        return `$${value.toFixed(2)}`;
      }
      return value.toFixed(2);
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{widget.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)}
          </p>
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

      {/* Loading State */}
      {loading && !data && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Loading data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex flex-col items-center justify-center bg-red-50 rounded p-4 mb-4">
          <p className="text-sm font-medium text-red-800 text-center">
            {error}
          </p>
          <button
            onClick={refetch}
            className="mt-3 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Display */}
      {data !== null && !error && (
        <div className="flex-1 flex flex-col justify-center">
          {typeof data === 'object' && !Array.isArray(data) ? (
            <div className="space-y-2">
              {Object.entries(data as Record<string, unknown>).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-sm font-medium text-gray-900 text-right ml-2">
                      {formatValue(value)}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-600">
                {formatValue(data)}
              </p>
              <p className="text-xs text-gray-500">{widget.dataKey}</p>
            </div>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="border-t border-gray-100 mt-4 pt-3">
        <p className="text-xs text-gray-500">
          <strong>Refresh:</strong> Every {widget.refreshInterval}s
        </p>
        <p className="text-xs text-gray-400 truncate mt-1">
          <strong>API:</strong> {widget.apiUrl}
        </p>
      </div>
    </div>
  );
}
