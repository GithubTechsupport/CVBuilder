import type { CSSProperties, ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export interface DragHandleProps {
  listeners: DraggableSyntheticListeners;
  attributes: Record<string, unknown>;
  setActivatorNodeRef: (el: HTMLElement | null) => void;
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[], from: number, to: number) => void;
  renderItem: (item: T, handle: DragHandleProps, index: number) => ReactNode;
  className?: string;
}

/** Vertical drag-and-drop list. Items are dragged by the handle rendered via <DragHandle />. */
export function SortableList<T extends { id: string }>({ items, onReorder, renderItem, className }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to), from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: DragHandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'is-dragging' : undefined}>
      {children({ listeners, attributes: attributes as unknown as Record<string, unknown>, setActivatorNodeRef })}
    </div>
  );
}

export function DragHandle({ handle, label = 'Drag to reorder' }: { handle: DragHandleProps; label?: string }) {
  return (
    <button
      type="button"
      className="drag-handle"
      ref={handle.setActivatorNodeRef}
      {...handle.attributes}
      {...handle.listeners}
      aria-label={label}
      title={label}
    >
      <GripVertical size={16} />
    </button>
  );
}
