"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TravelPoint, TRANSPORT_OPTIONS } from "./types";
import { 
  Map, 
  ListFilter, 
  FileText, 
  Upload, 
  Download, 
  Pencil, 
  Trash2 
} from "lucide-react";
import React from "react";

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
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');
  
  // Group points by year
  const groupedPoints = React.useMemo(() => {
    const sorted = [...points].reverse();
    const groups: Record<string, TravelPoint[]> = {};
    
    sorted.forEach((point, index) => {
      const year = new Date(point.date).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push({
        ...point,
        // Store the original index for edit/delete operations
        _originalIndex: points.length - 1 - index
      } as TravelPoint & { _originalIndex: number });
    });
    
    // Sort years in descending order (most recent first)
    return Object.entries(groups)
      .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA));
  }, [points]);

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
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Travel Timeline</h3>
        </div>
        <div className="flex gap-1">
          {/* View Mode Toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'compact' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('compact')}
              className="rounded-none h-8 w-8"
              title="Compact View"
            >
              <ListFilter className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'detailed' ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode('detailed')}
              className="rounded-none h-8 w-8"
              title="Detailed View"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Export Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            className="h-8 w-8"
            title="Export Timeline"
          >
            <Upload className="h-4 w-4" />
          </Button>
          
          {/* Import Button - Using a styled button with proper hover effect */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Import Timeline"
              type="button"
              onClick={() => {
                return document.getElementById('file-import')!.click();
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <input
              id="file-import"
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
              title="Import Timeline"
            />
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
      
      <div className="overflow-y-auto">
        {groupedPoints.map(([year, yearPoints]) => (
          <div key={year} className="mb-4">
            {/* Year Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1 px-2 border-b border-border mb-1">
              <h4 className="text-sm font-semibold">{year}</h4>
            </div>
            
            {/* Points for this year */}
            <div className={viewMode === 'compact' ? 'space-y-1' : 'space-y-4'}>
              {yearPoints.map((point, index) => {
                const actualIndex = (point as any)._originalIndex;
                
                // Format date as MM-DD
                const date = new Date(point.date);
                const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                
                // Compact view
                if (viewMode === 'compact') {
                  return (
                    <div key={index} 
                      className="flex items-center justify-between py-1 px-2 rounded-lg transition-colors hover:bg-accent border-b border-border/50 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="flex-shrink-0 w-14 text-xs text-muted-foreground text-right font-mono">
                          {formattedDate}
                        </div>
                        <div className="font-medium truncate">{point.city}</div>
                        {(point.transport.length > 0) && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 flex-shrink-0">
                            {point.transport.map(t => {
                              const option = TRANSPORT_OPTIONS.find(opt => opt.value === t);
                              return option ? (
                                <span key={t} title={option.label}>{option.emoji}</span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={(e) => startEdit(actualIndex, e)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive" 
                          onClick={() => onDelete(actualIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                }
                
                // Detailed view
                return (
                  <div key={index} 
                    className="flex items-start justify-between p-2 rounded-lg transition-colors hover:bg-accent"
                  >
                    <div className="flex space-x-4">
                      <div className="flex-shrink-0 w-14 text-sm text-muted-foreground text-right font-mono">
                        {formattedDate}
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
                        {point.notes && (
                          <div className="text-sm mt-1">{point.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={(e) => startEdit(actualIndex, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive" 
                        onClick={() => onDelete(actualIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
