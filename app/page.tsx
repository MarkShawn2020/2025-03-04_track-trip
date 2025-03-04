"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Types for our travel data
type TransportOption = {
  emoji: string;
  label: string;
  value: string;
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  { emoji: '✈️', label: 'Flight', value: 'flight' },
  { emoji: '🚂', label: 'Train', value: 'train' },
  { emoji: '🚌', label: 'Bus', value: 'bus' },
  { emoji: '🚗', label: 'Car', value: 'car' },
  { emoji: '🛵', label: 'Taxi', value: 'taxi' },
  { emoji: '🚲', label: 'Bike', value: 'bike' },
  { emoji: '🚶', label: 'Walk', value: 'walk' },
];

type TravelPoint = {
  city: string;
  date: string;
  transport: string[];
  customTransport?: string;
  notes?: string;
};

const TravelInput = ({ onAdd, lastDate }: { onAdd: (point: TravelPoint) => void; lastDate?: string }) => {
  // Format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get today's date in YYYY-MM-DD format
  const today = formatDate(new Date());

  // Initialize state
  const [city, setCity] = useState('');
  const [selectedTransport, setSelectedTransport] = useState<string[]>([]);
  const [customTransport, setCustomTransport] = useState('');

  // Calculate initial date based on lastDate
  const initialDate = lastDate ? (() => {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return formatDate(nextDate);
  })() : today;

  const [date, setDate] = useState(initialDate);

  // Calculate days difference when date changes
  const calculateDaysDiff = () => {
    if (!lastDate) return 1;
    const diff = Math.round((new Date(date).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const [daysToAdd, setDaysToAdd] = useState(calculateDaysDiff());

  // Update date when daysToAdd changes
  const handleDaysChange = (newDays: number) => {
    if (lastDate && newDays >= 0) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + newDays);
      setDate(formatDate(nextDate));
      setDaysToAdd(newDays);
    }
  };

  // Increment or decrement days
  const adjustDays = (amount: number) => {
    const newDays = Math.max(0, daysToAdd + amount);
    handleDaysChange(newDays);
  };

  // Update daysToAdd when date changes
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (lastDate) {
      const diff = Math.round((new Date(newDate).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
      setDaysToAdd(Math.max(0, diff));
    }
  };

  const handleTransportToggle = (value: string) => {
    setSelectedTransport(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = () => {
    if (city && date) {
      const allTransport = [
        ...selectedTransport,
        ...(customTransport ? [customTransport] : [])
      ];
      onAdd({
        city,
        date,
        transport: allTransport,
        customTransport: customTransport || undefined
      });

      // Clear city and custom transport
      setCity('');
      setCustomTransport('');

      // Keep the same date for next entry
      const nextDate = new Date(date);
      setDate(formatDate(nextDate));
      setDaysToAdd(0);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Add Travel Point</h3>
      <div className="space-y-2">
<div className="flex flex-col sm:flex-row gap-2">
<Input
          placeholder="City name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="flex-1"
          />
          {lastDate && (
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => adjustDays(-1)}
                disabled={daysToAdd <= 0}
              >
                -
              </Button>
              <div className="flex items-center gap-1 px-2 py-1 border rounded-md min-w-[4rem] justify-center">
                <span className="text-sm">{daysToAdd}</span>
                <span className="text-xs text-muted-foreground">days</span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => adjustDays(1)}
              >
                +
              </Button>
            </div>
          )}
        </div>
  </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Transport</label>
          <div className="flex flex-wrap gap-2">
            {TRANSPORT_OPTIONS.map(option => (
              <Button
                key={option.value}
                variant={selectedTransport.includes(option.value) ? "default" : "outline"}
                className="flex items-center gap-1 h-8"
                onClick={() => handleTransportToggle(option.value)}
              >
                <span>{option.emoji}</span>
                <span className="text-sm">{option.label}</span>
              </Button>
            ))}
          </div>
          <Input
            placeholder="Custom transport (optional)"
            value={customTransport}
            onChange={(e) => setCustomTransport(e.target.value)}
          />
        </div>
        <Button className="w-full" onClick={handleSubmit}>
          Add Point
        </Button>
      </div>
    </Card>
  );
};

const TravelList = ({
  points, 
  onDelete,
  onEdit,
  onExport,
  onImport
}: { 
  points: TravelPoint[]; 
  onDelete: (index: number) => void;
  onEdit: (index: number, point: TravelPoint) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
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

const MapPlaceholder = () => (
  <Card className="aspect-video w-full flex items-center justify-center bg-muted">
    <p className="text-muted-foreground">Map visualization coming soon...</p>
  </Card>
);

export default function Home() {
  const [points, setPoints] = useState<TravelPoint[]>([]);

  const addPoint = (point: TravelPoint) => {
    setPoints([...points, point]);
  };

  const deletePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

  const editPoint = (index: number, updatedPoint: TravelPoint) => {
    setPoints(points.map((point, i) => i === index ? updatedPoint : point));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(points, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-trajectory-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedPoints = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedPoints) && importedPoints.every(point => 
          typeof point === 'object' && 
          'city' in point && 
          'date' in point && 
          'transport' in point
        )) {
          setPoints(importedPoints);
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Error reading file');
      }
    };
    reader.readAsText(file);
  };

  // Get the last date from points array
  const lastDate = points.length > 0 ? points[points.length - 1].date : undefined;

  return (
    <main className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-12rem)]">
        {/* Left section: Map and Input */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          <div className="sticky top-8">
            <MapPlaceholder />
            <div className="mt-8">
              <TravelInput onAdd={addPoint} lastDate={lastDate} />
            </div>
          </div>
        </div>

        {/* Right section: Timeline */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full">
          <div className="h-full overflow-hidden">
            <TravelList 
              points={points} 
              onDelete={deletePoint}
              onEdit={editPoint}
              onExport={handleExport}
              onImport={handleImport}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
