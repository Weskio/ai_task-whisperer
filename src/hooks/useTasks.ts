import { useState, useEffect } from 'react';
import { Task, SubTask } from '@/components/TaskCard';
import { generateTaskSuggestions } from '@/services/aiService';
import { toast } from 'sonner';

const loadTasks = (): Task[] => {
  const saved = localStorage.getItem('tasks');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved tasks:', e);
    }
  }
  
  // Default tasks if none exist
  return [];
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = async (taskData: Omit<Task, 'id' | 'aiSuggestions'>) => {
    try {
      setLoading(true);
      
      const newTaskId = Date.now().toString();
      
      const suggestions = await generateTaskSuggestions(taskData.title);
      
      const newTask: Task = {
        id: newTaskId,
        title: taskData.title,
        priority: taskData.priority,
        aiSuggestions: suggestions || [], 
        column: 'todo',
        subtasks: taskData.subtasks || [], 
      };
      
      setTasks((prev) => [...prev, newTask]);
      setModalOpen(false);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const moveTask = (taskId: string, targetColumn: 'todo' | 'inProgress' | 'done') => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, column: targetColumn } : task
      )
    );
    
    const columnMessages = {
      todo: 'Task moved to To Do',
      inProgress: 'Task moved to In Progress',
      done: 'Task marked as Done',
    };
    
    toast.info(columnMessages[targetColumn]);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    toast.success('Task deleted successfully');
  };

  const editTask = (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
    toast.success('Task updated successfully');
  };

  const regenerateAiSuggestions = async (taskId: string) => {
    try {
      setLoading(true);
      
      const task = tasks.find((t) => t.id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      const suggestions = await generateTaskSuggestions(task.title);
      
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, aiSuggestions: suggestions || [] } : t
        )
      );
      
      toast.success('AI suggestions updated');
    } catch (error) {
      console.error('Error regenerating AI suggestions:', error);
      toast.error('Failed to update AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const addSubtask = (taskId: string, title: string) => {
    const newSubtaskId = Date.now().toString();
    
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                {
                  id: newSubtaskId,
                  title,
                  completed: false,
                },
              ],
            }
          : task
      )
    );
    
    toast.success('Subtask added');
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      )
    );
  };

  const editSubtask = (taskId: string, subtaskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === subtaskId
                  ? { ...subtask, title }
                  : subtask
              ),
            }
          : task
      )
    );
    toast.success('Subtask updated');
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((subtask) => subtask.id !== subtaskId),
            }
          : task
      )
    );
    toast.success('Subtask deleted');
  };

  return {
    tasks,
    loading,
    modalOpen,
    setModalOpen,
    addTask,
    moveTask,
    deleteTask,
    editTask,
    regenerateAiSuggestions,
    addSubtask,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
  };
};