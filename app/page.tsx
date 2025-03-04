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

  // Initialize state with today's date if no lastDate
  const [city, setCity] = useState('');
  const [date, setDate] = useState(today);
  const [selectedTransport, setSelectedTransport] = useState<string[]>([]);
  const [customTransport, setCustomTransport] = useState('');
  const [daysToAdd, setDaysToAdd] = useState(1);

  const handleTransportToggle = (value: string) => {
    setSelectedTransport(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  // Quick add days to last date
  const handleQuickAdd = () => {
    if (lastDate) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      setDate(formatDate(nextDate));
    }
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
      setCity('');
      // Keep the date and transport selection for continuous input
      setCustomTransport('');
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Add Travel Point</h3>
      <div className="space-y-2">
        <Input
          placeholder="City name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1"
          />
          {lastDate && (
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="1"
                value={daysToAdd}
                onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 1)}
                className="w-12"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleQuickAdd}
                title={`Add ${daysToAdd} days to last date`}
              >
                +
              </Button>
            </div>
          )}
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
  onEdit 
}: { 
  points: TravelPoint[]; 
  onDelete: (index: number) => void;
  onEdit: (index: number, point: TravelPoint) => void;
}) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<TravelPoint | null>(null);

  const startEdit = (index: number) => {
    setEditIndex(index);
    setEditData(points[index]);
  };

  const handleSave = () => {
    if (editIndex !== null && editData) {
      onEdit(editIndex, editData);
      setEditIndex(null);
      setEditData(null);
    }
  };

  const handleCancel = () => {
    setEditIndex(null);
    setEditData(null);
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Travel Timeline</h3>
      <div className="space-y-4">
        {points.map((point, index) => (
          <div key={index} 
            className={`flex items-start justify-between p-2 rounded-lg transition-colors ${
              editIndex === index ? 'bg-accent' : 'hover:bg-accent'
            }`}
          >
            {editIndex === index ? (
              // Edit mode
              <div className="flex-1 space-y-2">
                <Input
                  value={editData?.city || ''}
                  onChange={(e) => setEditData({ ...editData!, city: e.target.value })}
                  placeholder="City"
                />
                <Input
                  type="date"
                  value={editData?.date || ''}
                  onChange={(e) => setEditData({ ...editData!, date: e.target.value })}
                  className="flex-1"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transport</label>
                  <div className="flex flex-wrap gap-2">
                    {TRANSPORT_OPTIONS.map(option => (
                      <Button
                        key={option.value}
                        variant={editData?.transport.includes(option.value) ? "default" : "outline"}
                        className="flex items-center gap-1 h-8"
                        onClick={() => setEditData({
                          ...editData!,
                          transport: editData?.transport.includes(option.value)
                            ? editData.transport.filter(t => t !== option.value)
                            : [...(editData?.transport || []), option.value]
                        })}
                      >
                        <span>{option.emoji}</span>
                        <span className="text-sm">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={editData?.customTransport || ''}
                    onChange={(e) => setEditData({ ...editData!, customTransport: e.target.value })}
                    placeholder="Custom transport (optional)"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // View mode
              <>
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
                    onClick={() => startEdit(index)}
                    className="h-8 w-8"
                  >
                    ✏️
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(index)}
                    className="h-8 w-8 text-destructive"
                  >
                    🗑️
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
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

  // Get the last date from points array
  const lastDate = points.length > 0 ? points[points.length - 1].date : undefined;

  return (
    <main className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <MapPlaceholder />
        </div>
        <div className="space-y-8">
          <TravelInput onAdd={addPoint} lastDate={lastDate} />
          <TravelList 
            points={points} 
            onDelete={deletePoint}
            onEdit={editPoint}
          />
        </div>
      </div>
    </main>
  );
}
