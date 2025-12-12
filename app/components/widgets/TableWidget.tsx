'use client';

import { useState, useMemo } from 'react';
import { useFetchData } from '@/lib/hooks/useFetchData';
import { Widget } from '@/store/useDashboardStore';

interface TableWidgetProps {
  widget: Widget;
}

export default function TableWidget({ widget }: TableWidgetProps) {
  const { data, loading, error, refetch } = useFetchData(
    widget.apiUrl,
    widget.dataKey,
    {
      autoFetch: true,
      refreshInterval: widget.refreshInterval,
    }
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Parse data to array format
  const tableData = useMemo(() => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === 'object') {
      return [data as Record<string, unknown>];
    }

    return [];
  }, [data]);

  // Get column headers
  const columns = useMemo(() => {
    if (tableData.length === 0) return [];

    const firstRow = tableData[0];
    if (typeof firstRow !== 'object' || firstRow === null) return [];

    return Object.keys(firstRow);
  }, [tableData]);

  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (searchTerm === '') return tableData;

    return tableData.filter((row) => {
      if (typeof row !== 'object' || row === null) return false;

      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [tableData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{widget.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Table</p>
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

      {/* Search Input */}
      {tableData.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      )}

      {/* Loading State */}
      {loading && !tableData.length && (
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
        <div className="flex-1 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded p-4 mb-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 text-center">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tableData.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-sm text-gray-500">No data to display</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && tableData.length > 0 && (
        <>
          <div className="overflow-x-auto flex-1 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left font-semibold text-gray-700 capitalize"
                    >
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={`${idx}-${col}`}
                        className="px-4 py-2 text-gray-800 dark:text-gray-200 truncate"
                        title={formatValue((row as Record<string, unknown>)[col])}
                      >
                        {formatValue((row as Record<string, unknown>)[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs text-gray-600 border-t border-gray-100 pt-3">
              <span>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of{' '}
                {filteredData.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="px-2 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Meta Info */}
      <div className="border-t border-gray-100 mt-4 pt-3">
        <p className="text-xs text-gray-500">
          <strong>Rows:</strong> {filteredData.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          <strong>Refresh:</strong> Every {widget.refreshInterval}s
        </p>
      </div>
    </div>
  );
}
