import React, { useState, useRef, useEffect } from "react";
import { X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyNote as StickyNoteType } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STICKY_COLORS = [
  "#fef3c7", // yellow
  "#fce7f3", // pink
  "#ecfdf5", // green
  "#eff6ff", // blue
  "#fdf4ff", // purple
  "#fff7ed", // orange
];

interface StickyNoteProps {
  note: StickyNoteType;
  onUpdate: (
    noteId: string,
    updates: Partial<Omit<StickyNoteType, "id" | "spaceId">>
  ) => void;
  onDelete: (noteId: string) => void;
  onStartDrag: (note: StickyNoteType, e: React.MouseEvent) => void;
  isDragging: boolean;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  onUpdate,
  onDelete,
  onStartDrag,
  isDragging,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [isEditing, content]);

  const handleSave = () => {
    onUpdate(note.id, { content });
    setIsEditing(false);
  };

  const handleColorChange = (color: string) => {
    onUpdate(note.id, { color });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) {
      onStartDrag(note, e);
    }
  };

  return (
    <div
      className={`fixed select-none ${
        isDragging
          ? "z-[9999] scale-110 rotate-2"
          : "z-50 hover:scale-105 hover:rotate-1"
      }`}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.size.width,
        height: note.size.height,
        cursor: isDragging ? "grabbing" : isEditing ? "text" : "grab",
        transition: isDragging ? "none" : "all 0.2s ease-out",
        willChange: isDragging ? "transform" : "auto",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Main note body with torn edges */}
      <div
        className="relative w-full h-full p-4 text-gray-800 shadow-lg"
        style={{
          backgroundColor: note.color,
          clipPath:
            "polygon(0% 3%, 3% 0%, 97% 0%, 100% 4%, 99% 97%, 96% 100%, 4% 100%, 0% 96%)",
          boxShadow: isDragging
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0,0,0,0.05)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 3px, transparent 3px),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 2px, transparent 2px),
              radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "25px 25px, 30px 30px, 15px 15px",
          }}
        />

        {/* Torn paper edges */}
        <div
          className="absolute -top-1 left-2 w-4 h-3 bg-white/60"
          style={{
            clipPath: "polygon(20% 0%, 80% 30%, 100% 80%, 0% 100%)",
            transform: "rotate(-5deg)",
          }}
        />
        <div
          className="absolute -top-1 right-4 w-3 h-2 bg-white/50"
          style={{
            clipPath: "polygon(0% 0%, 100% 20%, 80% 100%, 20% 80%)",
            transform: "rotate(8deg)",
          }}
        />
        <div
          className="absolute -bottom-1 -right-1 w-3 h-4 bg-white/60"
          style={{
            clipPath: "polygon(0% 0%, 80% 0%, 100% 60%, 20% 100%)",
            transform: "rotate(3deg)",
          }}
        />
        <div
          className="absolute -bottom-1 left-6 w-2 h-3 bg-white/40"
          style={{
            clipPath: "polygon(0% 20%, 100% 0%, 80% 100%, 20% 80%)",
            transform: "rotate(-7deg)",
          }}
        />

        {/* Header */}
        <div className="flex justify-between items-center mb-3 relative z-10">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-gray-600 hover:text-gray-800"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Palette className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 bg-white border shadow-lg z-[10000]">
              <div className="grid grid-cols-3 gap-2">
                {STICKY_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(note.id)}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-red-500 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setContent(note.content);
                setIsEditing(false);
              }
            }}
            className="w-full h-[calc(100%-3rem)] resize-none border-none bg-transparent text-gray-800 text-sm leading-relaxed focus:outline-none placeholder-gray-500 font-virgil"
            placeholder="Write your note..."
          />
        ) : (
          <div
            className="w-full h-[calc(100%-3rem)] text-gray-800 text-sm leading-relaxed whitespace-pre-wrap cursor-text overflow-hidden font-virgil"
            onClick={() => setIsEditing(true)}
          >
            {content || "Click to add note..."}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyNote;
