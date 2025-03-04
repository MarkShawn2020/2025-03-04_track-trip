import { NextRequest, NextResponse } from "next/server";

// Get API keys from environment variables
const AMAP_API_KEY =  process.env.AMAP_API_KEY;
const MAPQUEST_API_KEY = process.env.MAPQUEST_API_KEY;

console.log("Geocode API route loaded with AMap key:", AMAP_API_KEY ? "[API key available]" : "[API key missing]");
console.log("MapQuest API key:", MAPQUEST_API_KEY ? "[API key available]" : "[API key missing]");

// In-memory cache for geocoded cities
const geocodeCache: Record<string, { location: string, source: string }> = {};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get("city");
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!city) {
    return NextResponse.json(
      { error: "City parameter is required" },
      { status: 400 }
    );
  }

  console.log(`Geocoding city: ${city}${forceRefresh ? ' (forced refresh)' : ''}`);

  // Check cache first (unless force refresh is requested)
  if (!forceRefresh && geocodeCache[city]) {
    console.log(`Using cached coordinates for ${city} from ${geocodeCache[city].source}`);
    return NextResponse.json({
      status: "1",
      info: "OK (cached)",
      source: geocodeCache[city].source,
      geocodes: [
        {
          location: geocodeCache[city].location,
          city: city
        }
      ]
    });
  }

  // Try multiple geocoding services in sequence
  try {
    // 1. Try OpenStreetMap Nominatim API first (no API key required)
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "TravelTracker/1.0",
            "Accept-Language": "zh-CN,en-US"
          }
        }
      );

      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        if (nominatimData && nominatimData.length > 0) {
          const location = `${nominatimData[0].lon},${nominatimData[0].lat}`;
          console.log(`Found coordinates for ${city} using OpenStreetMap:`, location);
          
          // Cache the result
          geocodeCache[city] = { location, source: "openstreetmap" };
          
          return NextResponse.json({
            status: "1",
            info: "OK (OpenStreetMap)",
            source: "openstreetmap",
            geocodes: [
              {
                location,
                city: city,
                formatted_address: nominatimData[0].display_name
              }
            ]
          });
        }
      }
    } catch (osmError) {
      console.error("OpenStreetMap geocoding error:", osmError);
    }

    // 2. Try AMap API if available
    if (AMAP_API_KEY) {
      try {
        const amapResponse = await fetch(
          `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(
            city
          )}&output=json&key=${AMAP_API_KEY}`
        );

        if (amapResponse.ok) {
          const amapData = await amapResponse.json();
          console.log(`AMap API response for ${city}:`, amapData);
          
          if (amapData.status === "1" && amapData.geocodes && amapData.geocodes.length > 0) {
            const location = amapData.geocodes[0].location;
            
            // Cache the result
            geocodeCache[city] = { location, source: "amap" };
            
            return NextResponse.json({
              ...amapData,
              source: "amap"
            });
          }
        }
      } catch (amapError) {
        console.error("AMap geocoding error:", amapError);
      }
    }

    // 3. Try MapQuest API if available
    if (MAPQUEST_API_KEY) {
      try {
        const mapquestResponse = await fetch(
          `https://www.mapquestapi.com/geocoding/v1/address?key=${MAPQUEST_API_KEY}&location=${encodeURIComponent(city)}`
        );

        if (mapquestResponse.ok) {
          const mapquestData = await mapquestResponse.json();
          
          if (mapquestData.results && mapquestData.results.length > 0 && 
              mapquestData.results[0].locations && mapquestData.results[0].locations.length > 0) {
            const location = mapquestData.results[0].locations[0];
            const lat = location.latLng.lat;
            const lng = location.latLng.lng;
            const locationStr = `${lng},${lat}`;
            
            console.log(`Found coordinates for ${city} using MapQuest:`, locationStr);
            
            // Cache the result
            geocodeCache[city] = { location: locationStr, source: "mapquest" };
            
            return NextResponse.json({
              status: "1",
              info: "OK (MapQuest)",
              source: "mapquest",
              geocodes: [
                {
                  location: locationStr,
                  city: city,
                  formatted_address: location.street
                }
              ]
            });
          }
        }
      } catch (mapquestError) {
        console.error("MapQuest geocoding error:", mapquestError);
      }
    }

    // 4. Try our local database as a fallback
    const localCoordinates = getCityCoordinatesFromLocalDB(city);
    if (localCoordinates) {
      const locationStr = `${localCoordinates[0]},${localCoordinates[1]}`;
      console.log(`Found local coordinates for ${city}:`, localCoordinates);
      
      // Cache the result
      geocodeCache[city] = { location: locationStr, source: "local_db" };
      
      return NextResponse.json({
        status: "1",
        info: "OK (Local DB)",
        source: "local_db",
        geocodes: [
          {
            location: locationStr,
            city: city
          }
        ]
      });
    }

    // 5. Last resort - use a default location in China
    console.log(`No coordinates found for ${city}, using default location`);
    const defaultLocation = "116.397428,39.90923"; // Beijing
    
    // Don't cache default locations to allow retrying later
    
    return NextResponse.json({
      status: "1",
      info: "Using default coordinates",
      source: "default",
      geocodes: [
        {
          location: defaultLocation,
          city: city
        }
      ]
    });
  } catch (error) {
    console.error("All geocoding methods failed:", error);
    
    // Absolute last resort
    return NextResponse.json({
      status: "1",
      info: "Using fallback coordinates after all methods failed",
      source: "fallback",
      geocodes: [
        {
          location: "116.397428,39.90923", // Default to Beijing
          city: city
        }
      ]
    });
  }
}

