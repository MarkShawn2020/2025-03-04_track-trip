"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Types for our travel data
type TravelPoint = {
  city: string;
  date: string;
  transport?: string;
  notes?: string;
};

const TravelInput = ({ onAdd }: { onAdd: (point: TravelPoint) => void }) => {
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [transport, setTransport] = useState('');

  const handleSubmit = () => {
    if (city && date) {
      onAdd({ city, date, transport });
      setCity('');
      setDate('');
      setTransport('');
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
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          placeholder="Transportation (optional)"
          value={transport}
          onChange={(e) => setTransport(e.target.value)}
        />
        <Button className="w-full" onClick={handleSubmit}>
          Add Point
        </Button>
      </div>
    </Card>
  );
};

const TravelList = ({ points }: { points: TravelPoint[] }) => (
  <Card className="p-4">
    <h3 className="text-lg font-semibold mb-4">Travel Timeline</h3>
    <div className="space-y-4">
      {points.map((point, index) => (
        <div key={index} className="flex items-start space-x-4 p-2 hover:bg-accent rounded-lg transition-colors">
          <div className="flex-shrink-0 w-16 text-sm text-muted-foreground">
            {new Date(point.date).toLocaleDateString()}
          </div>
          <div>
            <div className="font-medium">{point.city}</div>
            {point.transport && (
              <div className="text-sm text-muted-foreground">
                via {point.transport}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

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

  return (
    <main className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <MapPlaceholder />
        </div>
        <div className="space-y-8">
          <TravelInput onAdd={addPoint} />
          <TravelList points={points} />
        </div>
      </div>
    </main>
  );
}
