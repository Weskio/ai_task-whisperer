
import React from 'react';
import { Task } from './TaskCard';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  columnId: 'todo' | 'inProgress' | 'done';
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onEditTask: (taskId: string, newTitle: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  tasks,
  columnId,
  onDragStart,
  onDrop,
  onDragOver,
  onEditTask,
  onToggleSubtask,
  onAddSubtask,
}) => {
  return (
    <div 
      className="flex flex-col bg-secondary/30 rounded-lg p-4 w-full min-h-[500px] max-h-[80vh] overflow-y-auto"
      onDrop={(e) => onDrop(e, columnId)}
      onDragOver={onDragOver}
    >
      <div className="mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
      </div>
      <div className="space-y-3 flex-1">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onEditTask={onEditTask}
            onToggleSubtask={onToggleSubtask}
            onAddSubtask={onAddSubtask}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskColumn;
