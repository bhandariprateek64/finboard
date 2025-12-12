# FinBoard AI Coding Instructions

You are an expert Frontend Developer working on "FinBoard," a customizable finance dashboard built with Next.js 16 and TypeScript.

## 🏗 Project Architecture
- **Framework**: Next.js 16 (App Router). All pages/layouts in `app/`.
- **State Management**: `zustand` with `persist` middleware.
  - Store defined in `store/useDashboardStore.ts`.
  - **Rule**: Always use the store for widget state (add/remove/update/reorder). Do not use local component state for dashboard configuration.
- **Styling**: Tailwind CSS v4. Use `@theme` variables in `app/globals.css`.
- **Drag & Drop**: `react-dnd` with `react-dnd-html5-backend`.
  - Widgets are wrapped in `DraggableWidget.tsx`.
- **Charts**: `recharts` library.

## 📡 Data Fetching & API
- **Service**: Use `lib/api/apiService.ts` singleton for all requests.
  - It handles caching (`CACHE_DURATION`) and request deduplication automatically.
- **Hook**: Use `useFetchData` hook in widgets.
  - Pattern: `const { data, loading, error } = useFetchData(url, dataKey, { refreshInterval })`.
- **Configuration**: API providers (Alpha Vantage, Finnhub) are defined in `lib/api/config.ts`.
  - **Rule**: Do not hardcode API keys. Use `process.env`.

## 🧩 Widget Components
- Located in `app/components/widgets/`.
- Must implement specific widget types: 'card' | 'table' | 'chart'.
- **Data Mapping**: Widgets receive raw JSON and use `dataKey` (dot notation) to extract relevant values.

## 🛠 workflows & Conventions
- **Hydration**: Ensure `useDashboardStore` calls handle hydration mismatch (check `isMounted` pattern in `page.tsx`).
- **Strict Mode**: React Strict Mode is enabled. Ensure `useEffect` cleanup functions are correct to prevent double-fetching in dev.
- **Naming**: Use `handle[EventName]` for event handlers (e.g., `handleAddWidget`).

## 🚨 Critical Constraints (from Assignment)
1. **Persistence**: Dashboard layout MUST persist on reload (handled by Zustand).
2. **Real-time**: Widgets must support auto-refresh intervals.
3. **Error Handling**: API limits/errors must be displayed gracefully in the widget UI, not crash the app.