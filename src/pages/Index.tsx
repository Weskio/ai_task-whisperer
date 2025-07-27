import React, { useState, useEffect, useRef } from "react";
import { Plus, Key, Repeat, StickyNote as StickyNoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskColumn from "@/components/TaskColumn";
import AddTaskModal from "@/components/AddTaskModal";
import AddRecurringTaskModal from "@/components/AddRecurringTaskModal";
import APIKeyModal from "@/components/APIKeyModal";
import StreakTracker from "@/components/StreakTracker";
import SpaceTabs from "@/components/SpaceTabs";
import StickyNote from "@/components/StickyNote";
import ColumnManager from "@/components/ColumnManager";
import { Task, Column, StickyNote as StickyNoteType } from "@/types";
import { useSpaces } from "@/hooks/useSpaces";
import { useEnhancedTasks } from "@/hooks/useEnhancedTasks";
import { useStickyNotes } from "@/hooks/useStickyNotes";

const Index = () => {
  const {
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
  } = useSpaces();

  const {
    tasks,
    loading,
    modalOpen,
    setModalOpen,
    recurringModalOpen,
    setRecurringModalOpen,
    streakData,
    addTask,
    moveTask,
    reorderTasks,
    deleteTask,
    editTask,
    addSubtask,
    toggleSubtask,
    editSubtask,
    deleteSubtask,
    regenerateAiSuggestions,
  } = useEnhancedTasks(spaces, activeSpaceId);

  const updateStickyNotes = (notes: StickyNoteType[]) => {
    if (activeSpace) {
      updateSpace(activeSpace.id, { stickyNotes: notes });
    }
  };

  const {
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    startDrag,
    handleDrag,
    endDrag,
    draggedNote,
  } = useStickyNotes(activeSpace?.stickyNotes || [], updateStickyNotes);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if API key is stored
  useEffect(() => {
    const apiKey = localStorage.getItem("groq_api_key");
    setHasApiKey(!!apiKey);
  }, [apiKeyModalOpen]);

  // Handle mouse events for sticky note dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedNote) {
        handleDrag(e as any);
      }
    };

    const handleMouseUp = () => {
      if (draggedNote) {
        endDrag();
      }
    };

    if (draggedNote) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggedNote, handleDrag, endDrag]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string, index?: number) => {
    e.preventDefault();
    if (draggedTask) {
      if (draggedTask.columnId === columnId && index !== undefined) {
        // Same column reordering
        const currentIndex = tasks
          .filter((t) => t.columnId === columnId)
          .findIndex((t) => t.id === draggedTask.id);
        if (currentIndex !== index) {
          reorderTasks(columnId, currentIndex, index);
        }
      } else {
        // Move to different column
        moveTask(draggedTask.id, columnId, index);
      }
      setDraggedTask(null);
    }
  };

  if (!activeSpace) {
    return <div>Loading...</div>;
  }

  // Sort columns by order
  const sortedColumns = [...activeSpace.columns].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div
      className="min-h-screen bg-background text-foreground p-6"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">AI Task Whisperer</h1>
              <p className="text-muted-foreground mt-1">
                AI-powered task management with customizable workspaces
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setApiKeyModalOpen(true)}
                title={
                  hasApiKey ? "Groq API Key Configured" : "Set Groq API Key"
                }
              >
                <Key
                  className={`h-4 w-4 ${hasApiKey ? "text-green-500" : ""}`}
                />
              </Button>
              <Button
                variant="outline"
                onClick={() => addStickyNote(activeSpaceId)}
                title="Add Sticky Note"
                className="gap-2"
              >
                <StickyNoteIcon className="h-4 w-4" />
                Add Note
              </Button>
              <Button
                variant="outline"
                onClick={() => setRecurringModalOpen(true)}
                title="Add Recurring Task"
                className="gap-2"
              >
                <Repeat className="h-4 w-4" />
                Add Recurring
              </Button>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            </div>
          </div>
        </header>

        {/* Space Management */}
        <SpaceTabs
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          onSpaceChange={setActiveSpaceId}
          onAddSpace={addSpace}
          onUpdateSpace={updateSpace}
          onDeleteSpace={deleteSpace}
        />

        {/* Streak Tracker */}
        <div className="mb-8">
          <StreakTracker
            completedDates={streakData.completedDates}
            currentStreak={streakData.currentStreak}
          />
        </div>

        {/* Column Management */}
        <div className="mb-6 flex justify-end">
          <ColumnManager
            columns={activeSpace.columns}
            onAddColumn={(title, color) =>
              addColumn(activeSpaceId, title, color)
            }
            onUpdateColumn={updateColumn}
            onDeleteColumn={deleteColumn}
            onReorderColumns={(from, to) =>
              reorderColumns(activeSpaceId, from, to)
            }
          />
        </div>

        {/* Task Columns */}
        <div
          className="grid gap-4 mb-8"
          style={{
            gridTemplateColumns: `repeat(${sortedColumns.length}, 1fr)`,
          }}
        >
          {sortedColumns.map((column) => {
            const columnTasks = tasks
              .filter((task) => task.columnId === column.id)
              .sort((a, b) => a.order - b.order);

            return (
              <TaskColumn
                key={column.id}
                title={column.title}
                tasks={columnTasks}
                columnId={column.id}
                color={column.color}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onEditTask={editTask}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={addSubtask}
                onEditSubtask={editSubtask}
                onDeleteSubtask={deleteSubtask}
                onDeleteTask={deleteTask}
                onMoveTask={moveTask}
                onRegenerateAiSuggestions={regenerateAiSuggestions}
              />
            );
          })}
        </div>

        {/* Sticky Notes - rendered at document level for free movement */}
        {activeSpace.stickyNotes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            onUpdate={updateStickyNote}
            onDelete={deleteStickyNote}
            onStartDrag={startDrag}
            isDragging={draggedNote?.id === note.id}
          />
        ))}

        <AddTaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onAddTask={(taskData) =>
            addTask({
              ...taskData,
              spaceId: activeSpaceId,
            })
          }
          isLoading={loading}
          columns={sortedColumns}
        />

        <AddRecurringTaskModal
          isOpen={recurringModalOpen}
          onClose={() => setRecurringModalOpen(false)}
          onAddTask={(taskData) =>
            addTask({
              ...taskData,
              spaceId: activeSpaceId,
            })
          }
          isLoading={loading}
          columns={sortedColumns}
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
