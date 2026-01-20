import { useState, useCallback, createContext, useContext } from 'react';
import { DragDropContext, DropResult, DragUpdate } from '@hello-pangea/dnd';
import { useTasks } from '@/hooks/useTasks';
import { TaskGroup } from './TaskGroup';

interface DragState {
  destinationDroppableId: string | null;
  destinationIndex: number | null;
}

const DragContext = createContext<DragState>({ destinationDroppableId: null, destinationIndex: null });

export const useDragState = () => useContext(DragContext);

export function TaskBoard() {
  const {
    groups,
    addTask,
    addSubtask,
    updateTask,
    deleteTask,
    toggleTaskExpand,
    toggleGroupExpand,
    reorderTasks,
    reorderSubtasks,
    getSubtaskCount,
    moveTaskToGroup,
    moveTaskToSubtask,
  } = useTasks();

  const [dragState, setDragState] = useState<DragState>({
    destinationDroppableId: null,
    destinationIndex: null,
  });

  const handleDragUpdate = useCallback((update: DragUpdate) => {
    if (update.destination) {
      setDragState({
        destinationDroppableId: update.destination.droppableId,
        destinationIndex: update.destination.index,
      });
    } else {
      setDragState({ destinationDroppableId: null, destinationIndex: null });
    }
  }, []);

  const handleDragEnd = (result: DropResult) => {
    setDragState({ destinationDroppableId: null, destinationIndex: null });
    
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    const sourceDroppableId = source.droppableId;
    const destDroppableId = destination.droppableId;
    
    // Check if destination is a group (not a subtask container)
    const isDestGroup = groups.some(g => g.id === destDroppableId);
    const isSourceGroup = groups.some(g => g.id === sourceDroppableId);
    
    // Moving within the same group at root level
    if (isSourceGroup && isDestGroup && sourceDroppableId === destDroppableId) {
      if (source.index !== destination.index) {
        reorderTasks(sourceDroppableId, source.index, destination.index);
      }
      return;
    }
    
    // Moving from subtasks to a group (promoting subtask to task)
    // Or moving between groups
    if (isDestGroup) {
      moveTaskToGroup(draggableId, destDroppableId, destination.index);
      return;
    }

    // Dropping on a task row: make it a subtask of that task
    if (destDroppableId.startsWith('drop-')) {
      const parentTaskId = destDroppableId.replace('drop-', '');
      moveTaskToSubtask(draggableId, parentTaskId, 0);
      return;
    }

    // Moving to subtasks of a task (demoting task to subtask or reordering subtasks)
    if (destDroppableId.startsWith('subtasks-')) {
      const parentTaskId = destDroppableId.replace('subtasks-', '');

      // If same source and destination, it's a reorder within subtasks
      if (sourceDroppableId === destDroppableId) {
        // Find which group this parent belongs to
        for (const group of groups) {
          const findParentGroup = (tasks: typeof group.tasks): string | null => {
            for (const task of tasks) {
              if (task.id === parentTaskId) return group.id;
              const found = findParentGroup(task.subtasks);
              if (found) return found;
            }
            return null;
          };
          const groupId = findParentGroup(group.tasks);
          if (groupId) {
            reorderSubtasks(groupId, parentTaskId, source.index, destination.index);
            return;
          }
        }
      } else {
        // Moving a task to become a subtask of another task
        moveTaskToSubtask(draggableId, parentTaskId, destination.index);
      }
    }
  };

  return (
    <DragContext.Provider value={dragState}>
      <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto py-4">
            {groups.map((group) => (
              <TaskGroup
                key={group.id}
                group={group}
                onToggleExpand={toggleGroupExpand}
                onToggleTaskExpand={toggleTaskExpand}
                onAddTask={addTask}
                onAddSubtask={addSubtask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onReorderSubtasks={reorderSubtasks}
                getSubtaskCount={getSubtaskCount}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </DragContext.Provider>
  );
}