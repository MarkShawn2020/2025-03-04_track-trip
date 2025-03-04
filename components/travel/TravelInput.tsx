"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TravelPoint, TRANSPORT_OPTIONS } from "./types";

interface TravelInputProps {
  onAdd: (point: TravelPoint) => void;
  lastDate?: string;
}

export const TravelInput = ({ onAdd, lastDate }: TravelInputProps) => {
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
