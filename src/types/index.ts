
export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Space {
  id: string;
  name: string;
  columns: Column[];
  stickyNotes: StickyNote[];
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  order: number;
  spaceId: string;
}

export interface StickyNote {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  spaceId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  aiSuggestions: string[];
  columnId: string;
  spaceId: string;
  order: number;
  subtasks: SubTask[];
  isRecurring?: boolean;
  lastCompletedAt?: string | null;
}

// Legacy support for migration
export interface LegacyTask {
  id: string;
  title: string;
  priority: Priority;
  aiSuggestions: string[];
  column: 'todo' | 'inProgress' | 'done';
  subtasks: SubTask[];
  isRecurring?: boolean;
  lastCompletedAt?: string | null;
}
