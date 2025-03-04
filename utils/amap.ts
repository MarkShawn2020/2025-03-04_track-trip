// AMap utility functions

// Type definitions for AMap responses
export interface AmapGeocodingResult {
  status: string;
  info: string;
  infocode: string;
  count: string;
  geocodes: {
    formatted_address: string;
    country: string;
    province: string;
    citycode: string;
    city: string;
    district: string;
    township: string;
    neighborhood: string;
    building: string;
    adcode: string;
    street: string;
    number: string;
    location: string; // "116.481488,39.990464"
    level: string;
  }[];
}

// Cache for geocoding results to avoid redundant API calls
const geocodeCache: Record<string, Promise<[number, number] | null>> = {};

/**
 * Geocode a city name to coordinates using AMap API
 * @param cityName The name of the city to geocode
 * @returns Promise resolving to [longitude, latitude] or null if not found
 */
export async function geocodeCity(cityName: string): Promise<[number, number] | null> {
  // Return from cache if available
  if (geocodeCache[cityName]) {
    return geocodeCache[cityName];
  }

  // Create a new promise for this geocoding request
  const promise = new Promise<[number, number] | null>(async (resolve) => {
    try {
      // Use our API route to handle the geocoding request
      const response = await fetch(
        `/api/geocode?city=${encodeURIComponent(cityName)}`
      );

      if (!response.ok) {
        console.error("Geocoding API error:", response.statusText);
        resolve(null);
        return;
      }

      const data: AmapGeocodingResult = await response.json();

      if (data.status === "1" && data.geocodes && data.geocodes.length > 0) {
        const location = data.geocodes[0].location;
        const [lng, lat] = location.split(",").map(Number);
        resolve([lng, lat]);
      } else {
        console.error("Geocoding failed:", data.info);
        resolve(null);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      resolve(null);
    }
  });

  // Store in cache
  geocodeCache[cityName] = promise;
  return promise;
}

// Type for AMap instance
export type AMapInstance = any;

// Load AMap script
export function loadAMapScript(callback: (amap: AMapInstance) => void): void {
  console.log("Attempting to load AMap...");
  
  // Make sure we're in browser environment
  if (typeof window === 'undefined') {
    console.error("Cannot load AMap in non-browser environment");
    return;
  }
  
  // Check if AMap is already loaded
  if (window.AMap) {
    console.log("AMap already loaded, using existing instance");
    callback(window.AMap);
    return;
  }

  // Create script element
  const script = document.createElement("script");
  script.type = "text/javascript";
  
  // Use environment variable or fallback to placeholder
  const apiKey = process.env.NEXT_PUBLIC_AMAP_API_KEY || "YOUR_AMAP_KEY_HERE";
  console.log("Using AMap API Key:", apiKey);
  
  // Use HTTPS for the AMap API URL with callback
  const callbackName = `initAMap_${Date.now()}`;
  
  // Create a global callback function
  (window as any)[callbackName] = function() {
    console.log("AMap callback executed");
    if (window.AMap) {
      console.log("AMap object available on window");
      callback(window.AMap);
      // Clean up the callback
      delete (window as any)[callbackName];
    } else {
      console.error("AMap failed to load - AMap object not found on window after callback");
    }
  };
  // Add callback to URL
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Scale,AMap.ToolBar,AMap.DistrictLayer,AMap.DistrictExplorer&callback=${callbackName}`;
  script.async = true;
  script.defer = true;
  
  // Backup onload handler in case callback doesn't work
  script.onload = () => {
    console.log("AMap script loaded successfully");
    // Wait a bit to see if the callback was called
    setTimeout(() => {
      if (window.AMap && !(window as any)[callbackName]) {
        // Callback was already called and cleaned up
        return;
      }
      
      if (window.AMap) {
        console.log("AMap object available on window (via onload)");
        callback(window.AMap);
        // Clean up the callback
        delete (window as any)[callbackName];
      } else {
        console.error("AMap failed to load - AMap object not found on window (via onload)");
      }
    }, 500);
  };
  
  script.onerror = (e) => {
    console.error("Error loading AMap script:", e);
    delete (window as any)[callbackName]; // Clean up on error
  };
  
  // Append to document
  document.head.appendChild(script);
  console.log("AMap script added to document head");
}

// Declare AMap on window
declare global {
  interface Window {
    AMap: any;
  }
}
