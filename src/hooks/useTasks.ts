
import { useState, useEffect } from 'react';
import { Task, SubTask } from '@/components/TaskCard';
import { generateTaskSuggestions } from '@/services/aiService';
import { toast } from 'sonner';
import { format, isToday, parseISO, differenceInCalendarDays } from 'date-fns';

const loadTasks = (): Task[] => {
  const saved = localStorage.getItem('tasks');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved tasks:', e);
    }
  }
  
  return [];
};

const loadStreakData = (): { completedDates: string[], lastCompletedDate: string | null } => {
  const saved = localStorage.getItem('streak_data');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved streak data:', e);
    }
  }
  
  return { completedDates: [], lastCompletedDate: null };
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState<boolean>(false);
  const [streakData, setStreakData] = useState(loadStreakData());
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('streak_data', JSON.stringify(streakData));
  }, [streakData]);

  // Calculate current streak
  useEffect(() => {
    if (!streakData.lastCompletedDate) {
      setCurrentStreak(0);
      return;
    }

    // Check if user completed a task today or yesterday
    const lastCompletedDate = parseISO(streakData.lastCompletedDate);
    const isActiveStreak = isToday(lastCompletedDate) || 
      differenceInCalendarDays(new Date(), lastCompletedDate) === 1;
      
    if (!isActiveStreak) {
      setCurrentStreak(0);
      return;
    }
    
    // Count consecutive days
    const sortedDates = [...streakData.completedDates]
      .map(d => parseISO(d))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diff = differenceInCalendarDays(sortedDates[i], sortedDates[i + 1]);
      if (diff === 1) {
        streak++;
      } else if (diff > 1) {
        break;
      }
    }
    
    setCurrentStreak(streak);
  }, [streakData]);

  // Check for recurring tasks that need to be reset every day
  useEffect(() => {
    const checkRecurringTasks = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check all recurring tasks that were completed yesterday
      setTasks(prevTasks => {
        let updated = false;
        
        const updatedTasks = prevTasks.map(task => {
          if (task.isRecurring && task.column === 'done' && task.lastCompletedAt) {
            const completionDate = task.lastCompletedAt.split('T')[0]; // Get just the date part
            
            // If the task was completed on a previous day, move it back to todo
            if (completionDate !== today) {
              updated = true;
              return {
                ...task,
                column: 'todo' as const, // Use a const assertion to ensure type safety
                // Reset subtasks completion if any
                subtasks: task.subtasks.map(subtask => ({
                  ...subtask,
                  completed: false
                }))
              };
            }
          }
          
          return task;
        });
        
        if (updated) {
          toast.info("Recurring tasks have been reset for today");
        }
        
        return updated ? updatedTasks : prevTasks;
      });
    };
    
    // Check recurring tasks on component mount
    checkRecurringTasks();
    
    // Also set up a check for when the date changes
    const intervalId = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        checkRecurringTasks();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);

  const addTask = async (taskData: Omit<Task, "id" | "aiSuggestions">) => {
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
        isRecurring: taskData.isRecurring || false,
        lastCompletedAt: null
      };
      
      setTasks((prev) => [...prev, newTask]);
      setModalOpen(false);
      setRecurringModalOpen(false);
      toast.success(`${taskData.isRecurring ? 'Recurring task' : 'Task'} created successfully`);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const moveTask = (taskId: string, targetColumn: 'todo' | 'inProgress' | 'done') => {
    const timestamp = new Date().toISOString();
    let task: Task | undefined;
    
    setTasks((prev) => {
      const updatedTasks = prev.map((t) => {
        if (t.id === taskId) {
          task = t;
          // If moving to done column, update lastCompletedAt for recurring tasks
          if (targetColumn === 'done') {
            return { ...t, column: targetColumn, lastCompletedAt: timestamp };
          }
          return { ...t, column: targetColumn };
        }
        return t;
      });
      
      return updatedTasks;
    });
    
    // Update streak data when a task is moved to done
    if (targetColumn === 'done') {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if all recurring tasks for today are completed
      const recurringTasks = tasks.filter(t => t.isRecurring);
      const completedRecurringTasks = recurringTasks.filter(t => 
        t.column === 'done' || (t.id === taskId && targetColumn === 'done')
      );
      
      const allRecurringTasksCompleted = 
        recurringTasks.length > 0 && 
        completedRecurringTasks.length === recurringTasks.length;
      
      // Update streak only when all recurring tasks are completed or when there are no recurring tasks
      if (allRecurringTasksCompleted || recurringTasks.length === 0) {
        setStreakData(prev => {
          // If this is the first task completed today, add the date
          if (!prev.completedDates.includes(today)) {
            return {
              lastCompletedDate: today,
              completedDates: [...prev.completedDates, today]
            };
          }
          return {
            ...prev,
            lastCompletedDate: today
          };
        });
      }
      
      // Show special toast for completing a recurring task
      if (task?.isRecurring) {
        toast.success('Recurring task completed for today!');
      }
    }
    
    // Show appropriate toast based on the column
    const columnMessages = {
      todo: 'Task moved to To Do',
      inProgress: 'Task moved to In Progress',
      done: 'Task marked as Done',
    };
    
    toast.info(columnMessages[targetColumn]);
  };

  const deleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.isRecurring) {
      toast.success('Recurring task deleted successfully');
    } else {
      toast.success('Task deleted successfully');
    }
    
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
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
      
      // Find the task to update
      const task = tasks.find((t) => t.id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Generate new AI suggestions
      const suggestions = await generateTaskSuggestions(task.title);
      
      // Update the task with new suggestions
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
  
  // Reset streak data (for testing purposes)
  const resetStreakData = () => {
    setStreakData({ completedDates: [], lastCompletedDate: null });
    toast.info('Streak data has been reset');
  };

  return {
    tasks,
    loading,
    modalOpen,
    setModalOpen,
    recurringModalOpen,
    setRecurringModalOpen,
    streakData: {
      completedDates: streakData.completedDates,
      currentStreak
    },
    addTask,
    moveTask,
    deleteTask,
    editTask,
    regenerateAiSuggestions,
    addSubtask,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
    resetStreakData
  };
};
