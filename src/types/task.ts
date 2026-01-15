export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  subtasks: Task[];
  isExpanded: boolean;
  createdAt: Date;
}

export interface TaskGroup {
  id: string;
  name: string;
  status: TaskStatus;
  tasks: Task[];
  isExpanded: boolean;
}
