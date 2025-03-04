"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { TravelPoint } from "./types";
import { loadAMapScript } from "@/utils/amap";

interface GeocodedPoint extends TravelPoint {
  coordinates: [number, number];
  source?: string;
}

interface MapProps {
  points: TravelPoint[];
}

export const MapPlaceholder = ({ points = [] }: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [processedPoints, setProcessedPoints] = useState<GeocodedPoint[]>([]);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  
  // 使用 ref 来跟踪最新的 points 和 processedPoints，避免依赖循环
  const pointsRef = useRef(points);
  const processedPointsRef = useRef(processedPoints);
  
  // 更新 ref 值
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);
  
  useEffect(() => {
    processedPointsRef.current = processedPoints;
  }, [processedPoints]);

  // Load AMap and initialize map
  useEffect(() => {
    console.log("MapPlaceholder component mounted");
    
    // Don't try to initialize map until the component is fully rendered
    if (!mapContainerRef.current) {
      console.log("Map container ref not ready yet, will retry");
      return;
    }

    const initMap = () => {
      console.log("Initializing map...");
      try {
        loadAMapScript((AMap) => {
          console.log("AMap loaded successfully, creating map instance");
          try {
            // Create map instance
            const map = new AMap.Map(mapContainerRef.current, {
              zoom: 4,
              center: [116.397428, 39.90923], // Default to China center
              resizeEnable: true,
              viewMode: '2D',
            });

            console.log("Map instance created");

            // Add map controls directly (plugins are pre-loaded in the URL)
            try {
              map.addControl(new AMap.ToolBar());
              map.addControl(new AMap.Scale());
              console.log("Map controls added");
            } catch (controlError) {
              console.error("Error adding map controls:", controlError);
              // Continue even if controls fail
            }

            setMapInstance(map);
            setLoading(false);
            console.log("Map initialization complete");
          } catch (mapError) {
            console.error("Error creating map instance:", mapError);
            setError(`Failed to create map: ${mapError.message || 'Unknown error'}`); 
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error loading AMap script:", err);
        setError(`Failed to load map: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (mapInstance) {
        console.log("Destroying map instance");
        try {
          mapInstance.destroy();
        } catch (e) {
          console.error("Error destroying map:", e);
        }
      }
    };
  }, []);

  // 使用防抖函数包装地理编码请求
  const geocodeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // 地理编码函数
  const geocodeCities = async () => {
    if (geocodingInProgress) return;
    
    const currentPoints = pointsRef.current;
    const currentProcessedPoints = processedPointsRef.current;
    
    if (currentPoints.length === 0) return;
    
    // 检查是否已经处理了所有点
    const allPointsProcessed = currentPoints.every(point => 
      currentProcessedPoints.some(p => p.city === point.city && p.date === point.date)
    );
    
    if (allPointsProcessed) {
      console.log("All points already processed, skipping geocoding");
      return;
    }
    
    console.log("Starting geocoding process for new points...");
    setGeocodingInProgress(true);
    
    try {
      // 保留已处理的点
      const newProcessedPoints: GeocodedPoint[] = [...currentProcessedPoints];
      const pointsToProcess = currentPoints.filter(point => 
        !newProcessedPoints.some(p => p.city === point.city && p.date === point.date)
      );
      
      console.log(`Found ${pointsToProcess.length} new points to process`);
      
      // 如果没有新的点需要处理，直接返回
      if (pointsToProcess.length === 0) {
        setGeocodingInProgress(false);
        return;
      }
      
      // Process points in batches to avoid overwhelming the API
      const batchSize = 5;
      
      for (let i = 0; i < pointsToProcess.length; i += batchSize) {
        const batch = pointsToProcess.slice(i, i + batchSize);
        const batchPromises = batch.map(async (point) => {
          try {
            console.log(`Geocoding city: ${point.city}`);
            const response = await fetch(`/api/geocode?city=${encodeURIComponent(point.city)}`);
            const data = await response.json();
            
            if (data.status === "1" && data.geocodes && data.geocodes.length > 0) {
              const location = data.geocodes[0].location;
              const [lng, lat] = location.split(",").map(Number);
              return {
                ...point,
                coordinates: [lng, lat] as [number, number],
                source: data.source || 'unknown'
              };
            }
            return null;
          } catch (error) {
            console.error(`Error geocoding ${point.city}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          if (result) newProcessedPoints.push(result);
        });
        
        // Small delay between batches to be nice to the API
        if (i + batchSize < pointsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      setProcessedPoints(newProcessedPoints);
    } catch (error) {
      console.error("Error during geocoding:", error);
    } finally {
      setGeocodingInProgress(false);
    }
  };
  
  // Geocode cities and update processed points
  useEffect(() => {
    // 清除之前的定时器
    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current);
    }
    
    // 设置一个新的定时器，防抖 500ms
    geocodeDebounceRef.current = setTimeout(() => {
      geocodeCities();
    }, 500);
    
    // 清除函数
    return () => {
      if (geocodeDebounceRef.current) {
        clearTimeout(geocodeDebounceRef.current);
      }
    };
  }, [points]);

  // Update map with processed points
  useEffect(() => {
    if (!mapInstance || processedPoints.length === 0) return;

    console.log("Updating map with processed points:", processedPoints.length);

    // Clear existing markers and polylines
    mapInstance.clearMap();

    const addMarkersAndPolyline = () => {
      const markers: any[] = [];
      const pathCoordinates: [number, number][] = [];
      const infoWindows: any[] = [];

      // Sort points by date
      const sortedPoints = [...processedPoints].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      // Process each travel point
      for (let i = 0; i < sortedPoints.length; i++) {
        const point = sortedPoints[i];
        const coordinate = point.coordinates;
        pathCoordinates.push(coordinate);

        // Get transport icon
        const getTransportIcon = (transport: string) => {
          const iconMap: { [key: string]: string } = {
            '飞机': '✈️',
            '火车': '🚂',
            '汽车': '🚗',
            '步行': '🚶',
            '自行车': '🚲',
            '轮船': '🚢',
          };
          return iconMap[transport] || '📍';
        };

        // Create marker label with number
        const markerLabel = document.createElement('div');
        markerLabel.style.cssText = `
          background-color: #3B82F6;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid white;
        `;
        markerLabel.textContent = `${i + 1}`;

        // Create marker content container
        const markerContent = document.createElement('div');
        markerContent.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        `;
        
        // Combine label and icon
        markerContent.appendChild(markerLabel);

        // Create marker
        const marker = new window.AMap.Marker({
          position: coordinate,
          content: markerContent,
          offset: new window.AMap.Pixel(-12, -36),
          zIndex: 90 + i, // Later points appear on top
          animation: 'AMAP_ANIMATION_DROP',
        });

        // Format date for display
        const date = new Date(point.date);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

        // Create info window content
        const content = `
          <div style="
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            padding: 16px;
            min-width: 200px;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            ">
              <span style="
                background-color: #3B82F6;
                color: white;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
              ">${i + 1}</span>
              <h3 style="
                margin: 0;
                font-size: 18px;
                color: #1a1a1a;
              ">${point.city}</h3>
            </div>
            <div style="
              padding-left: 32px;
              color: #666;
              display: flex;
              flex-direction: column;
              gap: 4px;
            ">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>📅</span>
                <span>${formattedDate}</span>
              </div>
              ${point.transport ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>${getTransportIcon(point.transport)}</span>
                  <span>${point.transport}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        // Create info window
        const infoWindow = new window.AMap.InfoWindow({
          content,
          offset: new window.AMap.Pixel(0, -40),
          shadow: true,
        });

        // Add hover events
        markerContent.addEventListener('mouseenter', () => {
          markerLabel.style.transform = 'scale(1.1)';
          infoWindow.open(mapInstance, marker.getPosition());
        });

        markerContent.addEventListener('mouseleave', () => {
          markerLabel.style.transform = 'scale(1)';
          setTimeout(() => infoWindow.close(), 300);
        });

        markers.push(marker);
        infoWindows.push(infoWindow);
      }

      // Add all markers to map
      mapInstance.add(markers);

      // Create path if we have at least 2 points
      if (pathCoordinates.length >= 2) {
        // Create gradient colors for path segments
        const colors = sortedPoints.map((_, index) => {
          const progress = index / (sortedPoints.length - 1);
          return `rgba(59, 130, 246, ${0.4 + progress * 0.6})`; // Fade from light to dark blue
        });

        // Create path segments with different colors
        for (let i = 0; i < pathCoordinates.length - 1; i++) {
          const segment = new window.AMap.Polyline({
            path: [pathCoordinates[i], pathCoordinates[i + 1]],
            strokeColor: colors[i],
            strokeWeight: 4,
            strokeStyle: 'solid',
            lineJoin: 'round',
            lineCap: 'round',
            showDir: true,
            dirColor: colors[i],
            zIndex: 50 + i,
            geodesic: true,
          });
          mapInstance.add(segment);
        }
      }

      // Fit map to show all markers with padding
      mapInstance.setFitView(null, false, [80, 80, 80, 80]);
    };

    addMarkersAndPolyline();
  }, [mapInstance, processedPoints]);

  return (
    <Card className="aspect-video w-full overflow-hidden">
      {/* Always render the map container div, but hide it when loading or error */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
        style={{ display: (!loading && !error) ? 'block' : 'none' }}
      />
      
      {loading && (
        <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
      
      {error && (
        <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </Card>
  );
};
