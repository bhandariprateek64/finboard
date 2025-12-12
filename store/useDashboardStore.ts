import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Widget {
  id: string;
  type: 'card' | 'table' | 'chart';
  name: string;
  apiUrl: string;
  dataKey: string;
  refreshInterval: number; // in seconds
}

export interface DashboardStore {
  widgets: Widget[];
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, widget: Partial<Omit<Widget, 'id'>>) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  resetWidgets: () => void;
}

// Small helper to generate a stable ID that is readable during debugging.
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      widgets: [],

      addWidget: (widget) => {
        // Use functional update to ensure we operate on the latest state
        set((state) => ({ widgets: [...state.widgets, { ...widget, id: generateId() }] }));
      },

      removeWidget: (id) => {
        set((state) => ({ widgets: state.widgets.filter((w) => w.id !== id) }));
      },

      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));
      },

      reorderWidgets: (fromIndex, toIndex) => {
        set((state) => {
          const count = state.widgets.length;
          // Guard against invalid indices
          if (fromIndex < 0 || fromIndex >= count || toIndex < 0 || toIndex >= count) {
            return state;
          }
          const list = [...state.widgets];
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return { widgets: list };
        });
      },

      resetWidgets: () => {
        set({ widgets: [] });
      },
    }),
    {
      name: 'dashboard-storage', // localStorage key
      version: 1,
    }
  )
);
