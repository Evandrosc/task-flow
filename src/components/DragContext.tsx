import { createContext, useContext } from 'react';

export interface DragState {
  sourceDroppableId: string | null;
  sourceIndex: number | null;
  destinationDroppableId: string | null;
  destinationIndex: number | null;
  dragOffsetX: number; // horizontal intent: >0 indent, <0 outdent
}

export const DragContext = createContext<DragState>({ 
  sourceDroppableId: null,
  sourceIndex: null,
  destinationDroppableId: null, 
  destinationIndex: null,
  dragOffsetX: 0,
});

export const useDragState = () => useContext(DragContext);