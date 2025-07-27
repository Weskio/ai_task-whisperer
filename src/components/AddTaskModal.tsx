
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Priority, Task, Column } from '@/types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, "id" | "aiSuggestions" | "order">) => Promise<void>;
  isLoading: boolean;
  columns: Column[];
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask, isLoading, columns }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedColumnId, setSelectedColumnId] = useState(columns[0]?.id || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && selectedColumnId) {
      await onAddTask({
        title: title.trim(),
        priority,
        columnId: selectedColumnId,
        spaceId: '', // This will be set by the parent component
        subtasks: [],
      });
      setTitle('');
      setPriority('medium');
      setSelectedColumnId(columns[0]?.id || '');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] glass-bg animate-fade-in">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task and get AI suggestions on how to complete it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Task Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="w-full"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">
              Priority
            </label>
            <Select 
              value={priority} 
              onValueChange={(value) => setPriority(value as Priority)}
              disabled={isLoading}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="column" className="text-sm font-medium">
              Column
            </label>
            <Select 
              value={selectedColumnId} 
              onValueChange={setSelectedColumnId}
              disabled={isLoading}
            >
              <SelectTrigger id="column">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose} 
              type="button"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;
