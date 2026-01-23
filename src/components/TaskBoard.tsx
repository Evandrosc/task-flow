import { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, DropResult, BeforeCapture, DragUpdate } from '@hello-pangea/dnd';
import { useTasks } from '@/hooks/useTasks';
import { TaskGroup } from './TaskGroup';
import { DragContext, DragState, DropPosition } from './DragContext';
import type { Task } from '@/types/task';

const MAX_DEPTH = 2;

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
    draggedTaskId: null,
    overTaskId: null,
    dropPosition: null,
    overGroupId: null,
  });

  const draggedTaskIdRef = useRef<string | null>(null);
  const mouseYRef = useRef<number>(0);
  const taskRectsRef = useRef<Map<string, { top: number; bottom: number; groupId: string; depth: number }>>(new Map());

  // Track mouse position during drag
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggedTaskIdRef.current) return;
      mouseYRef.current = e.clientY;
      
      // Find which task we're over and calculate drop position
      let foundTask: { id: string; position: DropPosition; groupId: string } | null = null;
      
      taskRectsRef.current.forEach((rect, taskId) => {
        if (taskId === draggedTaskIdRef.current) return;
        
        if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const elementHeight = rect.bottom - rect.top;
          const relativeY = e.clientY - rect.top;
          const percent = relativeY / elementHeight;
          
          let position: DropPosition;
          if (percent < 0.33) {
            position = 'before';
          } else if (percent < 0.66) {
            position = 'inside';
          } else {
            position = 'after';
          }
          
          foundTask = { id: taskId, position, groupId: rect.groupId };
        }
      });
      
      if (foundTask) {
        // Check constraints before setting
        const draggedId = draggedTaskIdRef.current;
        if (draggedId && !isDescendantOf(foundTask.id, draggedId)) {
          // Check depth constraint for "inside"
          if (foundTask.position === 'inside') {
            const targetRect = taskRectsRef.current.get(foundTask.id);
            const targetDepth = targetRect?.depth ?? 0;
            const draggedTask = findTaskById(draggedId);
            const draggedMaxDepth = draggedTask ? getMaxDescendantDepthOf(draggedTask) : 0;
            
            if (targetDepth + 1 + draggedMaxDepth <= MAX_DEPTH) {
              setDragState({
                draggedTaskId: draggedId,
                overTaskId: foundTask.id,
                dropPosition: foundTask.position,
                overGroupId: foundTask.groupId,
              });
            }
          } else {
            setDragState({
              draggedTaskId: draggedId,
              overTaskId: foundTask.id,
              dropPosition: foundTask.position,
              overGroupId: foundTask.groupId,
            });
          }
        }
      }
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Helper functions that don't need useCallback since they read from groups
  const findTaskById = (taskId: string): Task | null => {
    for (const group of groups) {
      const find = (tasks: Task[]): Task | null => {
        for (const t of tasks) {
          if (t.id === taskId) return t;
          const found = find(t.subtasks);
          if (found) return found;
        }
        return null;
      };
      const found = find(group.tasks);
      if (found) return found;
    }
    return null;
  };

  const getMaxDescendantDepthOf = (task: Task): number => {
    if (task.subtasks.length === 0) return 0;
    return 1 + Math.max(...task.subtasks.map(getMaxDescendantDepthOf));
  };

  const isDescendantOf = (taskId: string, ancestorId: string): boolean => {
    for (const group of groups) {
      const find = (tasks: Task[]): boolean => {
        for (const t of tasks) {
          if (t.id === ancestorId) {
            const checkDescendants = (subtasks: Task[]): boolean => {
              for (const st of subtasks) {
                if (st.id === taskId) return true;
                if (checkDescendants(st.subtasks)) return true;
              }
              return false;
            };
            return checkDescendants(t.subtasks);
          }
          if (find(t.subtasks)) return true;
        }
        return false;
      };
      if (find(group.tasks)) return true;
    }
    return false;
  };

  const findTaskLocation = useCallback((taskId: string): { groupId: string; parentId: string | null; index: number } | null => {
    for (const group of groups) {
      for (let i = 0; i < group.tasks.length; i++) {
        if (group.tasks[i].id === taskId) {
          return { groupId: group.id, parentId: null, index: i };
        }
      }
      const findInSubtasks = (tasks: Task[], parentId: string): { groupId: string; parentId: string; index: number } | null => {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].id === taskId) {
            return { groupId: group.id, parentId, index: i };
          }
          const found = findInSubtasks(tasks[i].subtasks, tasks[i].id);
          if (found) return found;
        }
        return null;
      };
      for (const task of group.tasks) {
        const found = findInSubtasks(task.subtasks, task.id);
        if (found) return found;
      }
    }
    return null;
  }, [groups]);

  const registerTaskRect = useCallback((taskId: string, rect: DOMRect | null, groupId: string, depth: number) => {
    if (rect) {
      taskRectsRef.current.set(taskId, { top: rect.top, bottom: rect.bottom, groupId, depth });
    } else {
      taskRectsRef.current.delete(taskId);
    }
  }, []);

  const handleBeforeCapture = useCallback((before: BeforeCapture) => {
    draggedTaskIdRef.current = before.draggableId;
    setDragState({
      draggedTaskId: before.draggableId,
      overTaskId: null,
      dropPosition: null,
      overGroupId: null,
    });
  }, []);

  const resetDrag = useCallback(() => {
    draggedTaskIdRef.current = null;
    taskRectsRef.current.clear();
    setDragState({
      draggedTaskId: null,
      overTaskId: null,
      dropPosition: null,
      overGroupId: null,
    });
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    const { overTaskId, dropPosition, overGroupId } = dragState;
    
    resetDrag();

    // If we have a custom drop position (from mouse position detection), use that
    if (overTaskId && dropPosition && overGroupId) {
      const targetLocation = findTaskLocation(overTaskId);
      if (!targetLocation) return;

      if (dropPosition === 'inside') {
        moveTaskToSubtask(draggableId, overTaskId, 0);
      } else if (dropPosition === 'before') {
        if (targetLocation.parentId) {
          moveTaskToSubtask(draggableId, targetLocation.parentId, targetLocation.index);
        } else {
          moveTaskToGroup(draggableId, targetLocation.groupId, targetLocation.index);
        }
      } else if (dropPosition === 'after') {
        if (targetLocation.parentId) {
          moveTaskToSubtask(draggableId, targetLocation.parentId, targetLocation.index + 1);
        } else {
          moveTaskToGroup(draggableId, targetLocation.groupId, targetLocation.index + 1);
        }
      }
      return;
    }

    // Fallback to default dnd behavior
    if (!destination) return;

    const sourceDroppableId = source.droppableId;
    const destDroppableId = destination.droppableId;

    if (sourceDroppableId === destDroppableId && source.index === destination.index) {
      return;
    }

    const isSourceSubtask = sourceDroppableId.startsWith('subtasks-');
    const isDestSubtask = destDroppableId.startsWith('subtasks-');
    const isDestGroup = groups.some(g => g.id === destDroppableId);
    const isSourceGroup = groups.some(g => g.id === sourceDroppableId);

    if (isSourceSubtask && isDestSubtask && sourceDroppableId === destDroppableId) {
      const parentTaskId = sourceDroppableId.replace('subtasks-', '');
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

    if (isSourceGroup && isDestGroup && sourceDroppableId === destDroppableId) {
      if (source.index !== destination.index) {
        reorderTasks(sourceDroppableId, source.index, destination.index);
      }
      return;
    }

    if (isDestGroup) {
      moveTaskToGroup(draggableId, destDroppableId, destination.index);
      return;
    }

    if (isDestSubtask) {
      const parentTaskId = destDroppableId.replace('subtasks-', '');
      moveTaskToSubtask(draggableId, parentTaskId, destination.index);
      return;
    }
  }, [dragState, groups, findTaskLocation, moveTaskToGroup, moveTaskToSubtask, reorderTasks, reorderSubtasks, resetDrag]);

  return (
    <DragContext.Provider value={dragState}>
      <DragDropContext 
        onDragEnd={handleDragEnd} 
        onBeforeCapture={handleBeforeCapture}
      >
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
                registerTaskRect={registerTaskRect}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </DragContext.Provider>
  );
}
