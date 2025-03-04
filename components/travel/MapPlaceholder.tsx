"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { TravelPoint } from "./types";
import { loadAMapScript } from "@/utils/amap";
import { getCachedGeocode, saveGeocodeToCache, cleanupExpiredCache } from "@/utils/geocodeCache";

interface GeocodedPoint extends TravelPoint {
  coordinates: [number, number];
  source?: string;
  province?: string;
  city?: string;
  district?: string;
  formatted_address?: string;
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

  // Clean up expired cache entries when component mounts
  useEffect(() => {
    // Clean up expired cache entries
    cleanupExpiredCache();
  }, []);

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
    
    // 检查是否已经处理了所有点 - 修改为更精确的检查
    // 不仅检查城市和日期，还要确保每个点都有坐标
    const allPointsProcessed = currentPoints.every(point => 
      currentProcessedPoints.some(p => 
        p.city === point.city && 
        p.date === point.date && 
        p.coordinates && 
        p.coordinates.length === 2
      )
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
      
      // 修改过滤逻辑，确保所有未处理的点都被处理
      const pointsToProcess = currentPoints.filter(point => 
        !newProcessedPoints.some(p => 
          p.city === point.city && 
          p.date === point.date && 
          p.coordinates && 
          p.coordinates.length === 2
        )
      );
      
      console.log(`Found ${pointsToProcess.length} new points to process`);
      console.log("Points to process:", pointsToProcess.map(p => p.city).join(", "));
      
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
            
            // First check local storage cache
            const cachedData = getCachedGeocode(point.city);
            if (cachedData) {
              console.log(`Using locally cached data for ${point.city}`);
              const location = cachedData.geocodes[0].location;
              const [lng, lat] = location.split(",").map(Number);
              return {
                ...point,
                coordinates: [lng, lat] as [number, number],
                source: 'local-cache',
                province: cachedData.geocodes[0].province,
                city: cachedData.geocodes[0].city,
                district: cachedData.geocodes[0].district,
                formatted_address: cachedData.geocodes[0].formatted_address
              };
            }
            
            // If not in cache, try the API
            console.log(`Trying backup API for ${point.city}`);
            const backupResponse = await fetch(`/api/amap-geocode?city=${encodeURIComponent(point.city)}`);
            const backupData = await backupResponse.json();
            
            if (backupData.status === "1" && backupData.geocodes && backupData.geocodes.length > 0) {
              // Save successful result to local storage cache
              saveGeocodeToCache(point.city, backupData);
              
              const backupLocation = backupData.geocodes[0].location;
              const [backupLng, backupLat] = backupLocation.split(",").map(Number);
              console.log(`Successfully geocoded ${point.city} with backup API: [${backupLng}, ${backupLat}]`);
              return {
                ...point,
                coordinates: [backupLng, backupLat] as [number, number],
                source: 'backup-api',
                province: backupData.geocodes[0].province,
                city: backupData.geocodes[0].city,
                district: backupData.geocodes[0].district,
                formatted_address: backupData.geocodes[0].formatted_address
              };
            }
          } catch (error) {
            console.error(`Error geocoding ${point.city}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          if (result) {
            // 检查是否已存在相同的点，如果存在则替换
            const existingIndex = newProcessedPoints.findIndex(p => 
              p.city === result.city && p.date === result.date
            );
            
            if (existingIndex >= 0) {
              newProcessedPoints[existingIndex] = result;
            } else {
              newProcessedPoints.push(result);
            }
          }
        });
        
        // Small delay between batches to be nice to the API
        if (i + batchSize < pointsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log("Processed points after geocoding:", newProcessedPoints.map(p => p.city).join(", "));
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
    
    // Collect province data from processed points
    const provinceVisits: Record<string, number> = {};
    const provincePoints: Record<string, GeocodedPoint[]> = {};
    
    processedPoints.forEach(point => {
      if (point.province) {
        if (!provinceVisits[point.province]) {
          provinceVisits[point.province] = 0;
          provincePoints[point.province] = [];
        }
        provinceVisits[point.province]++;
        provincePoints[point.province].push(point);
      }
    });
    
    console.log("Province visits:", provinceVisits);
    
    // Load district layer for province highlighting
    const loadProvinceLayer = () => {
      try {
        // Normalize province names to match AMap's internal naming
        const normalizedProvinceVisits: Record<string, number> = {};
        const normalizedProvincePoints: Record<string, GeocodedPoint[]> = {};
        
        // Create mapping for common province name variations
        const provinceNameMapping: Record<string, string> = {
          '北京市': '北京',
          '天津市': '天津',
          '河北省': '河北',
          '山西省': '山西',
          '内蒙古自治区': '内蒙古',
          '辽宁省': '辽宁',
          '吉林省': '吉林',
          '黑龙江省': '黑龙江',
          '上海市': '上海',
          '江苏省': '江苏',
          '浙江省': '浙江',
          '安徽省': '安徽',
          '福建省': '福建',
          '江西省': '江西',
          '山东省': '山东',
          '河南省': '河南',
          '湖北省': '湖北',
          '湖南省': '湖南',
          '广东省': '广东',
          '广西壮族自治区': '广西',
          '海南省': '海南',
          '重庆市': '重庆',
          '四川省': '四川',
          '贵州省': '贵州',
          '云南省': '云南',
          '西藏自治区': '西藏',
          '陕西省': '陕西',
          '甘肃省': '甘肃',
          '青海省': '青海',
          '宁夏回族自治区': '宁夏',
          '新疆维吾尔自治区': '新疆',
          '台湾省': '台湾',
          '香港特别行政区': '香港',
          '澳门特别行政区': '澳门'
        };
        
        // Normalize province names in our data
        Object.entries(provinceVisits).forEach(([province, count]) => {
          const normalizedName = provinceNameMapping[province] || province;
          if (!normalizedProvinceVisits[normalizedName]) {
            normalizedProvinceVisits[normalizedName] = 0;
            normalizedProvincePoints[normalizedName] = [];
          }
          normalizedProvinceVisits[normalizedName] += count;
          if (provincePoints[province]) {
            normalizedProvincePoints[normalizedName].push(...provincePoints[province]);
          }
        });
        
        console.log("Normalized province visits:", normalizedProvinceVisits);
        
        // Create a district layer for provinces
        const districtLayer = new window.AMap.DistrictLayer.Province({
          zIndex: 10,
          adcode: [],
          depth: 1,
          styles: {
            'fill': function(properties: any) {
              // Get province name
              const name = properties.NAME_CHN;
              
              // Debug province name matching
              if (Object.keys(normalizedProvinceVisits).length > 0 && !normalizedProvinceVisits[name]) {
                // Check if there's a name mismatch issue
                const provinceNames = Object.keys(normalizedProvinceVisits);
                const similarNames = provinceNames.filter(p => 
                  p.includes(name) || name.includes(p)
                );
                
                if (similarNames.length > 0) {
                  console.log(`Province name mismatch: Map has "${name}" but data has "${similarNames.join(', ')}"`); 
                }
              }
              
              // Check if this province has been visited
              if (normalizedProvinceVisits[name]) {
                // Calculate color intensity based on visit count
                const visits = normalizedProvinceVisits[name];
                const maxVisits = Math.max(...Object.values(normalizedProvinceVisits));
                const intensity = 0.3 + (visits / maxVisits) * 0.7;
                
                // Return a blue color with intensity based on visit count
                return `rgba(59, 130, 246, ${intensity})`;
              }
              
              // Default color for non-visited provinces
              return 'rgba(200, 200, 200, 0.1)';
            },
            'stroke': '#fff',
            'strokeWidth': 1
          }
        });
        
        // Add the district layer to the map
        mapInstance.add(districtLayer);
        
        // Add hover effect for provinces - ensure DistrictExplorer is available
        if (window.AMap.DistrictExplorer) {
          const districtExplorer = new window.AMap.DistrictExplorer({
            map: mapInstance
          });
          
          // Add event listeners for hover effects
          mapInstance.on('mousemove', function(e: any) {
            const px = e.pixel;
            districtExplorer.getDistrictByContainerPos(px, function(error: any, result: any) {
              if (result && result.districtInfo) {
                const name = result.districtInfo.NAME_CHN;
                if (normalizedProvinceVisits[name]) {
                  // Show tooltip with province info
                  const content = `
                    <div style="
                      background: white;
                      border-radius: 8px;
                      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
                      padding: 12px;
                      min-width: 150px;
                    ">
                      <h3 style="
                        margin: 0 0 8px 0;
                        font-size: 16px;
                        color: #1a1a1a;
                      ">${name}</h3>
                      <p style="
                        margin: 0;
                        color: #666;
                        font-size: 14px;
                      ">访问次数: ${normalizedProvinceVisits[name]}</p>
                      <p style="
                        margin: 4px 0 0 0;
                        color: #666;
                        font-size: 14px;
                      ">城市: ${normalizedProvincePoints[name].map(p => p.city).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</p>
                    </div>
                  `;
                  
                  // Create info window if it doesn't exist
                  if (!mapInstance.provinceInfoWindow) {
                    mapInstance.provinceInfoWindow = new window.AMap.InfoWindow({
                      content: content,
                      offset: new window.AMap.Pixel(0, -20),
                      closeWhenClickMap: true
                    });
                  } else {
                    mapInstance.provinceInfoWindow.setContent(content);
                  }
                  
                  // Open info window at mouse position
                  mapInstance.provinceInfoWindow.open(mapInstance, e.lnglat);
                }
              }
            });
          });

          
          // Clear info window when mouse leaves province
          mapInstance.on('mouseout', function() {
            if (mapInstance.provinceInfoWindow) {
              mapInstance.provinceInfoWindow.close();
            }
          });
        } else {
          console.warn("AMap.DistrictExplorer plugin is not available");
        }
        
      } catch (error) {
        console.error("Error loading province layer:", error);
      }
    };
    
    // Load district explorer plugin if needed
    if (!window.AMap.DistrictLayer || !window.AMap.DistrictLayer.Province || !window.AMap.DistrictExplorer) {
      console.log("Loading AMap district plugins...");
      window.AMap.plugin(['AMap.DistrictLayer', 'AMap.DistrictExplorer'], function() {
        console.log("AMap district plugins loaded successfully");
        // Ensure the plugins are fully loaded before proceeding
        setTimeout(() => {
          loadProvinceLayer();
        }, 100);
      });
    } else {
      loadProvinceLayer();
    }

    const addMarkersAndPolyline = () => {
      const markers: any[] = [];
      const pathCoordinates: [number, number][] = [];
      const infoWindows: any[] = [];

      // Sort points by date
      const sortedPoints = [...processedPoints].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      // Track city occurrences for multiple visits
      const cityVisits: Record<string, number[]> = {};
      
      // First pass: record all visits to each city
      sortedPoints.forEach((point, index) => {
        if (!cityVisits[point.city]) {
          cityVisits[point.city] = [];
        }
        cityVisits[point.city].push(index);
      });

      console.log("City visits:", cityVisits);

      // Process each travel point
      for (let i = 0; i < sortedPoints.length; i++) {
        const point = sortedPoints[i];
        const coordinate = point.coordinates;
        pathCoordinates.push(coordinate);

        // Get transport icon
        const getTransportIcon = (transport: string) => {
          const iconMap: { [key: string]: string } = {
            'flight': '✈️',
            'train': '🚂',
            'bus': '🚌',
            'car': '🚗',
            'taxi': '🛵',
            'bike': '🚲',
            'walk': '🚶',
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

        // For cities with multiple visits, add a badge showing all visit numbers
        if (cityVisits[point.city] && cityVisits[point.city].length > 1) {
          const visitNumbers = cityVisits[point.city]
            .map(idx => idx + 1)
            .filter(num => num !== i + 1); // Exclude current number
          
          if (visitNumbers.length > 0) {
            const multiVisitBadge = document.createElement('div');
            multiVisitBadge.style.cssText = `
              background-color: #EF4444;
              color: white;
              border-radius: 10px;
              padding: 2px 6px;
              font-size: 10px;
              font-weight: bold;
              position: absolute;
              top: -8px;
              right: -8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              border: 1px solid white;
            `;
            multiVisitBadge.textContent = `+${visitNumbers.length}`;
            markerContent.style.position = 'relative';
            markerContent.appendChild(multiVisitBadge);
          }
        }

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

        // Create info window content with multiple visit information
        let visitInfo = '';
        if (cityVisits[point.city] && cityVisits[point.city].length > 1) {
          const otherVisits = cityVisits[point.city]
            .filter(idx => idx !== i)
            .map(idx => idx + 1)
            .join(', ');
          visitInfo = `
            <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">
              Also visited as stop${cityVisits[point.city].length > 2 ? 's' : ''} #${otherVisits}
            </div>
          `;
        }

        // Create transport display
        let transportDisplay = '';
        if (point.transport && point.transport.length > 0) {
          const transportIcons = point.transport.map(t => {
            return `<span>${getTransportIcon(t)}</span>`;
          }).join(' ');
          
          transportDisplay = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${transportIcons}</span>
              <span>${point.transport.join(', ')}</span>
            </div>
          `;
        }

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
              ${transportDisplay}
              ${point.formatted_address ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>📍</span>
                  <span>${point.formatted_address}</span>
                </div>
              ` : ''}
              ${visitInfo}
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
