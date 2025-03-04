"use client";

import { TravelPoint } from "./types";
import { Card } from "@/components/ui/card";
import { formatDate, getTransportIcon } from "@/utils/mapUtils";
import { useEffect, useState } from "react";

interface TravelTimelineProps {
  points: TravelPoint[];
  onSelectPoint?: (index: number) => void;
  selectedPoint?: number | null;
}

export const TravelTimeline = ({ 
  points, 
  onSelectPoint,
  selectedPoint 
}: TravelTimelineProps) => {
  const [sortedPoints, setSortedPoints] = useState<TravelPoint[]>([]);
  
  // Sort points by date
  useEffect(() => {
    const sorted = [...points].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setSortedPoints(sorted);
  }, [points]);
  
  if (points.length === 0) {
    return (
      <Card className="p-4 h-full flex items-center justify-center">
        <p className="text-muted-foreground">Add travel points to see your journey timeline</p>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 h-full overflow-auto">
      <h3 className="text-lg font-semibold mb-4">Journey Timeline</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/20" />
        
        {/* Timeline points */}
        <div className="space-y-4">
          {sortedPoints.map((point, index) => {
            const isSelected = selectedPoint === points.indexOf(point);
            const isFirst = index === 0;
            const isLast = index === sortedPoints.length - 1;
            
            return (
              <div 
                key={`${point.city}-${point.date}`}
                className={`relative pl-10 ${isSelected ? 'bg-primary/5 -mx-4 px-4 py-2 rounded-md' : ''}`}
                onClick={() => onSelectPoint?.(points.indexOf(point))}
              >
                {/* Timeline dot */}
                <div 
                  className={`absolute left-4 top-1.5 w-2 h-2 rounded-full transform -translate-x-1/2 
                    ${isSelected ? 'bg-primary scale-150' : 'bg-primary/60'}`}
                />
                
                {/* Content */}
                <div className="cursor-pointer">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{point.city}</h4>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(point.date)}
                    </span>
                  </div>
                  
                  {/* Transport icons */}
                  {!isFirst && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {point.transport.map((t, i) => (
                        <span key={i} className="text-sm">{getTransportIcon(t)}</span>
                      ))}
                      {point.customTransport && (
                        <span className="text-sm">{point.customTransport}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Notes */}
                  {point.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {point.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
