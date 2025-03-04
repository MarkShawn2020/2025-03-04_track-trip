/**
 * Geocode Cache Utility
 * 
 * This module provides functions for caching geocoded city data in localStorage
 * to avoid redundant API requests and improve performance.
 */

// Type definition for cached geocode data
export interface CachedGeocode {
  timestamp: number;
  expiresAt: number;
  data: any; // The geocode response data
}

// Cache configuration
const CACHE_CONFIG = {
  // Cache key prefix in localStorage
  keyPrefix: 'geocode_cache_',
  // Default expiration time (7 days in milliseconds)
  defaultExpiration: 7 * 24 * 60 * 60 * 1000,
  // Version for cache compatibility
  version: '1.0'
};

/**
 * Generate a cache key for a city name
 */
const getCacheKey = (cityName: string): string => {
  return `${CACHE_CONFIG.keyPrefix}${cityName.toLowerCase().trim()}`;
};

/**
 * Save geocode data to localStorage
 * 
 * @param cityName The name of the city
 * @param data The geocode data to cache
 * @param expiration Optional custom expiration time in milliseconds
 */
export const saveGeocodeToCache = (
  cityName: string,
  data: any,
  expiration: number = CACHE_CONFIG.defaultExpiration
): void => {
  if (!cityName || !data) return;
  
  try {
    // Skip if localStorage is not available (e.g., in SSR)
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    const now = Date.now();
    const cacheItem: CachedGeocode = {
      timestamp: now,
      expiresAt: now + expiration,
      data
    };
    
    localStorage.setItem(getCacheKey(cityName), JSON.stringify(cacheItem));
    console.log(`Cached geocode data for ${cityName}, expires in ${expiration / (24 * 60 * 60 * 1000)} days`);
  } catch (error) {
    console.error('Error saving geocode data to cache:', error);
    // Attempt to clear some space if storage is full
    try {
      cleanupExpiredCache();
    } catch (e) {
      console.error('Failed to clean up cache after save error:', e);
    }
  }
};

/**
 * Retrieve geocode data from localStorage
 * 
 * @param cityName The name of the city
 * @returns The cached geocode data or null if not found or expired
 */
export const getCachedGeocode = (cityName: string): any | null => {
  if (!cityName) return null;
  
  try {
    // Skip if localStorage is not available
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const cacheKey = getCacheKey(cityName);
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (!cachedItem) return null;
    
    const parsedItem: CachedGeocode = JSON.parse(cachedItem);
    const now = Date.now();
    
    // Check if cache has expired
    if (parsedItem.expiresAt < now) {
      // Remove expired item
      localStorage.removeItem(cacheKey);
      console.log(`Removed expired cache for ${cityName}`);
      return null;
    }
    
    console.log(`Using cached geocode data for ${cityName}, cached ${Math.round((now - parsedItem.timestamp) / (60 * 1000))} minutes ago`);
    return parsedItem.data;
  } catch (error) {
    console.error('Error retrieving geocode data from cache:', error);
    return null;
  }
};

/**
 * Remove a specific city from the cache
 * 
 * @param cityName The name of the city to remove from cache
 */
export const removeCachedGeocode = (cityName: string): void => {
  if (!cityName) return;
  
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    localStorage.removeItem(getCacheKey(cityName));
    console.log(`Removed cache for ${cityName}`);
  } catch (error) {
    console.error('Error removing geocode data from cache:', error);
  }
};

/**
 * Clean up expired cache entries
 * 
 * @returns The number of removed entries
 */
export const cleanupExpiredCache = (): number => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    
    const now = Date.now();
    let removedCount = 0;
    
    // Iterate through all localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Skip non-geocode cache items
      if (!key || !key.startsWith(CACHE_CONFIG.keyPrefix)) continue;
      
      try {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) continue;
        
        const parsedItem: CachedGeocode = JSON.parse(cachedItem);
        
        // Remove if expired
        if (parsedItem.expiresAt < now) {
          localStorage.removeItem(key);
          removedCount++;
        }
      } catch (e) {
        // If we can't parse the item, remove it
        localStorage.removeItem(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired geocode cache entries`);
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up expired cache:', error);
    return 0;
  }
};

/**
 * Get cache statistics
 * 
 * @returns Object with cache statistics
 */
export const getGeocodeStats = (): { total: number, expired: number, valid: number, size: number } => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { total: 0, expired: 0, valid: 0, size: 0 };
    }
    
    const now = Date.now();
    let total = 0;
    let expired = 0;
    let valid = 0;
    let size = 0;
    
    // Iterate through all localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Skip non-geocode cache items
      if (!key || !key.startsWith(CACHE_CONFIG.keyPrefix)) continue;
      
      try {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) continue;
        
        total++;
        size += cachedItem.length * 2; // Approximate size in bytes (2 bytes per character)
        
        const parsedItem: CachedGeocode = JSON.parse(cachedItem);
        
        if (parsedItem.expiresAt < now) {
          expired++;
        } else {
          valid++;
        }
      } catch (e) {
        // If we can't parse the item, count as expired
        expired++;
      }
    }
    
    return { total, expired, valid, size };
  } catch (error) {
    console.error('Error getting geocode cache stats:', error);
    return { total: 0, expired: 0, valid: 0, size: 0 };
  }
};