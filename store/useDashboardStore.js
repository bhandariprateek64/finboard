import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // This handles the "Browser Storage" requirement automatically [cite: 95]

export const useDashboardStore = create(
  persist(
    (set) => ({
      widgets: [],
      addWidget: (newWidget) => set((state) => ({ 
        widgets: [...state.widgets, newWidget] 
      })),
      removeWidget: (id) => set((state) => ({ 
        widgets: state.widgets.filter(w => w.id !== id) 
      })),
    }),
    { name: 'dashboard-storage' } // unique name for localStorage
  )
);