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

  // `fetchedData` holds the parsed portion of the API response that the
  // widget cares about (as selected by the user via `dataKey`). We avoid
  // using the generic name `data` to make intent clearer in components.
  const [fetchedData, setFetchedData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // We use the lightweight fetch API here rather than the cached
      // `apiService` to keep URL/query behaviour predictable for
      // custom-URL users. The `apiService` provides helpful caching
      // and deduplication for internal callers elsewhere.
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const fullResponse = await response.json();

      // Attempt to extract the requested portion of the response using
      // our robust parser that understands arrays, numeric indices and
      // keys that themselves contain dots (Alpha Vantage style keys).
      const extracted = parseDataKey(fullResponse, dataKey);

      if (extracted === undefined) {
        // Provide a helpful error message that surfaces available top-level
        // keys (if the response is an object) to aid debugging in the UI.
        const topKeys =
          fullResponse && typeof fullResponse === 'object'
            ? Object.keys(fullResponse as Record<string, unknown>).slice(0, 10).join(', ')
            : 'n/a';
        throw new Error(
          `Data key "${dataKey}" not found. Top-level keys: ${topKeys}`
        );
      }

      setFetchedData(extracted as T);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(message);
      console.error(`[useFetchData] ${apiUrl}:`, message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, dataKey]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && apiUrl) {
      fetchData();
    }
  }, [autoFetch, apiUrl, fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoFetch || refreshInterval <= 0 || !apiUrl) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoFetch, refreshInterval, apiUrl, fetchData]);

  return {
    data: fetchedData,
    loading: isLoading,
    error: errorMessage,
    refetch: fetchData,
  };
}

/**
 * Parse nested data keys (e.g., "data.quote.price" or "Global Quote.09. change")
 * Handles keys that contain dots (like Alpha Vantage's "09. change")
 */
/**
 * Robust parser for extracting a nested value from an API response.
 *
 * Why: Alpha Vantage and similar providers use keys that include dots
 * (e.g. "09. change") and responses may mix arrays and objects.
 * A naive split-on-dot approach will incorrectly split those keys.
 * This parser attempts to resolve parts greedily and supports numeric
 * array indices using both dot and bracket-style paths.
 */
function parseDataKey(obj: any, keyPath: string): unknown {
  if (!keyPath) return obj;

  // Normalize bracket-style indices: a.b[0].c -> a.b.0.c
  const normalized = keyPath.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalized.split('.');

  let current: any = obj;

  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return undefined;

    const attempt = parts[i];

    // Direct key access (preferred)
    if (Object.prototype.hasOwnProperty.call(current, attempt)) {
      current = current[attempt];
      continue;
    }

    // If the current is an array and attempt is numeric index
    if (Array.isArray(current) && !isNaN(Number(attempt))) {
      const idx = Number(attempt);
      current = current[idx];
      continue;
    }

    // Greedy merge: try merging the next parts to match keys that contain dots
    // Example: parts = ['09', ' change'] -> try '09. change'
    let mergedFound = false;
    let mergedKey = attempt;
    for (let j = i + 1; j < Math.min(parts.length, i + 3); j++) {
      mergedKey = `${mergedKey}.${parts[j]}`;
      if (Object.prototype.hasOwnProperty.call(current, mergedKey)) {
        current = current[mergedKey];
        i = j; // advance outer loop past merged parts
        mergedFound = true;
        break;
      }
    }
    if (mergedFound) continue;

    // Not found
    return undefined;
  }

  return current;
}
