import React, { useState, useRef } from 'react';
import { Sparkle, Tag, Pen, ListCheck, CheckCircle, CircleGauge, Trash, Move, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  onEditTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onEditSubtask?: (taskId: string, subtaskId: string, title: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onMoveTask?: (taskId: string, column: 'todo' | 'inProgress' | 'done') => void;
  onRegenerateAiSuggestions?: (taskId: string) => void;
}

export const PriorityLabel: React.FC<{ priority: Priority; onClick?: () => void; className?: string }> = ({ priority, onClick, className }) => {
  const priorityClasses: Record<Priority, string> = {
    high: 'priority-high bg-red-100 text-red-700',
    medium: 'priority-medium bg-yellow-100 text-yellow-700',
    low: 'priority-low bg-green-100 text-green-700',
  };

  const priorityText: Record<Priority, string> = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority',
  };

  return (
    <span 
      className={cn(
        "text-xs px-2 py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer",
        priorityClasses[priority],
        className
      )}
      onClick={onClick}
    >
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
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onDeleteTask,
  onMoveTask,
  onRegenerateAiSuggestions
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  
  // References for focus management
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // Ensure subtasks is an array before calculating progress
  const subtasks = task.subtasks || [];
  
  // Calculate progress based on completed subtasks
  const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
  const progressPercentage = subtasks.length > 0 
    ? Math.round((completedSubtasks / subtasks.length) * 100) 
    : 0;

  const handleEditSave = () => {
    if (newTitle.trim()) {
      onEditTask(task.id, { title: newTitle.trim() });
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

  const handleStartEditSubtask = (subtask: SubTask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  const handleSaveSubtaskEdit = () => {
    if (editingSubtaskId && editingSubtaskTitle.trim() && onEditSubtask) {
      onEditSubtask(task.id, editingSubtaskId, editingSubtaskTitle.trim());
      setEditingSubtaskId(null);
    }
  };

  const handlePriorityChange = (newPriority: Priority) => {
    onEditTask(task.id, { priority: newPriority });
    setIsPriorityOpen(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent, 
    saveFunction: () => void, 
    cancelFunction: () => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveFunction();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelFunction();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className="task-card mb-3 w-full"
          draggable={!isEditing && !isAddingSubtask && editingSubtaskId === null}
          onDragStart={(e) => !isEditing && !isAddingSubtask && onDragStart(e, task)}
        >
          <div className="flex justify-between items-start mb-2">
            {isEditing ? (
              <div className="flex w-full">
                <Input 
                  ref={titleInputRef}
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(
                    e, 
                    handleEditSave, 
                    () => {
                      setNewTitle(task.title);
                      setIsEditing(false);
                    }
                  )}
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
            <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
              <PopoverTrigger asChild>
                <div>
                  <PriorityLabel 
                    priority={task.priority} 
                    onClick={() => setIsPriorityOpen(true)} 
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-start",
                      task.priority === 'high' && "bg-accent"
                    )}
                    onClick={() => handlePriorityChange('high')}
                  >
                    <PriorityLabel priority="high" className="w-full" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-start",
                      task.priority === 'medium' && "bg-accent"
                    )}
                    onClick={() => handlePriorityChange('medium')}
                  >
                    <PriorityLabel priority="medium" className="w-full" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-start",
                      task.priority === 'low' && "bg-accent"
                    )}
                    onClick={() => handlePriorityChange('low')}
                  >
                    <PriorityLabel priority="low" className="w-full" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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
                      {editingSubtaskId === subtask.id ? (
                        <div className="flex flex-1 gap-2">
                          <Input
                            ref={subtaskInputRef}
                            value={editingSubtaskTitle}
                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(
                              e,
                              handleSaveSubtaskEdit,
                              () => {
                                setEditingSubtaskId(null);
                              }
                            )}
                            className="text-sm flex-grow"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSaveSubtaskEdit}>Save</Button>
                        </div>
                      ) : (
                        <>
                          <label 
                            htmlFor={`subtask-${subtask.id}`}
                            className={cn(
                              "text-sm cursor-pointer flex-1", 
                              subtask.completed ? "line-through text-muted-foreground" : ""
                            )}
                          >
                            {subtask.title}
                          </label>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => handleStartEditSubtask(subtask)}
                            >
                              <Pen className="h-3 w-3" />
                              <span className="sr-only">Edit subtask</span>
                            </Button>
                            {onDeleteSubtask && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={() => onDeleteSubtask(task.id, subtask.id)}
                              >
                                <Trash className="h-3 w-3" />
                                <span className="sr-only">Delete subtask</span>
                              </Button>
                            )}
                          </div>
                        </>
                      )}
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
                      onKeyDown={(e) => handleKeyDown(
                        e,
                        handleAddSubtask,
                        () => {
                          setNewSubtask('');
                          setIsAddingSubtask(false);
                        }
                      )}
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
                  {onRegenerateAiSuggestions && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3 gap-2"
                      onClick={() => onRegenerateAiSuggestions(task.id)}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate Suggestions
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-64">
        <ContextMenuItem 
          className="flex items-center gap-2"
          onClick={() => setIsEditing(true)}
        >
          <Pen className="h-4 w-4" />
          Edit Task
        </ContextMenuItem>
        
        {onDeleteTask && (
          <ContextMenuItem 
            className="flex items-center gap-2 text-destructive focus:text-destructive"
            onClick={() => onDeleteTask(task.id)}
          >
            <Trash className="h-4 w-4" />
            Delete Task
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        {onMoveTask && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Move To
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem 
                className="flex items-center gap-2"
                onClick={() => onMoveTask(task.id, 'todo')}
                disabled={task.column === 'todo'}
              >
                To Do
              </ContextMenuItem>
              <ContextMenuItem 
                className="flex items-center gap-2"
                onClick={() => onMoveTask(task.id, 'inProgress')}
                disabled={task.column === 'inProgress'}
              >
                In Progress
              </ContextMenuItem>
              <ContextMenuItem 
                className="flex items-center gap-2"
                onClick={() => onMoveTask(task.id, 'done')}
                disabled={task.column === 'done'}
              >
                Done
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        
        {onRegenerateAiSuggestions && (
          <ContextMenuItem 
            className="flex items-center gap-2"
            onClick={() => onRegenerateAiSuggestions(task.id)}
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate AI Suggestions
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TaskCard;