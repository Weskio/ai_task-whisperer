
import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StreakTrackerProps {
  completedDates: string[];
  currentStreak: number;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ completedDates, currentStreak }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (currentStreak > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Daily Streak</h3>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 transition-all",
          showAnimation && "animate-[pulse_0.5s_ease-in-out_3]"
        )}>
          {currentStreak > 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-2 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white border-none",
                showAnimation && "animate-[scale-in_0.5s_ease-in-out]"
              )}
            >
              <Flame 
                className={cn(
                  "h-5 w-5 mr-1.5",
                  showAnimation && "animate-[bounce_0.5s_ease-in-out_3]"
                )}
                fill={showAnimation ? "#FFA500" : "none"}
              />
              {currentStreak} day{currentStreak !== 1 && 's'}
            </Badge>
          )}
          
          {currentStreak === 0 && (
            <Badge variant="outline" className="px-3 py-2 text-md font-medium bg-secondary text-secondary-foreground">
              Start your streak today!
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;
