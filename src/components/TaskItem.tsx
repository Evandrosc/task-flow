import { useState } from 'react';
import { Draggable, Droppable, DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ChevronRight, ChevronDown, GripVertical, MoreHorizontal, Pencil, Trash2, Link } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { TaskStatusIcon } from './TaskStatusIcon';
import { AddTaskInput } from './AddTaskInput';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskItemProps {
  task: Task;
  groupId: string;
  index: number;
  depth?: number;
  onToggleExpand: (groupId: string, taskId: string) => void;
  onAddSubtask: (groupId: string, parentTaskId: string, title: string) => void;
  onUpdateTask: (groupId: string, taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (groupId: string, taskId: string) => void;
  onReorderSubtasks: (groupId: string, parentTaskId: string, startIndex: number, endIndex: number) => void;
  getSubtaskCount: (task: Task) => number;
}

export function TaskItem({
  task,
  groupId,
  index,
  depth = 0,
  onToggleExpand,
  onAddSubtask,
  onUpdateTask,
  onDeleteTask,
  onReorderSubtasks,
  getSubtaskCount,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const hasSubtasks = task.subtasks.length > 0;
  const subtaskCount = getSubtaskCount(task);

  const handleEditSubmit = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdateTask(groupId, task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleStatusChange = (status: TaskStatus) => {
    onUpdateTask(groupId, task.id, { status });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorderSubtasks(groupId, task.id, result.source.index, result.destination.index);
  };

  const paddingLeft = depth * 32 + 12;

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              'task-item flex items-center gap-2 py-2 border-b border-border/50 group',
              snapshot.isDragging && 'task-dragging rounded-md z-50'
            )}
            style={{
              ...provided.draggableProps.style,
              paddingLeft,
            }}
          >
            <div
              {...provided.dragHandleProps}
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {hasSubtasks ? (
              <button
                onClick={() => onToggleExpand(groupId, task.id)}
                className="p-0.5 hover:bg-muted rounded transition-colors"
              >
                {task.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-0.5 hover:bg-muted rounded transition-colors">
                  <TaskStatusIcon status={task.status} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                  <TaskStatusIcon status="todo" className="mr-2" />
                  A Fazer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  <TaskStatusIcon status="in_progress" className="mr-2" />
                  Em Progresso
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('blocked')}>
                  <TaskStatusIcon status="blocked" className="mr-2" />
                  Bloqueado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                  <TaskStatusIcon status="done" className="mr-2" />
                  Concluído
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 min-w-0 overflow-hidden">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleEditSubmit}
                  autoFocus
                  className="w-full bg-transparent text-sm outline-none text-foreground"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm text-foreground',
                      task.status === 'done' && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title || 'Sem título'}
                  </span>
                  {subtaskCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Link className="h-3 w-3" />
                      {subtaskCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-muted rounded transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddSubtask(groupId, task.id, 'Nova subtarefa')}>
                    <Link className="h-4 w-4 mr-2" />
                    Adicionar Subtarefa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteTask(groupId, task.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </Draggable>

      {task.isExpanded && hasSubtasks && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`subtasks-${task.id}`} type={`subtasks-${task.id}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {task.subtasks.map((subtask, subtaskIndex) => (
                  <TaskItem
                    key={subtask.id}
                    task={subtask}
                    groupId={groupId}
                    index={subtaskIndex}
                    depth={depth + 1}
                    onToggleExpand={onToggleExpand}
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
        </DragDropContext>
      )}

      {task.isExpanded && (
        <AddTaskInput
          onAdd={(title) => onAddSubtask(groupId, task.id, title)}
          placeholder="Adicionar Subtarefa"
          indent={depth + 1}
        />
      )}
    </>
  );
}