// Simple local database of common city coordinates
function getCityCoordinatesFromLocalDB(cityName: string): [number, number] | null {
  const cityCoordinates: Record<string, [number, number]> = {
    // China
    "北京": [116.407526, 39.90403],
    "上海": [121.473701, 31.230416],
    "广州": [113.264385, 23.129112],
    "深圳": [114.057868, 22.543099],
    "杭州": [120.15507, 30.274085],
    "南京": [118.796877, 32.060255],
    "成都": [104.065735, 30.659462],
    "重庆": [106.551556, 29.563009],
    "武汉": [114.305393, 30.593099],
    "西安": [108.940175, 34.341568],
    "苏州": [120.585316, 31.298886],
    "天津": [117.200983, 39.084158],
    "厦门": [118.089425, 24.479834],
    "青岛": [120.382639, 36.067082],
    "大连": [121.614682, 38.914003],
    
    // International
    "Tokyo": [139.6917, 35.6895],
    "New York": [-74.0060, 40.7128],
    "London": [-0.1278, 51.5074],
    "Paris": [2.3522, 48.8566],
    "Sydney": [151.2093, -33.8688],
    "Singapore": [103.8198, 1.3521],
    "Seoul": [126.9780, 37.5665],
    "Hong Kong": [114.1694, 22.3193],
    "Bangkok": [100.5018, 13.7563],
    "Dubai": [55.2708, 25.2048],
    "Los Angeles": [-118.2437, 34.0522],
    "Berlin": [13.4050, 52.5200],
    "Rome": [12.4964, 41.9028],
    "Toronto": [-79.3832, 43.6532],
    "Moscow": [37.6173, 55.7558]
  };
  
  // Direct match
  if (cityCoordinates[cityName]) {
    return cityCoordinates[cityName];
  }
  
  // Case insensitive match for non-Chinese cities
  const lowercaseCityName = cityName.toLowerCase();
  for (const [key, value] of Object.entries(cityCoordinates)) {
    if (key.toLowerCase() === lowercaseCityName) {
      return value;
    }
  }
  
  // Fuzzy match - check if the city name contains any of our known cities
  for (const [key, value] of Object.entries(cityCoordinates)) {
    if (cityName.includes(key) || key.includes(cityName)) {
      return value;
    }
  }
  
  return null;
}
