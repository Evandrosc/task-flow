import { useState, forwardRef } from 'react';
import { Plus, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskStatusIcon } from './TaskStatusIcon';
import { Button } from '@/components/ui/button';

interface AddTaskInputProps {
  onAdd: (title: string) => void;
  placeholder?: string;
  className?: string;
  indent?: number;
}

export const AddTaskInput = forwardRef<HTMLDivElement, AddTaskInputProps>(
  ({ onAdd, placeholder = 'Adicionar Tarefa', className, indent = 0 }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    const handleSubmit = () => {
      if (title.trim()) {
        onAdd(title.trim());
        setTitle('');
        setIsEditing(false);
      }
    };

    const handleCancel = () => {
      setTitle('');
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    const paddingLeft = indent * 32 + 12;

    if (!isEditing) {
      return (
        <div ref={ref} className={cn('py-1', className)} style={{ paddingLeft }}>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors group"
            type="button"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">{placeholder}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn('py-2 border-b border-primary/30', className)} style={{ paddingLeft }}>
        <div className="flex items-center gap-3 pr-3">
          <TaskStatusIcon status="todo" className="flex-shrink-0" />
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tarefa Nome ou type '/' for commands"
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground min-w-0"
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground h-7 px-2"
              type="button"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="h-7 px-3 bg-primary hover:bg-primary/90"
              type="button"
            >
              Salvar ↵
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

AddTaskInput.displayName = 'AddTaskInput';