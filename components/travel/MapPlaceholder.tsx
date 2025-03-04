"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { TravelPoint } from "./types";
import { getCityCoordinates, calculateCenter, calculateBounds } from "@/services/geocoding";
import { formatDate, getTransportColor, getTransportIcon, processTravelPoints } from "@/utils/mapUtils";

interface MapVisualizationProps {
  points?: TravelPoint[];
  onSelectPoint?: (index: number) => void;
  selectedPoint?: number | null;
}

export const MapPlaceholder = ({ 
  points = [], 
  onSelectPoint,
  selectedPoint = null
}: MapVisualizationProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [mapObject, setMapObject] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [mapLines, setMapLines] = useState<any[]>([]);
  const [processedPoints, setProcessedPoints] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 引入样式文件
  useEffect(() => {
    // 动态加载样式文件
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/travel-map.css';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Load Google Maps API
  useEffect(() => {
    // Skip if already loaded or no ref
    if (mapLoaded || !mapRef.current) return;

    // Create script element
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Define global callback
    window.initMap = () => {
      setMapLoaded(true);
    };

    // Append script to document
    document.head.appendChild(script);

    return () => {
      // Clean up
      if (window.initMap) {
        delete window.initMap;
      }
      document.head.removeChild(script);
    };
  }, [mapLoaded]);

  // Initialize map when API is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapObject) return;

    // Default center (can be anywhere, will be adjusted based on points)
    const center = { lat: 39.9042, lng: 116.4074 }; // Beijing as default

    // Create map instance
    const map = new google.maps.Map(mapRef.current, {
      center: center,
      zoom: 3,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      scaleControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
      },
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    // Store map instance
    setMapObject(map);
  }, [mapLoaded, mapObject]);

  // Process points and update coordinates
  useEffect(() => {
    if (!points || points.length === 0) {
      setProcessedPoints([]);
      return;
    }
    
    // Process points initially with sync function (may use cached/temporary coordinates)
    const initialProcessedPoints = processTravelPoints(points);
    setProcessedPoints(initialProcessedPoints);
    
    // Then fetch accurate coordinates asynchronously for each point
    const fetchCoordinates = async () => {
      let hasUpdates = false;
      const updatedCache: Record<string, { lat: number; lng: number }> = {};
      
      for (const point of points) {
        try {
          // Get accurate coordinates from API
          const coords = await getCityCoordinates(point.city);
          if (coords) {
            // Store updated coordinates
            updatedCache[point.city] = coords;
            
            // Check if coordinates are different from what we have
            const existingPoint = initialProcessedPoints.find(p => p.city === point.city);
            if (existingPoint && 
                (Math.abs(existingPoint.coordinates.lat - coords.lat) > 0.0001 || 
                 Math.abs(existingPoint.coordinates.lng - coords.lng) > 0.0001)) {
              hasUpdates = true;
            }
          }
        } catch (error) {
          console.error(`Error fetching coordinates for ${point.city}:`, error);
        }
      }
      
      // If we have updates, update processed points and trigger a refresh
      if (hasUpdates) {
        // Create updated processed points with the new coordinates
        const updatedProcessedPoints = points.map(point => {
          const coords = updatedCache[point.city] || null;
          if (!coords) return null;
          
          return {
            ...point,
            coordinates: coords,
            date: new Date(point.date),
          };
        }).filter(Boolean).sort((a, b) => a!.date.getTime() - b!.date.getTime());
        
        setProcessedPoints(updatedProcessedPoints);
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    fetchCoordinates();
  }, [points]);

  // Update map when processed points change
  useEffect(() => {
    if (!mapObject || !processedPoints || processedPoints.length === 0) {
      return;
    }

    // Clear existing markers and lines
    mapMarkers.forEach(marker => marker.setMap(null));
    mapLines.forEach(line => line.setMap(null));
    setMapMarkers([]);
    setMapLines([]);

    const newMarkers: any[] = [];
    const newLines: any[] = [];
    const bounds = new google.maps.LatLngBounds();
    let prevPoint = null;
    
    // Create markers and lines for each point
    processedPoints.forEach((point, index) => {
      if (!point.coordinates) return;
      
      // Add point to bounds
      bounds.extend(new google.maps.LatLng(point.coordinates.lat, point.coordinates.lng));
      
      // Determine if this is a selected, first, or last point
      const isSelected = selectedPoint === index;
      const isFirst = index === 0;
      const isLast = index === processedPoints.length - 1;
      
      // Create a new marker
      const marker = new google.maps.Marker({
        position: { lat: point.coordinates.lat, lng: point.coordinates.lng },
        map: mapObject,
        title: point.city,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: isSelected ? '#e74c3c' : isFirst ? '#2ecc71' : isLast ? '#e74c3c' : '#3498db',
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
        zIndex: isSelected ? 1000 : isFirst || isLast ? 100 : 10
      });

      // Add click event to marker
      marker.addListener('click', () => {
        if (onSelectPoint) {
          onSelectPoint(index);
        }
        setActivePoint(index);
      });
      
      newMarkers.push(marker);
      
      // Create a polyline between this point and the previous one
      if (prevPoint) {
        const line = new google.maps.Polyline({
          path: [
            { lat: prevPoint.coordinates.lat, lng: prevPoint.coordinates.lng },
            { lat: point.coordinates.lat, lng: point.coordinates.lng }
          ],
          geodesic: true,
          strokeColor: getTransportColor(point.transport?.[0] || 'default'),
          strokeOpacity: 0.8,
          strokeWeight: 3,
          icons: [{
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: getTransportColor(point.transport?.[0] || 'default'),
              fillColor: getTransportColor(point.transport?.[0] || 'default'),
              fillOpacity: 1
            },
            offset: '50%'
          }],
          map: mapObject
        });
        
        newLines.push(line);
      }
      
      // Create info window content
      const contentString = `
        <div class="map-info-window">
          <h3>${point.city}</h3>
          <p class="date">${formatDate(point.date)}</p>
          ${point.transport?.length ? `
            <div class="transport">
              ${point.transport.map(t => `
                <div class="transport-icon ${t}" title="${t}">
                  ${getTransportIcon(t)}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${point.notes ? `<p>${point.notes}</p>` : ''}
        </div>
      `;

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: contentString,
        maxWidth: 250
      });
      
      // Add hover events to marker
      marker.addListener('mouseover', () => {
        infoWindow.open(mapObject, marker);
      });
      
      marker.addListener('mouseout', () => {
        infoWindow.close();
      });
      
      // Update previous point for next iteration
      prevPoint = point;
    });
    
    // Update state with new markers and lines
    setMapMarkers(newMarkers);
    setMapLines(newLines);
    
    // Fit map to bounds if we have points
    if (processedPoints.length > 0) {
      mapObject.fitBounds(bounds);
      
      // Adjust zoom level if too zoomed in (for single point or close points)
      const listener = google.maps.event.addListener(mapObject, 'idle', () => {
        if (mapObject.getZoom() > 10) {
          mapObject.setZoom(10);
        }
        google.maps.event.removeListener(listener);
      });
    }
    
    // Open info window for selected point
    if (selectedPoint !== null && selectedPoint >= 0 && selectedPoint < newMarkers.length) {
      const selectedMarker = newMarkers[selectedPoint];
      if (selectedMarker) {
        // Create info window content
        const point = processedPoints[selectedPoint];
        const contentString = `
          <div class="map-info-window">
            <h3>${point.city}</h3>
            <p class="date">${formatDate(point.date)}</p>
            ${point.transport?.length ? `
              <div class="transport">
                ${point.transport.map(t => `
                  <div class="transport-icon ${t}" title="${t}">
                    ${getTransportIcon(t)}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${point.notes ? `<p>${point.notes}</p>` : ''}
          </div>
        `;
        
        const infoWindow = new google.maps.InfoWindow({
          content: contentString,
          maxWidth: 250
        });
        
        infoWindow.open(mapObject, selectedMarker);
        
        // Close after 5 seconds
        setTimeout(() => {
          infoWindow.close();
        }, 5000);
      }
    }
  }, [mapObject, processedPoints, selectedPoint, onSelectPoint, refreshTrigger]);

  return (
    <Card className="w-full overflow-hidden">
      <div className="travel-map-container">
        <div 
          ref={mapRef} 
          className="travel-map"
        >
        </div>
        {!mapLoaded && (
          <div className="map-loading">
            <div className="map-loading-spinner"></div>
            <p className="mt-2 text-gray-600">加载地图中...</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Add global type for Google Maps callback
declare global {
  interface Window {
    initMap: () => void;
  }
}
