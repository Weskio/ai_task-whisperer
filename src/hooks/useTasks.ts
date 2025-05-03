
import { useState, useEffect } from 'react';
import { Task, SubTask } from '@/components/TaskCard';
import { generateTaskSuggestions } from '@/services/aiService';
import { toast } from 'sonner';

// Load tasks from localStorage if available
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

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = async (taskData: Omit<Task, 'id' | 'aiSuggestions'>) => {
    try {
      setLoading(true);
      
      // Create new task with a unique ID
      const newTaskId = Date.now().toString();
      
      // Generate AI suggestions based on the task title
      const suggestions = await generateTaskSuggestions(taskData.title);
      
      const newTask: Task = {
        id: newTaskId,
        title: taskData.title,
        priority: taskData.priority,
        aiSuggestions: suggestions || [], // Ensure we handle if suggestions is undefined
        column: 'todo',
        subtasks: taskData.subtasks || [], // Ensure we use provided subtasks or default to empty array
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
    
    // Show appropriate toast based on the column
    const columnMessages = {
      todo: 'Task moved to To Do',
      inProgress: 'Task moved to In Progress',
      done: 'Task marked as Done',
    };
    
    toast.info(columnMessages[targetColumn]);
  };

  const editTask = (taskId: string, newTitle: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, title: newTitle } : task
      )
    );
    toast.success('Task updated successfully');
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

  return {
    tasks,
    loading,
    modalOpen,
    setModalOpen,
    addTask,
    moveTask,
    editTask,
    addSubtask,
    toggleSubtask,
  };
};
