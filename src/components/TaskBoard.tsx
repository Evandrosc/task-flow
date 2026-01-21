import { useState, useCallback } from 'react';
import { DragDropContext, DropResult, DragUpdate } from '@hello-pangea/dnd';
import { useTasks } from '@/hooks/useTasks';
import { TaskGroup } from './TaskGroup';
import { DragContext, DragState } from './DragContext';

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
    sourceDroppableId: null,
    sourceIndex: null,
    destinationDroppableId: null,
    destinationIndex: null,
  });

  const handleDragUpdate = useCallback((update: DragUpdate) => {
    if (update.destination) {
      setDragState({
        sourceDroppableId: update.source.droppableId,
        sourceIndex: update.source.index,
        destinationDroppableId: update.destination.droppableId,
        destinationIndex: update.destination.index,
      });
    } else {
      setDragState({ 
        sourceDroppableId: null, 
        sourceIndex: null, 
        destinationDroppableId: null, 
        destinationIndex: null 
      });
    }
  }, []);

  const handleDragEnd = (result: DropResult) => {
    setDragState({ 
      sourceDroppableId: null, 
      sourceIndex: null, 
      destinationDroppableId: null, 
      destinationIndex: null 
    });
    
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    const sourceDroppableId = source.droppableId;
    const destDroppableId = destination.droppableId;
    
    // If source and destination are the same and index is the same, no change needed
    if (sourceDroppableId === destDroppableId && source.index === destination.index) {
      return;
    }
    
    // Check if source/destination are subtask containers
    const isSourceSubtask = sourceDroppableId.startsWith('subtasks-');
    const isDestSubtask = destDroppableId.startsWith('subtasks-');
    
    // Check if destination is a group (not a subtask container)
    const isDestGroup = groups.some(g => g.id === destDroppableId);
    const isSourceGroup = groups.some(g => g.id === sourceDroppableId);
    
    // Reordering subtasks within the same parent
    if (isSourceSubtask && isDestSubtask && sourceDroppableId === destDroppableId) {
      const parentTaskId = sourceDroppableId.replace('subtasks-', '');
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
      return;
    }
    
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

    // Moving to subtasks of a different task (demoting task to subtask or moving between subtask lists)
    if (isDestSubtask) {
      const parentTaskId = destDroppableId.replace('subtasks-', '');
      moveTaskToSubtask(draggableId, parentTaskId, destination.index);
      return;
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