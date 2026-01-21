import { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, DropResult, DragUpdate } from '@hello-pangea/dnd';
import { useTasks } from '@/hooks/useTasks';
import { TaskGroup } from './TaskGroup';
import { DragContext, DragState } from './DragContext';
import type { Task } from '@/types/task';

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
    dragOffsetX: 0,
  });

  const dragStartXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || dragStartXRef.current === null) return;
      const dx = e.clientX - dragStartXRef.current;
      setDragState((prev) => ({ ...prev, dragOffsetX: dx }));
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  const handleDragUpdate = useCallback((update: DragUpdate) => {
    if (update.destination) {
      setDragState({
        sourceDroppableId: update.source.droppableId,
        sourceIndex: update.source.index,
        destinationDroppableId: update.destination.droppableId,
        destinationIndex: update.destination.index,
        dragOffsetX: 0,
      });
    } else {
      setDragState({ 
        sourceDroppableId: null, 
        sourceIndex: null, 
        destinationDroppableId: null, 
        destinationIndex: null,
        dragOffsetX: 0,
      });
    }
  }, []);

  const handleDragStart = (start: { source: { droppableId: string; index: number } }) => {
    isDraggingRef.current = true;
    dragStartXRef.current = null;
    // capture pointer x on next tick (after drag starts) from the last pointer event
    // fallback: if we don't capture, dragOffsetX stays 0 and behavior remains unchanged.
    const onFirstPointerMove = (e: PointerEvent) => {
      dragStartXRef.current = e.clientX;
      window.removeEventListener('pointermove', onFirstPointerMove);
    };
    window.addEventListener('pointermove', onFirstPointerMove);

    setDragState((prev) => ({
      ...prev,
      sourceDroppableId: start.source.droppableId,
      sourceIndex: start.source.index,
      dragOffsetX: 0,
    }));
  };

  const resetDrag = () => {
    isDraggingRef.current = false;
    dragStartXRef.current = null;
    setDragState({
      sourceDroppableId: null,
      sourceIndex: null,
      destinationDroppableId: null,
      destinationIndex: null,
      dragOffsetX: 0,
    });
  };

  const findTaskByIdInGroup = (groupId: string, taskId: string): Task | null => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;
    const walk = (tasks: Task[]): Task | null => {
      for (const t of tasks) {
        if (t.id === taskId) return t;
        const found = walk(t.subtasks);
        if (found) return found;
      }
      return null;
    };
    return walk(group.tasks);
  };

  const findTaskPath = (taskId: string): { groupId: string; path: number[]; parentId: string | null } | null => {
    for (const group of groups) {
      const walk = (tasks: Task[], path: number[], parentId: string | null): { groupId: string; path: number[]; parentId: string | null } | null => {
        for (let i = 0; i < tasks.length; i++) {
          const t = tasks[i];
          const nextPath = [...path, i];
          if (t.id === taskId) return { groupId: group.id, path: nextPath, parentId };
          const found = walk(t.subtasks, nextPath, t.id);
          if (found) return found;
        }
        return null;
      };
      const res = walk(group.tasks, [], null);
      if (res) return res;
    }
    return null;
  };

  const handleDragEnd = (result: DropResult) => {
    const finalDragOffsetX = dragState.dragOffsetX;
    resetDrag();
    
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    const sourceDroppableId = source.droppableId;
    const destDroppableId = destination.droppableId;

    const INDENT_THRESHOLD = 28;
    const OUTDENT_THRESHOLD = 28;
    const wantsIndent = finalDragOffsetX > INDENT_THRESHOLD;
    const wantsOutdent = finalDragOffsetX < -OUTDENT_THRESHOLD;
    
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
      // ClickUp-style indent: if user drags right enough, turn into subtask of previous item
      if (wantsIndent && destination.index > 0) {
        const targetGroup = groups.find((g) => g.id === destDroppableId);
        const candidateParent = targetGroup?.tasks[destination.index - 1];
        if (candidateParent) {
          const parent = findTaskByIdInGroup(destDroppableId, candidateParent.id);
          const targetIndex = parent ? parent.subtasks.length : 0;
          moveTaskToSubtask(draggableId, candidateParent.id, targetIndex);
          return;
        }
      }

      if (source.index !== destination.index) {
        reorderTasks(sourceDroppableId, source.index, destination.index);
      }
      return;
    }

    // ClickUp-style outdent: dragging a subtask left enough promotes it to a root task
    if (isSourceSubtask && wantsOutdent) {
      const loc = findTaskPath(draggableId);
      if (loc) {
        const rootIndex = loc.path[0] ?? 0;
        moveTaskToGroup(draggableId, loc.groupId, rootIndex + 1);
        return;
      }
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
      <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate} onDragStart={handleDragStart}>
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