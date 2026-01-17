import { Droppable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import { TaskGroup as TaskGroupType, Task } from '@/types/task';
import { TaskItem } from './TaskItem';
import { AddTaskInput } from './AddTaskInput';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

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
          <Droppable droppableId={group.id} type="TASK">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  'min-h-[20px] transition-colors',
                  snapshot.isDraggingOver && 'bg-task-hover'
                )}
              >
                {group.tasks.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    groupId={group.id}
                    index={index}
                    onToggleExpand={onToggleTaskExpand}
                    onAddSubtask={onAddSubtask}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onReorderSubtasks={onReorderSubtasks}
                    getSubtaskCount={getSubtaskCount}
                  />
                ))}
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
