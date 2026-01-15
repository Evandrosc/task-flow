import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTaskInputProps {
  onAdd: (title: string) => void;
  placeholder?: string;
  className?: string;
  indent?: number;
}

export function AddTaskInput({ onAdd, placeholder = 'Adicionar Tarefa', className, indent = 0 }: AddTaskInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle('');
      setIsEditing(false);
    }
  };

  const paddingLeft = indent * 32 + 12;

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={cn(
          'flex items-center gap-2 w-full py-2 text-muted-foreground hover:text-foreground transition-colors group',
          className
        )}
        style={{ paddingLeft }}
      >
        <Plus className="h-4 w-4 opacity-60 group-hover:opacity-100" />
        <span className="text-sm">{placeholder}</span>
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 py-1', className)} style={{ paddingLeft }}>
      <Plus className="h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder={placeholder}
        autoFocus
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
