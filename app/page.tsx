'use client';

import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDashboardStore } from '@/store/useDashboardStore';
import Header from './components/Header';
import AddWidgetModal from './components/AddWidgetModal';
import DraggableWidget from './components/DraggableWidget';

export default function Home() {
  const widgets = useDashboardStore((state) => state.widgets);
  const removeWidget = useDashboardStore((state) => state.removeWidget);
  const reorderWidgets = useDashboardStore((state) => state.reorderWidgets);
  const resetWidgets = useDashboardStore((state) => state.resetWidgets);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before rendering (for Zustand hydration)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleResetDashboard = () => {
    if (confirm('Are you sure you want to clear all widgets? This cannot be undone.')) {
      resetWidgets();
      localStorage.removeItem('dashboard-storage');
    }
  };

  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header 
        title="Finance Dashboard" 
        onAddWidget={() => setIsModalOpen(true)}
        onReset={handleResetDashboard}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {widgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500 dark:text-slate-400 mb-4">No widgets yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors"
            >
              Create Your First Widget
            </button>
          </div>
        ) : (
          <DndProvider backend={HTML5Backend}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {widgets.map((widget, index) => (
                <DraggableWidget
                  key={widget.id}
                  widget={widget}
                  index={index}
                  onRemove={removeWidget}
                  onReorder={reorderWidgets}
                />
              ))}
            </div>
          </DndProvider>
        )}
      </main>

      {/* Add Widget Modal */}
      <AddWidgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
