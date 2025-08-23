import React, { useState } from "react";
import { Calendar, Clock, Plus, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleEntry, Space } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WeeklyScheduleProps {
  space: Space;
  onUpdateSchedule: (entries: ScheduleEntry[]) => void;
}

const parseScheduleText = (text: string): ScheduleEntry[] => {
  const entries: ScheduleEntry[] = [];
  const lines = text.split("\n").filter((line) => line.trim());

  let currentDay = "";
  let entryId = 1;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if it's a day header (contains day of week)
    const dayMatch = trimmedLine.match(
      /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i
    );
    if (
      dayMatch &&
      (trimmedLine.includes("Evening") ||
        trimmedLine.includes("Morning") ||
        trimmedLine.includes("Night") ||
        trimmedLine.includes("Session"))
    ) {
      currentDay = trimmedLine;
      continue;
    }

    // Check if it's a time entry (starts with time like "2:00" or "10:00")
    const timeMatch = trimmedLine.match(
      /^(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*[-–]\s*(\d{1,2}:\d{2}(?:\s*[AP]M)?):?\s*(.+)$/i
    );
    if (timeMatch && currentDay) {
      const [, startTime, endTime, activity] = timeMatch;
      const timeRange = `${startTime} - ${endTime}`;

      // Determine priority based on keywords
      let priority = 1;
      if (
        activity.toLowerCase().includes("priority 1") ||
        activity.toLowerCase().includes("development")
      ) {
        priority = 3;
      } else if (
        activity.toLowerCase().includes("practice") ||
        activity.toLowerCase().includes("prep")
      ) {
        priority = 2;
      }

      entries.push({
        id: `entry-${entryId++}`,
        day: currentDay,
        timeRange,
        activity: activity.replace(/\(Priority \d+.*?\)/i, "").trim(),
        priority,
      });
    }

    // Check for single time entries like "8:00 PM: SLEEP 💤"
    const singleTimeMatch = trimmedLine.match(
      /^(\d{1,2}:\d{2}(?:\s*[AP]M)?):?\s*(.+)$/i
    );
    if (singleTimeMatch && currentDay && !timeMatch) {
      const [, time, activity] = singleTimeMatch;

      entries.push({
        id: `entry-${entryId++}`,
        day: currentDay,
        timeRange: time,
        activity: activity.trim(),
        priority: 1,
      });
    }
  }

  return entries;
};

const getPriorityColor = (priority?: number) => {
  switch (priority) {
    case 3:
      return "bg-destructive text-destructive-foreground";
    case 2:
      return "bg-orange-500 text-white";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  space,
  onUpdateSchedule,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleText, setScheduleText] = useState("");

  const scheduleEntries = space.scheduleEntries || [];

  const handleUpdateSchedule = () => {
    console.log("handleUpdateSchedule called with text:", scheduleText);
    const parsed = parseScheduleText(scheduleText);
    console.log("Parsed entries:", parsed);
    onUpdateSchedule(parsed);
    setIsEditing(false);
    setScheduleText("");
  };

  // Group entries by day
  const groupedEntries = scheduleEntries.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, ScheduleEntry[]>);

  const exampleText = `Monday Evening

6:00 - 7:00 PM: Exercise or light walk
7:00 - 8:00 PM: Dinner with family
8:00 - 9:00 PM: Leisure time (reading, TV, or hobbies)
9:30 PM: Sleep 💤

Tuesday Morning

6:30 - 7:30 AM: Morning routine (shower, breakfast, planning)
8:00 AM - 12:00 PM: Focused work or study
12:00 - 1:00 PM: Lunch break
1:00 - 5:00 PM: Continue work or projects
5:00 - 6:00 PM: Quick errands or rest`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Weekly Schedule</h2>
        </div>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              {scheduleEntries.length > 0 ? (
                <Edit3 className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {scheduleEntries.length > 0 ? "Update Schedule" : "Add Schedule"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Update Weekly Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Paste your schedule text in this format:
                </p>
                <div className="bg-muted p-3 rounded-md text-xs font-mono whitespace-pre-wrap">
                  {exampleText}
                </div>
              </div>
              <Textarea
                value={scheduleText}
                onChange={(e) => setScheduleText(e.target.value)}
                placeholder="Paste your schedule text here..."
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateSchedule}
                  disabled={!scheduleText.trim()}
                >
                  Update Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {scheduleEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedule Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your weekly schedule by clicking the button above and pasting
              your schedule text.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedEntries).map(([day, entries]) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-lg">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {entry.timeRange}
                            </span>
                            {entry.priority && entry.priority > 1 && (
                              <Badge
                                variant="secondary"
                                className={getPriorityColor(entry.priority)}
                              >
                                Priority {entry.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground break-words">
                            {entry.activity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;
