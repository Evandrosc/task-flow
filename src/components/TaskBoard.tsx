import { useTasks } from '@/hooks/useTasks';
import { TaskGroup } from './TaskGroup';

export function TaskBoard() {
  const {
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
  } = useTasks();

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto py-4">
        {groups.map((group) => (
          <TaskGroup
            key={group.id}
            group={group}
            onToggleExpand={toggleGroupExpand}
            onToggleTaskExpand={toggleTaskExpand}
            onAddTask={addTask}
            onAddSubtask={addSubtask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onReorderTasks={reorderTasks}
            onReorderSubtasks={reorderSubtasks}
            getSubtaskCount={getSubtaskCount}
          />
        ))}
      </div>
    </div>
  );
}
