import { useState, useEffect, useCallback } from 'react';
import { Task, TaskGroup, TaskStatus } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'task-manager-data-v3';

const defaultGroups: TaskGroup[] = [
  {
    id: uuidv4(),
    name: 'BLOQUEADO',
    status: 'blocked',
    isExpanded: true,
    tasks: [
      {
        id: uuidv4(),
        title: 'Task (matriz)',
        status: 'blocked',
        isExpanded: true,
        createdAt: new Date(),
        subtasks: [
          {
            id: uuidv4(),
            title: 'Subtask 1',
            status: 'todo',
            isExpanded: false,
            createdAt: new Date(),
            subtasks: [],
          },
          {
            id: uuidv4(),
            title: 'Subtask 2',
            status: 'todo',
            isExpanded: false,
            createdAt: new Date(),
            subtasks: [],
          },
        ],
      },
    ],
  },
  {
    id: uuidv4(),
    name: 'A FAZER',
    status: 'todo',
    isExpanded: true,
    tasks: [],
  },
  {
    id: uuidv4(),
    name: 'EM PROGRESSO',
    status: 'in_progress',
    isExpanded: true,
    tasks: [],
  },
  {
    id: uuidv4(),
    name: 'CONCLUÍDO',
    status: 'done',
    isExpanded: true,
    tasks: [],
  },
];

export function useTasks() {
  const [groups, setGroups] = useState<TaskGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate data structure
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }
    return defaultGroups;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const addTask = useCallback((groupId: string, title: string) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      status: 'todo',
      subtasks: [],
      isExpanded: false,
      createdAt: new Date(),
    };

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: [...group.tasks, newTask] }
          : group
      )
    );
  }, []);

  const addSubtask = useCallback((groupId: string, parentTaskId: string, title: string, parentPath: string[] = []) => {
    const newSubtask: Task = {
      id: uuidv4(),
      title,
      status: 'todo',
      subtasks: [],
      isExpanded: false,
      createdAt: new Date(),
    };

    const addSubtaskRecursive = (tasks: Task[], path: string[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === parentTaskId && path.length === 0) {
          return { ...task, subtasks: [...task.subtasks, newSubtask], isExpanded: true };
        }
        if (path.length > 0 && task.id === path[0]) {
          return {
            ...task,
            subtasks: addSubtaskRecursive(task.subtasks, path.slice(1)),
          };
        }
        return {
          ...task,
          subtasks: addSubtaskRecursive(task.subtasks, path),
        };
      });
    };

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: addSubtaskRecursive(group.tasks, parentPath) }
          : group
      )
    );
  }, []);

  const updateTask = useCallback((groupId: string, taskId: string, updates: Partial<Task>) => {
    const updateRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, ...updates };
        }
        return { ...task, subtasks: updateRecursive(task.subtasks) };
      });
    };

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: updateRecursive(group.tasks) }
          : group
      )
    );
  }, []);

  const deleteTask = useCallback((groupId: string, taskId: string) => {
    const deleteRecursive = (tasks: Task[]): Task[] => {
      return tasks
        .filter((task) => task.id !== taskId)
        .map((task) => ({ ...task, subtasks: deleteRecursive(task.subtasks) }));
    };

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: deleteRecursive(group.tasks) }
          : group
      )
    );
  }, []);

  const toggleTaskExpand = useCallback((groupId: string, taskId: string) => {
    const toggleRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, isExpanded: !task.isExpanded };
        }
        return { ...task, subtasks: toggleRecursive(task.subtasks) };
      });
    };

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: toggleRecursive(group.tasks) }
          : group
      )
    );
  }, []);

  const toggleGroupExpand = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  }, []);

  const reorderTasks = useCallback((groupId: string, startIndex: number, endIndex: number) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const newTasks = [...group.tasks];
          const [removed] = newTasks.splice(startIndex, 1);
          newTasks.splice(endIndex, 0, removed);
          return { ...group, tasks: newTasks };
        }
        return group;
      })
    );
  }, []);

  const reorderSubtasks = useCallback((groupId: string, parentTaskId: string, startIndex: number, endIndex: number) => {
    const reorderRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === parentTaskId) {
          const newSubtasks = [...task.subtasks];
          const [removed] = newSubtasks.splice(startIndex, 1);
          newSubtasks.splice(endIndex, 0, removed);
          return { ...task, subtasks: newSubtasks };
        }
        return { ...task, subtasks: reorderRecursive(task.subtasks) };
      });
    };

    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: reorderRecursive(group.tasks) }
          : group
      )
    );
  }, []);

  const getSubtaskCount = useCallback((task: Task): number => {
    let count = task.subtasks.length;
    task.subtasks.forEach((subtask) => {
      count += getSubtaskCount(subtask);
    });
    return count;
  }, []);

  // Find and remove a task from anywhere in the hierarchy, returning the task
  const findAndRemoveTask = useCallback((tasks: Task[], taskId: string): { tasks: Task[]; removed: Task | null } => {
    let removed: Task | null = null;
    
    const newTasks = tasks.filter((task) => {
      if (task.id === taskId) {
        removed = task;
        return false;
      }
      return true;
    });

    if (removed) {
      return { tasks: newTasks, removed };
    }

    // Search in subtasks
    return {
      tasks: newTasks.map((task) => {
        if (removed) return task;
        const result = findAndRemoveTask(task.subtasks, taskId);
        if (result.removed) {
          removed = result.removed;
          return { ...task, subtasks: result.tasks };
        }
        return task;
      }),
      removed,
    };
  }, []);

  // Move a task (from anywhere) to a group's top level
  const moveTaskToGroup = useCallback((taskId: string, targetGroupId: string, targetIndex: number) => {
    setGroups((prev) => {
      let taskToMove: Task | null = null;

      // First, find and remove the task from its current location
      const groupsAfterRemoval = prev.map((group) => {
        const result = findAndRemoveTask(group.tasks, taskId);
        if (result.removed) {
          taskToMove = result.removed;
          return { ...group, tasks: result.tasks };
        }
        return group;
      });

      if (!taskToMove) return prev;

      // Then, add the task to the target group at the specified index
      return groupsAfterRemoval.map((group) => {
        if (group.id === targetGroupId) {
          const newTasks = [...group.tasks];
          newTasks.splice(targetIndex, 0, taskToMove!);
          return { ...group, tasks: newTasks };
        }
        return group;
      });
    });
  }, [findAndRemoveTask]);

  return {
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
  };
}
