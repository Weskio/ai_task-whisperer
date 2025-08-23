
import { useState, useEffect } from 'react';
import { Space, Column, SpaceType } from '@/types';
import { toast } from 'sonner';

const DEFAULT_COLUMNS: Omit<Column, 'id' | 'spaceId'>[] = [
  { title: 'To Do', color: 'hsl(var(--muted))', order: 0 },
  { title: 'In Progress', color: 'hsl(var(--primary))', order: 1 },
  { title: 'Done', color: 'hsl(var(--accent))', order: 2 }
];

const loadSpaces = (): Space[] => {
  const saved = localStorage.getItem('spaces');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate legacy spaces that don't have type field
      return parsed.map((space: any) => ({
        ...space,
        type: space.type || 'tasks', // Default to 'tasks' for existing spaces
        scheduleEntries: space.scheduleEntries || undefined
      }));
    } catch (e) {
      console.error('Failed to parse saved spaces:', e);
    }
  }
  return [];
};

const createDefaultSpace = (): Space => {
  const spaceId = `space-${Date.now()}`;
  return {
    id: spaceId,
    name: 'Personal',
    type: 'tasks',
    createdAt: new Date().toISOString(),
    stickyNotes: [],
    columns: DEFAULT_COLUMNS.map((col, index) => ({
      ...col,
      id: `col-${spaceId}-${index}`,
      spaceId
    }))
  };
};

export const useSpaces = () => {
  const [spaces, setSpaces] = useState<Space[]>(() => {
    const loaded = loadSpaces();
    if (loaded.length === 0) {
      return [createDefaultSpace()];
    }
    return loaded;
  });
  
  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => {
    const saved = localStorage.getItem('activeSpaceId');
    if (saved && spaces.find(s => s.id === saved)) {
      return saved;
    }
    return spaces[0]?.id || '';
  });

  // Save spaces to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('spaces', JSON.stringify(spaces));
  }, [spaces]);

  // Save active space ID
  useEffect(() => {
    localStorage.setItem('activeSpaceId', activeSpaceId);
  }, [activeSpaceId]);

  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  const addSpace = (name: string, type: SpaceType = 'tasks') => {
    const spaceId = `space-${Date.now()}`;
    const newSpace: Space = {
      id: spaceId,
      name,
      type,
      createdAt: new Date().toISOString(),
      stickyNotes: [],
      scheduleEntries: type === 'schedule' ? [] : undefined,
      columns: type === 'tasks' ? DEFAULT_COLUMNS.map((col, index) => ({
        ...col,
        id: `col-${spaceId}-${index}`,
        spaceId
      })) : []
    };
    
    setSpaces(prev => [...prev, newSpace]);
    setActiveSpaceId(spaceId);
    toast.success(`${type === 'schedule' ? 'Schedule' : 'Task'} space "${name}" created`);
  };

  const updateSpace = (spaceId: string, updates: Partial<Omit<Space, 'id'>>) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId ? { ...space, ...updates } : space
    ));
  };

  const deleteSpace = (spaceId: string) => {
    if (spaces.length <= 1) {
      toast.error('Cannot delete the last space');
      return;
    }
    
    setSpaces(prev => prev.filter(space => space.id !== spaceId));
    
    if (activeSpaceId === spaceId) {
      const remainingSpaces = spaces.filter(space => space.id !== spaceId);
      setActiveSpaceId(remainingSpaces[0]?.id || '');
    }
    
    toast.success('Space deleted');
  };

  const addColumn = (spaceId: string, title: string, color: string) => {
    const columnId = `col-${Date.now()}`;
    setSpaces(prev => prev.map(space => {
      if (space.id === spaceId) {
        const newColumn: Column = {
          id: columnId,
          title,
          color,
          order: space.columns.length,
          spaceId
        };
        return {
          ...space,
          columns: [...space.columns, newColumn]
        };
      }
      return space;
    }));
    toast.success(`Column "${title}" added`);
  };

  const updateColumn = (columnId: string, updates: Partial<Omit<Column, 'id' | 'spaceId'>>) => {
    setSpaces(prev => prev.map(space => ({
      ...space,
      columns: space.columns.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    })));
  };

  const deleteColumn = (columnId: string) => {
    setSpaces(prev => prev.map(space => ({
      ...space,
      columns: space.columns.filter(col => col.id !== columnId)
    })));
    toast.success('Column deleted');
  };

  const reorderColumns = (spaceId: string, fromIndex: number, toIndex: number) => {
    setSpaces(prev => prev.map(space => {
      if (space.id === spaceId) {
        const newColumns = [...space.columns];
        const [movedColumn] = newColumns.splice(fromIndex, 1);
        newColumns.splice(toIndex, 0, movedColumn);
        
        // Update order values
        return {
          ...space,
          columns: newColumns.map((col, index) => ({ ...col, order: index }))
        };
      }
      return space;
    }));
  };

  const updateSchedule = (spaceId: string, entries: any[]) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId ? { ...space, scheduleEntries: entries } : space
    ));
  };

  return {
    spaces,
    activeSpace,
    activeSpaceId,
    setActiveSpaceId,
    addSpace,
    updateSpace,
    deleteSpace,
    addColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    updateSchedule
  };
};
