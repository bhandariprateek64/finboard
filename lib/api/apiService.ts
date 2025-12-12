import axios, { AxiosError } from 'axios';
import { API_CONFIGS, CACHE_DURATION, APIProvider } from './config';

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface ApiCache {
  [key: string]: CacheEntry;
}

class ApiService {
  private cache: ApiCache = {};
  private requestQueue: Map<string, Promise<unknown>> = new Map();

  /**
   * Generates a cache key from URL and parameters
   */
  private getCacheKey(url: string, params: Record<string, unknown>): string {
    const paramString = Object.entries(params)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${url}?${paramString}`;
  }

  /**
   * Checks if cached data is still valid
   */
  private isCacheValid(cacheEntry: CacheEntry): boolean {
    const now = Date.now();
    return now - cacheEntry.timestamp < CACHE_DURATION * 1000;
  }

  /**
   * Get data from cache if available and valid
   */
  private getFromCache(cacheKey: string): unknown | null {
    const entry = this.cache[cacheKey];
    if (entry && this.isCacheValid(entry)) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return entry.data;
    }
    return null;
  }

  /**
   * Store data in cache
   */
  private setCache(cacheKey: string, data: unknown): void {
    this.cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * Fetch data from Alpha Vantage API
   */
  async fetchAlphaVantage(
    symbol: string,
    dataType: 'GLOBAL_QUOTE' | 'TIME_SERIES_DAILY' | 'TIME_SERIES_INTRADAY' = 'GLOBAL_QUOTE'
  ): Promise<unknown> {
    const config = API_CONFIGS.ALPHA_VANTAGE;
    const params: Record<string, unknown> = {
      function: dataType,
      symbol,
      apikey: config.apiKey,
    };

    if (dataType === 'TIME_SERIES_INTRADAY') {
      params.interval = '5min';
    }

    return this.fetchWithCache(config.baseUrl!, params);
  }

  /**
   * Fetch data from Finnhub API
   */
  async fetchFinnhub(
    endpoint: 'quote' | 'company-news' | 'profile',
    params: Record<string, unknown>
  ): Promise<unknown> {
    const config = API_CONFIGS.FINNHUB;
    const fullParams = {
      ...params,
      token: config.apiKey,
    };

    return this.fetchWithCache(`${config.baseUrl}/${endpoint}`, fullParams);
  }

  /**
   * Generic fetch with caching and deduplication
   */
  private async fetchWithCache(
    url: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const cacheKey = this.getCacheKey(url, params);

    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Prevent duplicate requests using request deduplication
    if (this.requestQueue.has(cacheKey)) {
      console.log(`[Dedup] Waiting for existing request: ${cacheKey}`);
      return this.requestQueue.get(cacheKey);
    }

    // Make the request
    const requestPromise = this.makeRequest(url, params, cacheKey);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      return data;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(
    url: string,
    params: Record<string, unknown>,
    cacheKey: string
  ): Promise<unknown> {
    try {
      console.log(`[API Request] ${url}`, params);
      const response = await axios.get(url, { params });
      
      // Check for API-level errors (e.g., rate limiting, invalid symbol)
      if (response.data?.Note || response.data?.['Error Message']) {
        throw new Error(response.data.Note || response.data['Error Message']);
      }

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage =
        axiosError?.message || 'Failed to fetch data from API';
      console.error(`[API Error] ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache = {};
    console.log('[Cache] Cleared all cache');
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): { size: number; entries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache),
    };
  }
}

export const apiService = new ApiService();
