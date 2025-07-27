import { useState, useEffect } from "react";
import { generateTaskSuggestions } from "@/services/aiService";
import { toast } from "sonner";
import { format, isToday, parseISO, differenceInCalendarDays } from "date-fns";
import { LegacyTask, Space, Task } from "@/types";

// Migration function to convert legacy tasks to new format
const migrateLegacyTasks = (
  legacyTasks: LegacyTask[],
  spaces: Space[]
): Task[] => {
  const defaultSpace = spaces[0];
  if (!defaultSpace) return [];

  const columnMap: Record<string, string> = {
    todo: defaultSpace.columns.find((c) => c.title === "To Do")?.id || "",
    inProgress:
      defaultSpace.columns.find((c) => c.title === "In Progress")?.id || "",
    done: defaultSpace.columns.find((c) => c.title === "Done")?.id || "",
  };

  return legacyTasks.map((task, index) => ({
    ...task,
    columnId: columnMap[task.column] || defaultSpace.columns[0]?.id || "",
    spaceId: defaultSpace.id,
    order: index,
    column: undefined, // Remove old column property
  })) as Task[];
};

// Load tasks from localStorage with migration support
const loadTasks = (spaces: Space[]): Task[] => {
  const saved = localStorage.getItem("tasks");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      // Check if we have legacy tasks (with 'column' property instead of 'columnId')
      if (
        parsed.length > 0 &&
        "column" in parsed[0] &&
        !("columnId" in parsed[0])
      ) {
        console.log("Migrating legacy tasks...");
        const migratedTasks = migrateLegacyTasks(parsed, spaces);
        localStorage.setItem("tasks", JSON.stringify(migratedTasks));
        toast.success("Tasks migrated to new format");
        return migratedTasks;
      }

      return parsed;
    } catch (e) {
      console.error("Failed to parse saved tasks:", e);
    }
  }
  return [];
};

// Load streak data from localStorage
const loadStreakData = (): {
  completedDates: string[];
  lastCompletedDate: string | null;
} => {
  const saved = localStorage.getItem("streak_data");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved streak data:", e);
    }
  }
  return { completedDates: [], lastCompletedDate: null };
};

export const useEnhancedTasks = (spaces: Space[], activeSpaceId: string) => {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(spaces));
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState<boolean>(false);
  const [streakData, setStreakData] = useState(loadStreakData());
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Save streak data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("streak_data", JSON.stringify(streakData));
  }, [streakData]);

  // Calculate current streak
  useEffect(() => {
    if (!streakData.lastCompletedDate) {
      setCurrentStreak(0);
      return;
    }

    const lastCompletedDate = parseISO(streakData.lastCompletedDate);
    const isActiveStreak =
      isToday(lastCompletedDate) ||
      differenceInCalendarDays(new Date(), lastCompletedDate) === 1;

    if (!isActiveStreak) {
      setCurrentStreak(0);
      return;
    }

    const sortedDates = [...streakData.completedDates]
      .map((d) => parseISO(d))
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

  const addTask = async (
    taskData: Omit<Task, "id" | "aiSuggestions" | "order">
  ) => {
    try {
      setLoading(true);

      const newTaskId = Date.now().toString();
      const spaceTasks = tasks.filter((t) => t.spaceId === taskData.spaceId);
      const suggestions = await generateTaskSuggestions(taskData.title);

      const newTask: Task = {
        id: newTaskId,
        title: taskData.title,
        priority: taskData.priority,
        aiSuggestions: suggestions || [],
        columnId: taskData.columnId,
        spaceId: taskData.spaceId,
        order: spaceTasks.length,
        subtasks: taskData.subtasks || [],
        isRecurring: taskData.isRecurring || false,
        lastCompletedAt: null,
      };

      setTasks((prev) => [...prev, newTask]);
      setModalOpen(false);
      setRecurringModalOpen(false);
      toast.success(
        `${
          taskData.isRecurring ? "Recurring task" : "Task"
        } created successfully`
      );
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const moveTask = (
    taskId: string,
    targetColumnId: string,
    newOrder?: number
  ) => {
    const timestamp = new Date().toISOString();

    setTasks((prev) => {
      const updatedTasks = prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            columnId: targetColumnId,
            order: newOrder !== undefined ? newOrder : t.order,
            lastCompletedAt: targetColumnId.includes("done")
              ? timestamp
              : t.lastCompletedAt,
          };
        }
        return t;
      });

      return updatedTasks;
    });

    toast.info("Task moved");
  };

  const reorderTasks = (
    columnId: string,
    fromIndex: number,
    toIndex: number
  ) => {
    setTasks((prev) => {
      const columnTasks = prev.filter((t) => t.columnId === columnId);
      const otherTasks = prev.filter((t) => t.columnId !== columnId);

      const [movedTask] = columnTasks.splice(fromIndex, 1);
      columnTasks.splice(toIndex, 0, movedTask);

      // Update order values
      const reorderedColumnTasks = columnTasks.map((task, index) => ({
        ...task,
        order: index,
      }));

      return [...otherTasks, ...reorderedColumnTasks].sort(
        (a, b) => a.order - b.order
      );
    });
  };

  const deleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    toast.success(`${task?.isRecurring ? "Recurring task" : "Task"} deleted`);
  };

  const editTask = (taskId: string, updates: Partial<Omit<Task, "id">>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  // Get tasks for active space
  const activeSpaceTasks = tasks.filter(
    (task) => task.spaceId === activeSpaceId
  );

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

    toast.success("Subtask added");
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
                subtask.id === subtaskId ? { ...subtask, title } : subtask
              ),
            }
          : task
      )
    );
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter(
                (subtask) => subtask.id !== subtaskId
              ),
            }
          : task
      )
    );
    toast.success("Subtask deleted");
  };

  const regenerateAiSuggestions = async (taskId: string) => {
    try {
      setLoading(true);

      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Task not found");

      const suggestions = await generateTaskSuggestions(task.title);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, aiSuggestions: suggestions || [] } : t
        )
      );

      toast.success("AI suggestions updated");
    } catch (error) {
      console.error("Error regenerating AI suggestions:", error);
      toast.error("Failed to update AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  return {
    tasks: activeSpaceTasks,
    allTasks: tasks,
    loading,
    modalOpen,
    setModalOpen,
    recurringModalOpen,
    setRecurringModalOpen,
    streakData: {
      completedDates: streakData.completedDates,
      currentStreak,
    },
    addTask,
    moveTask,
    reorderTasks,
    deleteTask,
    editTask,
    regenerateAiSuggestions,
    addSubtask,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
  };
};
