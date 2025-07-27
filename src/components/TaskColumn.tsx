
import React from 'react';
import { Task } from '@/types';
import TaskCard from '@/components/TaskCard';

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  columnId: string;
  color?: string;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDrop: (e: React.DragEvent, columnId: string, index?: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onEditTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onEditSubtask: (taskId: string, subtaskId: string, title: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, columnId: string, newOrder?: number) => void;
  onRegenerateAiSuggestions: (taskId: string) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  tasks,
  columnId,
  color = 'hsl(var(--muted))',
  onDragStart,
  onDrop,
  onDragOver,
  onEditTask,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onDeleteTask,
  onMoveTask,
  onRegenerateAiSuggestions,
}) => {
  const handleDropOnTask = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e, columnId, index);
  };

  const handleDropOnColumn = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, columnId, tasks.length);
  };

  return (
    <div 
      className="flex flex-col rounded-lg p-4 w-full min-h-[500px] max-h-[80vh] overflow-y-auto border"
      style={{ backgroundColor: color }}
      onDrop={handleDropOnColumn}
      onDragOver={onDragOver}
    >
      <div className="mb-4">
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
      </div>
      
      <div className="space-y-3 flex-1">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            onDrop={(e) => handleDropOnTask(e, index)}
            onDragOver={onDragOver}
            className="relative"
          >
            <TaskCard 
              task={task}
              onDragStart={onDragStart}
              onEditTask={onEditTask}
              onToggleSubtask={onToggleSubtask}
              onAddSubtask={onAddSubtask}
              onEditSubtask={onEditSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onDeleteTask={onDeleteTask}
              onMoveTask={onMoveTask}
              onRegenerateAiSuggestions={onRegenerateAiSuggestions}
            />
          </div>
        ))}
        
        {/* Drop zone at the end */}
        <div
          className="h-8 w-full opacity-0 hover:opacity-20 bg-primary/20 rounded border-2 border-dashed border-primary transition-opacity"
          onDrop={handleDropOnColumn}
          onDragOver={onDragOver}
        />
      </div>
    </div>
  );
};

export default TaskColumn;
