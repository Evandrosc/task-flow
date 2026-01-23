import { createContext, useContext } from 'react';

export type DropPosition = 'before' | 'after' | 'inside' | null;

export interface DragState {
  draggedTaskId: string | null;
  overTaskId: string | null;
  dropPosition: DropPosition;
  overGroupId: string | null;
}

export const DragContext = createContext<DragState>({ 
  draggedTaskId: null,
  overTaskId: null,
  dropPosition: null,
  overGroupId: null,
});

export const useDragState = () => useContext(DragContext);