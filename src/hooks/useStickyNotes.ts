
import { StickyNote } from '@/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const STICKY_COLORS = [
  '#fef3c7', // yellow
  '#fce7f3', // pink
  '#ecfdf5', // green
  '#eff6ff', // blue
  '#fdf4ff', // purple
  '#fff7ed', // orange
];

export const useStickyNotes = (
  stickyNotes: StickyNote[],
  onUpdateNotes: (notes: StickyNote[]) => void
) => {
  const [draggedNote, setDraggedNote] = useState<StickyNote | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const addStickyNote = useCallback((spaceId: string, content: string = '') => {
    const newNote: StickyNote = {
      id: `note-${Date.now()}`,
      content,
      position: { 
        x: Math.random() * (window.innerWidth - 350) + 100, 
        y: Math.random() * (window.innerHeight - 250) + 100 
      },
      size: { width: 280, height: 200 },
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      spaceId,
      createdAt: new Date().toISOString()
    };
    
    onUpdateNotes([...stickyNotes, newNote]);
    toast.success('Sticky note added');
  }, [stickyNotes, onUpdateNotes]);

  const updateStickyNote = useCallback((noteId: string, updates: Partial<Omit<StickyNote, 'id' | 'spaceId'>>) => {
    onUpdateNotes(stickyNotes.map(note => 
      note.id === noteId ? { ...note, ...updates } : note
    ));
  }, [stickyNotes, onUpdateNotes]);

  const deleteStickyNote = useCallback((noteId: string) => {
    onUpdateNotes(stickyNotes.filter(note => note.id !== noteId));
    toast.success('Sticky note deleted');
  }, [stickyNotes, onUpdateNotes]);

  const startDrag = useCallback((note: StickyNote, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDraggedNote(note);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!draggedNote) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    updateStickyNote(draggedNote.id, { position: newPosition });
  }, [draggedNote, dragOffset, updateStickyNote]);

  const endDrag = useCallback(() => {
    setDraggedNote(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  return {
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    startDrag,
    handleDrag,
    endDrag,
    draggedNote
  };
};
