'use client';

import { useDrag, useDrop } from 'react-dnd';
import { Widget } from '@/store/useDashboardStore';
import FinanceCard from './widgets/FinanceCard';
import TableWidget from './widgets/TableWidget';
import ChartWidget from './widgets/ChartWidget';

interface DraggableWidgetProps {
  widget: Widget;
  index: number;
  onRemove: (id: string) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

const ITEM_TYPE = 'widget';

export default function DraggableWidget({
  widget,
  index,
  onRemove,
  onReorder,
}: DraggableWidgetProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: { index },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [index]
  );

  const [, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          onReorder(item.index, index);
          item.index = index;
        }
      },
    }),
    [index, onReorder]
  );

  // Merge drag and drop refs
  const ref = (element: HTMLDivElement) => {
    drag(drop(element));
  };

  const renderWidget = () => {
    switch (widget.type) {
      case 'table':
        return <TableWidget widget={widget} />;
      case 'chart':
        return <ChartWidget widget={widget} />;
      case 'card':
      default:
        return <FinanceCard widget={widget} />;
    }
  };

  return (
    <div
      ref={ref}
      className={`relative transition-all duration-200 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Drag Handle */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-grab active:cursor-grabbing hover:bg-blue-600 z-20 opacity-0 hover:opacity-100 transition-opacity"
        title="Drag to reorder">
        ⋮
      </div>

      {renderWidget()}

      {/* Delete Button */}
      <button
        onClick={() => onRemove(widget.id)}
        className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-bold text-xl w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded z-10"
        title="Delete widget"
      >
        ×
      </button>
    </div>
  );
}
