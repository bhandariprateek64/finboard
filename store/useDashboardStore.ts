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
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      widgets: [],
      
      addWidget: (widget) => {
        set((state) => ({
          widgets: [
            ...state.widgets,
            {
              ...widget,
              id: Date.now().toString(),
            },
          ],
        }));
      },
      
      removeWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.filter((widget) => widget.id !== id),
        }));
      },
      
      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((widget) =>
            widget.id === id ? { ...widget, ...updates } : widget
          ),
        }));
      },

      reorderWidgets: (fromIndex, toIndex) => {
        set((state) => {
          const newWidgets = [...state.widgets];
          const [removed] = newWidgets.splice(fromIndex, 1);
          newWidgets.splice(toIndex, 0, removed);
          return { widgets: newWidgets };
        });
      },
    }),
    {
      name: 'dashboard-storage', // localStorage key
    }
  )
);
