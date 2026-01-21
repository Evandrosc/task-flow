import { Droppable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import { TaskGroup as TaskGroupType, Task } from '@/types/task';
import { TaskItem } from './TaskItem';
import { AddTaskInput } from './AddTaskInput';
import { StatusBadge } from './StatusBadge';
import { useDragState } from './DragContext';

interface TaskGroupProps {
  group: TaskGroupType;
  onToggleExpand: (groupId: string) => void;
  onToggleTaskExpand: (groupId: string, taskId: string) => void;
  onAddTask: (groupId: string, title: string) => void;
  onAddSubtask: (groupId: string, parentTaskId: string, title: string) => void;
  onUpdateTask: (groupId: string, taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (groupId: string, taskId: string) => void;
  onReorderSubtasks: (groupId: string, parentTaskId: string, startIndex: number, endIndex: number) => void;
  getSubtaskCount: (task: Task) => number;
}

function DropIndicator() {
  return (
    <div className="drop-indicator">
      <div className="drop-indicator-arrow" />
      <div className="drop-indicator-line" />
    </div>
  );
}

export function TaskGroup({
  group,
  onToggleExpand,
  onToggleTaskExpand,
  onAddTask,
  onAddSubtask,
  onUpdateTask,
  onDeleteTask,
  onReorderSubtasks,
  getSubtaskCount,
}: TaskGroupProps) {
  const dragState = useDragState();

  // Prevent subtasks from being dropped into the group root by mistake due to nested droppables.
  // This avoids the "subtask vira task" bug when trying to reorder subtasks.
  const isDraggingSubtask = (dragState.sourceDroppableId ?? '').startsWith('subtasks-');
  
  // Show indicator at end only when dragging from a different group or dragging up within same group
  const isSameGroup = dragState.sourceDroppableId === group.id && dragState.destinationDroppableId === group.id;
  const isDraggingDown = isSameGroup && dragState.sourceIndex !== null && dragState.sourceIndex < (dragState.destinationIndex ?? 0);
  
  // Only show at end if not dragging down within same group (when dragging down, indicator is shown below items)
  const showIndicatorAtEnd = dragState.destinationDroppableId === group.id && 
    dragState.destinationIndex === group.tasks.length &&
    !isDraggingDown;

  return (
    <div>
      <div className="flex items-center gap-2 py-3 px-3 border-b border-border">
        <button
          onClick={() => onToggleExpand(group.id)}
          className="p-0.5 hover:bg-muted rounded transition-colors"
        >
          {group.isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <StatusBadge status={group.status} />

        <span className="text-xs text-muted-foreground ml-1">
          {group.tasks.length}
        </span>

        <div className="flex-1" />

        <button className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {group.isExpanded && (
        <div className="bg-card/50">
          <Droppable droppableId={group.id} type="TASK" isDropDisabled={isDraggingSubtask}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-[20px]"
              >
                {group.tasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    groupId={group.id}
                    index={index}
                    listDroppableId={group.id}
                    onToggleExpand={onToggleTaskExpand}
                    onAddSubtask={onAddSubtask}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onReorderSubtasks={onReorderSubtasks}
                    getSubtaskCount={getSubtaskCount}
                  />
                ))}
                {showIndicatorAtEnd && <DropIndicator />}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <AddTaskInput
            onAdd={(title) => onAddTask(group.id, title)}
            placeholder="Adicionar Tarefa"
            indent={0}
          />
        </div>
      )}
    </div>
  );
}
