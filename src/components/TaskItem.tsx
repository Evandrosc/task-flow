import { useState, useRef, useEffect } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { ChevronRight, ChevronDown, GripVertical, MoreHorizontal, Pencil, Trash2, Link } from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { TaskStatusIcon } from './TaskStatusIcon';
import { cn } from '@/lib/utils';
import { useDragState } from './DragContext';
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
  parentTaskId?: string;
  listDroppableId: string;
  onToggleExpand: (groupId: string, taskId: string) => void;
  onAddSubtask: (groupId: string, parentTaskId: string, title: string) => void;
  onUpdateTask: (groupId: string, taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (groupId: string, taskId: string) => void;
  onReorderSubtasks: (groupId: string, parentTaskId: string, startIndex: number, endIndex: number) => void;
  getSubtaskCount: (task: Task) => number;
  registerTaskRect: (taskId: string, rect: DOMRect | null, groupId: string, depth: number) => void;
}

const INDENT_WIDTH = 32;

function DropIndicator({ position, depth }: { position: 'before' | 'after' | 'inside'; depth: number }) {
  const marginLeft = depth * INDENT_WIDTH + 12;
  const isInside = position === 'inside';
  
  return (
    <div 
      className="relative h-0 pointer-events-none z-50"
      style={{ marginLeft }}
    >
      <div className={cn(
        "h-0.5 relative",
        isInside ? "bg-green-500" : "bg-primary"
      )}>
        <div className={cn(
          "absolute -left-1 -top-1 w-2 h-2 rounded-full",
          isInside ? "bg-green-500" : "bg-primary"
        )} />
      </div>
    </div>
  );
}

export function TaskItem({
  task,
  groupId,
  index,
  depth = 0,
  listDroppableId,
  onToggleExpand,
  onAddSubtask,
  onUpdateTask,
  onDeleteTask,
  onReorderSubtasks,
  getSubtaskCount,
  registerTaskRect,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const hasSubtasks = task.subtasks.length > 0;
  const subtaskCount = getSubtaskCount(task);
  const dragState = useDragState();
  const itemRef = useRef<HTMLDivElement>(null);

  // Register element rect for drag detection
  useEffect(() => {
    const updateRect = () => {
      if (itemRef.current) {
        registerTaskRect(task.id, itemRef.current.getBoundingClientRect(), groupId, depth);
      }
    };
    
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    
    return () => {
      registerTaskRect(task.id, null, groupId, depth);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [task.id, groupId, depth, registerTaskRect]);

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

  const paddingLeft = depth * INDENT_WIDTH + 12;

  // Show indicators based on dragState
  const showBefore = dragState.overTaskId === task.id && dragState.dropPosition === 'before';
  const showAfter = dragState.overTaskId === task.id && dragState.dropPosition === 'after';
  const showInside = dragState.overTaskId === task.id && dragState.dropPosition === 'inside';
  const isDragging = dragState.draggedTaskId === task.id;

  return (
    <>
      {showBefore && <DropIndicator position="before" depth={depth} />}
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={(el) => {
              provided.innerRef(el);
              (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              'task-item flex items-center gap-2 py-2 border-b border-border/50 group cursor-grab active:cursor-grabbing',
              snapshot.isDragging && 'task-dragging rounded-md z-50',
              isDragging && 'opacity-50',
              showInside && 'bg-accent/50 ring-1 ring-primary/30'
            )}
            style={{
              ...provided.draggableProps.style,
              paddingLeft,
            }}
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {hasSubtasks ? (
              <button
                onClick={() => onToggleExpand(groupId, task.id)}
                className="p-0.5 hover:bg-muted rounded transition-colors"
                type="button"
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
                <button className="p-0.5 hover:bg-muted rounded transition-colors" type="button">
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
                  <button className="p-1 hover:bg-muted rounded transition-colors" type="button">
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
      {showAfter && <DropIndicator position="after" depth={depth} />}
      {showInside && <DropIndicator position="inside" depth={depth + 1} />}

      {task.isExpanded && hasSubtasks && (
        <Droppable droppableId={`subtasks-${task.id}`} type="TASK">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {task.subtasks.map((subtask, subtaskIndex) => (
                <TaskItem
                  key={subtask.id}
                  task={subtask}
                  groupId={groupId}
                  index={subtaskIndex}
                  depth={depth + 1}
                  listDroppableId={`subtasks-${task.id}`}
                  onToggleExpand={onToggleExpand}
                  onAddSubtask={onAddSubtask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onReorderSubtasks={onReorderSubtasks}
                  getSubtaskCount={getSubtaskCount}
                  registerTaskRect={registerTaskRect}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </>
  );
}
