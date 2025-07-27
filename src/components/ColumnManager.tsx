import React, { useState } from 'react';
import { Plus, Settings, Trash, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Column } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const COLUMN_COLORS = [
  { name: 'Gray', value: 'hsl(var(--muted))' },
  { name: 'Blue', value: 'hsl(220, 70%, 95%)' },
  { name: 'Green', value: 'hsl(120, 70%, 95%)' },
  { name: 'Yellow', value: 'hsl(45, 70%, 95%)' },
  { name: 'Red', value: 'hsl(0, 70%, 95%)' },
  { name: 'Purple', value: 'hsl(270, 70%, 95%)' },
];

interface ColumnManagerProps {
  columns: Column[];
  onAddColumn: (title: string, color: string) => void;
  onUpdateColumn: (columnId: string, updates: Partial<Omit<Column, 'id' | 'spaceId'>>) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState(COLUMN_COLORS[0].value);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      onAddColumn(newColumnTitle.trim(), newColumnColor);
      setNewColumnTitle('');
      setNewColumnColor(COLUMN_COLORS[0].value);
    }
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    setEditTitle(column.title);
    setEditColor(column.color);
  };

  const handleSaveEdit = () => {
    if (editingColumn && editTitle.trim()) {
      onUpdateColumn(editingColumn.id, {
        title: editTitle.trim(),
        color: editColor
      });
      setEditingColumn(null);
      setEditTitle('');
      setEditColor('');
    }
  };

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Manage Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Column */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-medium">Add New Column</h4>
            <div className="space-y-2">
              <Input
                placeholder="Column title..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              />
              <div className="flex gap-2">
                {COLUMN_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 rounded border-2 ${
                      newColumnColor === color.value 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNewColumnColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
              <Button onClick={handleAddColumn} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Add Column
              </Button>
            </div>
          </div>

          {/* Existing Columns */}
          <div className="space-y-2">
            <h4 className="font-medium">Existing Columns</h4>
            {sortedColumns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-2 p-2 border rounded"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: column.color }}
                />
                <span className="flex-1 text-sm">{column.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditColumn(column)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="w-3 h-3" />
                </Button>
                {columns.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteColumn(column.id)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Edit Column Dialog */}
        {editingColumn && (
          <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Column</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Column title..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  {COLUMN_COLORS.map((color) => (
                    <button
                      key={color.name}
                      className={`w-8 h-8 rounded border-2 ${
                        editColor === color.value 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setEditColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingColumn(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ColumnManager;
