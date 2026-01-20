import { createContext, useContext } from 'react';

export interface DragState {
  destinationDroppableId: string | null;
  destinationIndex: number | null;
}

export const DragContext = createContext<DragState>({ 
  destinationDroppableId: null, 
  destinationIndex: null 
});

export const useDragState = () => useContext(DragContext);