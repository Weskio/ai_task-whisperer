
import React, { useState } from 'react';
import { Sparkle, Tag, Pen, ListCheck, CheckCircle, CircleGauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  aiSuggestions: string[];
  column: 'todo' | 'inProgress' | 'done';
  subtasks: SubTask[];
}

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onEditTask: (taskId: string, newTitle: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
}

export const PriorityLabel: React.FC<{ priority: Priority }> = ({ priority }) => {
  const priorityClasses: Record<Priority, string> = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };

  const priorityText: Record<Priority, string> = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
  };

  return (
    <span className={cn("text-xs px-2 py-1 rounded-full inline-flex items-center gap-1.5", priorityClasses[priority])}>
      <Tag className="w-3 h-3" />
      {priorityText[priority]}
    </span>
  );
};

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onDragStart, 
  onEditTask,
  onToggleSubtask,
  onAddSubtask
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Ensure subtasks is an array before calculating progress
  const subtasks = task.subtasks || [];
  
  // Calculate progress based on completed subtasks
  const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
  const progressPercentage = subtasks.length > 0 
    ? Math.round((completedSubtasks / subtasks.length) * 100) 
    : 0;

  const handleEditSave = () => {
    if (newTitle.trim()) {
      onEditTask(task.id, newTitle.trim());
      setIsEditing(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
      setIsAddingSubtask(false);
    }
  };

  return (
    <div 
      className="task-card mb-3 w-full"
      draggable={!isEditing && !isAddingSubtask}
      onDragStart={(e) => !isEditing && !isAddingSubtask && onDragStart(e, task)}
    >
      <div className="flex justify-between items-start mb-2">
        {isEditing ? (
          <div className="flex w-full">
            <Input 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              className="mr-2 flex-grow"
              autoFocus
            />
            <Button size="sm" onClick={handleEditSave}>Save</Button>
          </div>
        ) : (
          <>
            <h3 className="font-medium text-foreground">{task.title}</h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0" 
              onClick={() => setIsEditing(true)}
            >
              <Pen className="h-4 w-4" />
              <span className="sr-only">Edit task</span>
            </Button>
          </>
        )}
      </div>
      
      <div className="mb-3">
        <PriorityLabel priority={task.priority} />
      </div>

      {/* Subtasks section */}
      <Accordion type="single" collapsible className="w-full mb-2">
        <AccordionItem value="subtasks">
          <AccordionTrigger className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5">
            <ListCheck className="h-4 w-4" /> 
            <span>Subtasks ({completedSubtasks}/{subtasks.length})</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 mb-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Checkbox 
                    id={`subtask-${subtask.id}`} 
                    checked={subtask.completed}
                    onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                  />
                  <label 
                    htmlFor={`subtask-${subtask.id}`}
                    className={cn(
                      "text-sm cursor-pointer flex-1", 
                      subtask.completed ? "line-through text-muted-foreground" : ""
                    )}
                  >
                    {subtask.title}
                  </label>
                </div>
              ))}
            </div>

            {isAddingSubtask ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="New subtask..."
                  className="text-sm flex-grow"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddSubtask}>Add</Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="w-full mt-2" 
                onClick={() => setIsAddingSubtask(true)}
              >
                Add Subtask
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <CircleGauge className="h-3 w-3" />
              Progress
            </span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}
      
      {/* AI Suggestions */}
      {task.aiSuggestions && task.aiSuggestions.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="suggestions">
            <AccordionTrigger className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-1.5">
              <Sparkle className="h-4 w-4" /> 
              <span>AI Suggestions</span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                {task.aiSuggestions.map((suggestion, index) => (
                  <li key={index} className="hover:text-foreground transition-colors">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export default TaskCard;
