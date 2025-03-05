"use client";

import { MapPlaceholder, TravelInput, TravelList, TravelPoint } from "@/components/travel";
import { useState } from "react";
import { motion } from "framer-motion";

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
    link.download = `vtrip-journey-${new Date().toISOString().split('T')[0]}.json`;
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

  const lastDate = points.length > 0 ? points[points.length - 1].date : undefined;

  return (
    <div className="flex flex-col gap-12 py-8">
      {/* Hero Section */}
      <section className="container mx-auto px-4">
        <div className="text-center space-y-4">
          <motion.h1 
            className="text-4xl md:text-5xl font-montserrat font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Journey, Beautifully Mapped
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Transform your travel memories into stunning interactive visualizations. Track your adventures, share your stories, and relive your journeys.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-24rem)]">
          {/* Left section: Map and Input */}
          <motion.div 
            className="lg:col-span-7 xl:col-span-8 space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="sticky top-24 space-y-6">
              <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border/40">
                <MapPlaceholder points={points} />
              </div>
              <div className="bg-card rounded-xl p-6 shadow-lg border border-border/40">
                <h2 className="text-xl font-semibold mb-4">Add New Location</h2>
                <TravelInput onAdd={addPoint} lastDate={lastDate} />
              </div>
            </div>
          </motion.div>

          {/* Right section: Timeline */}
          <motion.div 
            className="lg:col-span-5 xl:col-span-4 flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="sticky top-24 h-[calc(100vh-12rem)] bg-card rounded-xl p-6 shadow-lg border border-border/40 overflow-hidden">
              <TravelList 
                points={points} 
                onDelete={deletePoint}
                onEdit={editPoint}
                onExport={handleExport}
                onImport={handleImport}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-montserrat font-bold">Why Choose VTrip?</h2>
          <p className="text-muted-foreground mt-2">Everything you need to document your travel experiences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🎯",
              title: "Precise Tracking",
              description: "Accurately map your journey with our advanced geocoding system"
            },
            {
              icon: "🔄",
              title: "Easy Import/Export",
              description: "Seamlessly save and share your travel data in JSON format"
            },
            {
              icon: "✨",
              title: "Beautiful Interface",
              description: "Enjoy a modern, intuitive design that makes tracking a pleasure"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-xl p-6 shadow-lg border border-border/40"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
