// API Configuration for different financial providers
export const API_CONFIGS = {
  ALPHA_VANTAGE: {
    name: 'Alpha Vantage',
    baseUrl: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_URL,
    apiKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY,
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerDay: 500,
    },
    endpoints: {
      QUOTE: 'GLOBAL_QUOTE',
      INTRADAY: 'TIME_SERIES_INTRADAY',
      DAILY: 'TIME_SERIES_DAILY',
      MONTHLY: 'TIME_SERIES_MONTHLY',
    },
  },
  FINNHUB: {
    name: 'Finnhub',
    baseUrl: process.env.NEXT_PUBLIC_FINNHUB_URL,
    apiKey: process.env.NEXT_PUBLIC_FINNHUB_KEY,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: null, // No daily limit mentioned
    },
    endpoints: {
      QUOTE: 'quote',
      COMPANY: 'company-news',
      PROFILE: 'profile',
    },
  },
};

export const CACHE_DURATION = parseInt(
  process.env.NEXT_PUBLIC_API_CACHE_DURATION || '300'
); // in seconds

export type APIProvider = keyof typeof API_CONFIGS;
