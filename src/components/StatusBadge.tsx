import { TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  blocked: { label: 'Bloqueado', className: 'status-blocked' },
  todo: { label: 'A Fazer', className: 'status-todo' },
  in_progress: { label: 'Em Progresso', className: 'status-progress' },
  done: { label: 'Concluído', className: 'status-done' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
