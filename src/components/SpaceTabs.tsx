import React, { useState } from "react";
import { Plus, Settings, X, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Space, SpaceType } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface SpaceTabsProps {
  spaces: Space[];
  activeSpaceId: string;
  onSpaceChange: (spaceId: string) => void;
  onAddSpace: (name: string, type: SpaceType) => void;
  onUpdateSpace: (spaceId: string, updates: Partial<Omit<Space, "id">>) => void;
  onDeleteSpace: (spaceId: string) => void;
}

const SpaceTabs: React.FC<SpaceTabsProps> = ({
  spaces,
  activeSpaceId,
  onSpaceChange,
  onAddSpace,
  onUpdateSpace,
  onDeleteSpace,
}) => {
  const [isAddingSpace, setIsAddingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceType, setNewSpaceType] = useState<SpaceType>("tasks");
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAddSpace = () => {
    if (newSpaceName.trim()) {
      onAddSpace(newSpaceName.trim(), newSpaceType);
      setNewSpaceName("");
      setNewSpaceType("tasks");
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
      setEditingName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsAddingSpace(false);
      setEditingSpaceId(null);
      setEditingName("");
      setNewSpaceName("");
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
                  <div className="flex items-center gap-2">
                    {space.type === "schedule" ? (
                      <Calendar className="w-3 h-3" />
                    ) : (
                      <CheckSquare className="w-3 h-3" />
                    )}
                    {space.name}
                  </div>
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
        <Dialog open={isAddingSpace} onOpenChange={setIsAddingSpace}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Space</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Space Name
                </label>
                <Input
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Enter space name..."
                  onKeyDown={(e) => handleKeyDown(e, handleAddSpace)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Space Type
                </label>
                <Select
                  value={newSpaceType}
                  onValueChange={(value: SpaceType) => setNewSpaceType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tasks">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        <span>Task Management</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="schedule">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Weekly Schedule</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingSpace(false);
                    setNewSpaceName("");
                    setNewSpaceType("tasks");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSpace}
                  disabled={!newSpaceName.trim()}
                >
                  Create Space
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
