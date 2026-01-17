import { DragDropContext, DropResult } from '@hello-pangea/dnd';
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
    moveTaskToGroup,
  } = useTasks();

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    
    const sourceDroppableId = source.droppableId;
    const destDroppableId = destination.droppableId;
    
    // Check if destination is a group (not a subtask container)
    const isDestGroup = groups.some(g => g.id === destDroppableId);
    const isSourceGroup = groups.some(g => g.id === sourceDroppableId);
    
    // Moving within the same group at root level
    if (isSourceGroup && isDestGroup && sourceDroppableId === destDroppableId) {
      if (source.index !== destination.index) {
        reorderTasks(sourceDroppableId, source.index, destination.index);
      }
      return;
    }
    
    // Moving from subtasks to a group (promoting subtask to task)
    // Or moving between groups
    if (isDestGroup) {
      moveTaskToGroup(draggableId, destDroppableId, destination.index);
      return;
    }
    
    // Moving within subtasks of the same parent
    if (sourceDroppableId === destDroppableId && sourceDroppableId.startsWith('subtasks-')) {
      const parentTaskId = sourceDroppableId.replace('subtasks-', '');
      // Find which group this parent belongs to
      for (const group of groups) {
        const findParentGroup = (tasks: typeof group.tasks): string | null => {
          for (const task of tasks) {
            if (task.id === parentTaskId) return group.id;
            const found = findParentGroup(task.subtasks);
            if (found) return found;
          }
          return null;
        };
        const groupId = findParentGroup(group.tasks);
        if (groupId) {
          reorderSubtasks(groupId, parentTaskId, source.index, destination.index);
          return;
        }
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
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
              onReorderSubtasks={reorderSubtasks}
              getSubtaskCount={getSubtaskCount}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}
