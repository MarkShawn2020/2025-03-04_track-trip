/**
 * Geocoding service to convert city names to coordinates using external APIs
 */

import { getDefaultCityCoordinates } from '@/data/cityCoordinates';

// Cache for city coordinates to avoid duplicate API calls
const cityCache: Record<string, { lat: number; lng: number }> = {};

/**
 * Get coordinates for a city name using OpenStreetMap Nominatim API
 * @param cityName Name of the city
 * @returns Promise resolving to coordinates {lat, lng} or null if not found
 */
export const getCityCoordinates = async (cityName: string): Promise<{ lat: number; lng: number } | null> => {
  // Check if we have the city in our cache to avoid unnecessary API calls
  if (cityCache[cityName]) {
    return cityCache[cityName];
  }
  
  try {
    // 优先使用高德地图API（适用于中国城市）
    const encodedCity = encodeURIComponent(cityName);
    const response = await fetch(`/api/amap-geocode?city=${encodedCity}`);
    
    if (!response.ok) {
      // 如果高德API请求失败，尝试使用OpenStreetMap API
      console.warn(`高德地图API请求失败，尝试备用API: ${response.status}`);
      const osmResponse = await fetch(`/api/geocode?city=${encodedCity}`);
      
      if (!osmResponse.ok) {
        throw new Error(`所有地理编码API均失败: ${osmResponse.status}`);
      }
      
      const osmData = await osmResponse.json();
      
      if (osmData && osmData.lat && osmData.lng) {
        // 缓存结果以备将来使用
        cityCache[cityName] = osmData;
        return osmData;
      }
      
      if (osmData.error) {
        console.warn(`地理编码API警告: ${osmData.error}`);
        throw new Error(osmData.error);
      }
      
      throw new Error('无法获取城市坐标');
    }
    
    const data = await response.json();
    
    if (data && data.lat && data.lng) {
      // 缓存结果以备将来使用
      cityCache[cityName] = data;
      return data;
    }
    
    if (data.error) {
      console.warn(`高德地图API警告: ${data.error}`);
      throw new Error(data.error);
    }
    
    throw new Error('无法获取城市坐标');
  } catch (error) {
    console.error('获取城市坐标时出错:', error);
    
    // 使用我们的城市坐标数据库作为备选
    const fallbackCoordinates = getDefaultCityCoordinates(cityName);
    
    cityCache[cityName] = fallbackCoordinates;
    return fallbackCoordinates;
  }
};

/**
 * Synchronous version of getCityCoordinates that returns cached results or fallback coordinates
 * This is useful for components that can't handle async functions directly
 * @param cityName Name of the city
 * @returns Coordinates {lat, lng} from cache or fallback
 */
export const getCityCoordinatesSync = (cityName: string): { lat: number; lng: number } => {
  // Check if we have the city in our cache
  if (cityCache[cityName]) {
    return cityCache[cityName];
  }
  
  // For cities not in our cache, trigger the async lookup but return fallback immediately
  getCityCoordinates(cityName).then(coords => {
    if (coords) {
      // Update the cache for future use
      cityCache[cityName] = coords;
    }
  }).catch(err => console.error('Error in background geocoding:', err));
  
  // Use our city coordinates database for temporary coordinates
  const tempCoordinates = getDefaultCityCoordinates(cityName);
  
  // Store in cache temporarily
  cityCache[cityName] = tempCoordinates;
  
  return tempCoordinates;
};

/**
 * Calculate the center point of multiple coordinates
 * @param coordinates Array of {lat, lng} objects
 * @returns Center coordinates {lat, lng}
 */
export const calculateCenter = (coordinates: { lat: number; lng: number }[]): { lat: number; lng: number } => {
  if (coordinates.length === 0) {
    // Default to a world center view
    return { lat: 20, lng: 0 };
  }
  
  if (coordinates.length === 1) {
    return coordinates[0];
  }
  
  // Calculate the average of all coordinates
  const sum = coordinates.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / coordinates.length,
    lng: sum.lng / coordinates.length,
  };
};

/**
 * Calculate the bounding box for a set of coordinates
 * @param coordinates Array of {lat, lng} objects
 * @returns Bounding box {north, south, east, west}
 */
export const calculateBounds = (coordinates: { lat: number; lng: number }[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} => {
  if (coordinates.length === 0) {
    // Default world view
    return { north: 85, south: -85, east: 180, west: -180 };
  }
  
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  
  coordinates.forEach((coord) => {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  });
  
  // Add some padding
  north += 5;
  south -= 5;
  east += 5;
  west -= 5;
  
  return { north, south, east, west };
};
