
import React, { useState, useEffect } from 'react';
import { Plus, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskColumn from '@/components/TaskColumn';
import AddTaskModal from '@/components/AddTaskModal';
import APIKeyModal from '@/components/APIKeyModal';
import { Task } from '@/components/TaskCard';
import { useTasks } from '@/hooks/useTasks';

const Index = () => {
  const { 
    tasks, 
    loading, 
    modalOpen, 
    setModalOpen, 
    addTask, 
    moveTask, 
    editTask,
    addSubtask,
    toggleSubtask 
  } = useTasks();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Check if API key is stored
  useEffect(() => {
    const apiKey = localStorage.getItem('openai_api_key');
    setHasApiKey(!!apiKey);
  }, [apiKeyModalOpen]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedTask) {
      moveTask(draggedTask.id, columnId as 'todo' | 'inProgress' | 'done');
      setDraggedTask(null);
    }
  };

  // Filter tasks by column
  const todoTasks = tasks.filter(task => task.column === 'todo');
  const inProgressTasks = tasks.filter(task => task.column === 'inProgress');
  const doneTasks = tasks.filter(task => task.column === 'done');

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">AI Task whisperer</h1>
              <p className="text-muted-foreground mt-1">
                AI-powered task management
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setApiKeyModalOpen(true)}
                title={hasApiKey ? "API Key Configured" : "Set OpenAI API Key"}
              >
                <Key className={`h-4 w-4 ${hasApiKey ? "text-green-500" : ""}`} />
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TaskColumn
            title="To Do"
            tasks={todoTasks}
            columnId="todo"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEditTask={editTask}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
          />
          
          <TaskColumn
            title="In Progress"
            tasks={inProgressTasks}
            columnId="inProgress"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEditTask={editTask}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
          />
          
          <TaskColumn
            title="Done"
            tasks={doneTasks}
            columnId="done"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEditTask={editTask}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
          />
        </div>

        <AddTaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onAddTask={addTask}
          isLoading={loading}
        />

        <APIKeyModal 
          isOpen={apiKeyModalOpen}
          onClose={() => setApiKeyModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Index;
