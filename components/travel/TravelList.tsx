"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TravelPoint, TRANSPORT_OPTIONS } from "./types";

interface TravelListProps {
  points: TravelPoint[];
  onDelete: (index: number) => void;
  onEdit: (index: number, point: TravelPoint) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TravelList = ({
  points, 
  onDelete,
  onEdit,
  onExport,
  onImport
}: TravelListProps) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<TravelPoint | null>(null);
  const [editPosition, setEditPosition] = useState<{ top: number, left: number } | null>(null);

  const startEdit = (index: number, event: React.MouseEvent) => {
    // Prevent the default behavior
    event.preventDefault();
    event.stopPropagation();
    
    // Get the button position for the popover
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    // Set the position for the popover
    setEditPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX
    });
    
    // Set the edit data
    setEditIndex(index);
    setEditData(points[index]);
  };

  const handleSave = () => {
    if (editIndex !== null && editData) {
      onEdit(editIndex, editData);
      setEditIndex(null);
      setEditData(null);
      setEditPosition(null);
    }
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditData(null);
    setEditPosition(null);
  };

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Travel Timeline</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-1"
          >
            <span>📤</span> Export
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <span>📥</span> Import
            </Button>
          </div>
        </div>
      </div>
      
      {/* Edit Popover */}
      {editData && editPosition && (
        <div 
          className="fixed z-50 bg-background border rounded-lg shadow-lg p-4 w-80 space-y-3"
          style={{
            top: `${editPosition.top}px`,
            left: `${editPosition.left - 320}px`, // Position to the left of the edit button
          }}
        >
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Edit Travel Point</h4>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
              ✕
            </Button>
          </div>
          
          <div className="space-y-3">
            <Input
              value={editData.city || ''}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              placeholder="City"
            />
            <Input
              type="date"
              value={editData.date || ''}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Transport</label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_OPTIONS.map(option => (
                  <Button
                    key={option.value}
                    variant={editData.transport.includes(option.value) ? "default" : "outline"}
                    className="flex items-center gap-1 h-8"
                    onClick={() => setEditData({
                      ...editData,
                      transport: editData.transport.includes(option.value)
                        ? editData.transport.filter(t => t !== option.value)
                        : [...(editData.transport || []), option.value]
                    })}
                  >
                    <span>{option.emoji}</span>
                    <span className="text-sm">{option.label}</span>
                  </Button>
                ))}
              </div>
              
              <Input
                value={editData.customTransport || ''}
                onChange={(e) => setEditData({ ...editData, customTransport: e.target.value })}
                placeholder="Custom transport (optional)"
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay to capture clicks outside the popover */}
      {editData && editPosition && (
        <div 
          className="fixed inset-0 z-40 bg-black/20" 
          onClick={handleCancel}
        />
      )}
      
      <div className="space-y-4 overflow-y-auto">
        {[...points].reverse().map((point, index) => {
          // Calculate the actual index in the original array
          const actualIndex = points.length - 1 - index;
          
          return (
          <div key={index} 
            className="flex items-start justify-between p-2 rounded-lg transition-colors hover:bg-accent"
          >
            <div className="flex space-x-4">
              <div className="flex-shrink-0 w-16 text-sm text-muted-foreground">
                {new Date(point.date).toLocaleDateString()}
              </div>
              <div>
                <div className="font-medium">{point.city}</div>
                {(point.transport.length > 0 || point.customTransport) && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    via {point.transport.map(t => {
                      const option = TRANSPORT_OPTIONS.find(opt => opt.value === t);
                      return option ? (
                        <span key={t} title={option.label}>{option.emoji}</span>
                      ) : null;
                    })}
                    {point.customTransport && (
                      <span className="ml-1">{point.customTransport}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => startEdit(actualIndex, e)}
                className="h-8 w-8"
              >
                ✏️
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(actualIndex)}
                className="h-8 w-8 text-destructive"
              >
                🗑️
              </Button>
            </div>
          </div>
        )})}
      </div>
    </Card>
  );
};
