
import React, { useState } from 'react';
import { Plus, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Space } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface SpaceTabsProps {
  spaces: Space[];
  activeSpaceId: string;
  onSpaceChange: (spaceId: string) => void;
  onAddSpace: (name: string) => void;
  onUpdateSpace: (spaceId: string, updates: Partial<Omit<Space, 'id'>>) => void;
  onDeleteSpace: (spaceId: string) => void;
}

const SpaceTabs: React.FC<SpaceTabsProps> = ({
  spaces,
  activeSpaceId,
  onSpaceChange,
  onAddSpace,
  onUpdateSpace,
  onDeleteSpace
}) => {
  const [isAddingSpace, setIsAddingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddSpace = () => {
    if (newSpaceName.trim()) {
      onAddSpace(newSpaceName.trim());
      setNewSpaceName('');
      setIsAddingSpace(false);
    }
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpaceId(space.id);
    setEditingName(space.name);
  };

  const handleSaveEdit = () => {
    if (editingSpaceId && editingName.trim()) {
      onUpdateSpace(editingSpaceId, { name: editingName.trim() });
      setEditingSpaceId(null);
      setEditingName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsAddingSpace(false);
      setEditingSpaceId(null);
      setEditingName('');
      setNewSpaceName('');
    }
  };

  return (
    <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
      <div className="flex items-center gap-1 overflow-x-auto">
        {spaces.map((space) => (
          <ContextMenu key={space.id}>
            <ContextMenuTrigger>
              <Button
                variant={activeSpaceId === space.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onSpaceChange(space.id)}
                className="whitespace-nowrap"
              >
                {editingSpaceId === space.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                    onBlur={handleSaveEdit}
                    className="h-6 w-20 text-sm"
                    autoFocus
                  />
                ) : (
                  space.name
                )}
              </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleEditSpace(space)}>
                <Settings className="w-4 h-4 mr-2" />
                Rename Space
              </ContextMenuItem>
              {spaces.length > 1 && (
                <ContextMenuItem 
                  onClick={() => onDeleteSpace(space.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Space
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      {isAddingSpace ? (
        <div className="flex items-center gap-2">
          <Input
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            placeholder="Space name..."
            className="h-8 w-32"
            onKeyDown={(e) => handleKeyDown(e, handleAddSpace)}
            autoFocus
          />
          <Button size="sm" onClick={handleAddSpace}>
            Add
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              setIsAddingSpace(false);
              setNewSpaceName('');
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingSpace(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Space
        </Button>
      )}
    </div>
  );
};

export default SpaceTabs;
