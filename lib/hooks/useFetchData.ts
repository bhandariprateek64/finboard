import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api/apiService';

interface UseFetchDataOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in seconds
}

interface UseFetchDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch data from APIs with automatic caching and optional auto-refresh
 */
export function useFetchData<T = unknown>(
  apiUrl: string,
  dataKey: string,
  options: UseFetchDataOptions = {}
): UseFetchDataReturn<T> {
  const { autoFetch = true, refreshInterval = 300 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const fullData = await response.json();

      // Parse the data key path (e.g., "data.price" -> data['data']['price'])
      const value = parseDataKey(fullData, dataKey);

      if (value === undefined) {
        throw new Error(
          `Data key "${dataKey}" not found in API response. Available keys: ${Object.keys(fullData).join(', ')}`
        );
      }

      setData(value as T);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`[Fetch Error] ${apiUrl}:`, errorMessage);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, dataKey]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoFetch || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoFetch, refreshInterval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Parse nested data keys (e.g., "data.quote.price")
 */
function parseDataKey(obj: Record<string, unknown>, keyPath: string): unknown {
  const keys = keyPath.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}
