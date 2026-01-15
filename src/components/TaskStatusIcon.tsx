import { TaskStatus } from '@/types/task';
import { Circle, CircleDot, CircleCheck, CircleX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStatusIconProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { icon: typeof Circle; className: string }> = {
  todo: { icon: Circle, className: 'text-status-todo' },
  in_progress: { icon: CircleDot, className: 'text-status-progress' },
  blocked: { icon: CircleX, className: 'text-status-blocked' },
  done: { icon: CircleCheck, className: 'text-status-done' },
};

export function TaskStatusIcon({ status, className }: TaskStatusIconProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return <Icon className={cn('h-4 w-4', config.className, className)} />;
}
