"use client";

import { MapPlaceholder, TravelInput, TravelList, TravelPoint } from "@/components/travel";
import { useState } from "react";


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
