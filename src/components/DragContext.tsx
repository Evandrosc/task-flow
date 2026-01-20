import { createContext, useContext } from 'react';

export interface DragState {
  sourceDroppableId: string | null;
  sourceIndex: number | null;
  destinationDroppableId: string | null;
  destinationIndex: number | null;
}

export const DragContext = createContext<DragState>({ 
  sourceDroppableId: null,
  sourceIndex: null,
  destinationDroppableId: null, 
  destinationIndex: null 
});

export const useDragState = () => useContext(DragContext);