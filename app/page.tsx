'use client';

import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDashboardStore } from '@/store/useDashboardStore';
import AddWidgetModal from './components/AddWidgetModal';
import DraggableWidget from './components/DraggableWidget';

export default function Home() {
  const widgets = useDashboardStore((state) => state.widgets);
  const removeWidget = useDashboardStore((state) => state.removeWidget);
  const reorderWidgets = useDashboardStore((state) => state.reorderWidgets);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before rendering (for Zustand hydration)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              + Add Widget
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {widgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-500 mb-4">No widgets yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
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
