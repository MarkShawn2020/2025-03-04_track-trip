import { TravelPoint } from "@/components/travel";
import { getCityCoordinatesSync } from "@/services/geocoding";

/**
 * Get transport icon based on transport type
 * @param transport Transport type
 * @returns SVG icon or emoji representing the transport
 */
export const getTransportIcon = (transport: string): string => {
  // 使用SVG图标或者emoji
  const transportMap: Record<string, string> = {
    'flight': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
    'train': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
    'bus': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A3 3 0 0 0 17.66 5H4a2 2 0 0 0-2 2v10h2"></path><path d="M14 17H9"></path><circle cx="6.5" cy="17.5" r="2.5"></circle><circle cx="16.5" cy="17.5" r="2.5"></circle></svg>',
    'car': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"></path><circle cx="6.5" cy="16.5" r="2.5"></circle><circle cx="16.5" cy="16.5" r="2.5"></circle></svg>',
    'ship': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a6 6 0 0 0 12 0c0-7-12-7-12 0Z"></path><path d="M14 20a6 6 0 0 0 12 0c0-7-12-7-12 0Z"></path></svg>',
    'bike': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"></path></svg>',
    'walk': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v16"></path><path d="M17 4v16"></path><path d="M21 4v16"></path><path d="M9 4v16"></path><path d="M5 4v16"></path><path d="M1 4v16"></path></svg>',
  };

  // 如果没有匹配的图标，返回默认图标
  return transportMap[transport] || '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>';
};

/**
 * Generate a color based on the transport type
 * @param transport Transport type
 * @returns CSS color string
 */
export const getTransportColor = (transport: string): string => {
  const colorMap: Record<string, string> = {
    'flight': '#3498db', // 蓝色
    'train': '#e74c3c', // 红色
    'bus': '#2ecc71', // 绿色
    'car': '#f39c12', // 橙色
    'ship': '#9b59b6', // 紫色
    'taxi': '#1abc9c', // 青绿色
    'bike': '#d35400', // 深橙色
    'walk': '#34495e', // 深蓝灰色
  };

  return colorMap[transport] || '#95a5a6'; // 灰色作为默认
};

/**
 * Process travel points to get coordinates and other useful data
 * @param points Array of travel points
 * @returns Processed travel points with coordinates
 */
export const processTravelPoints = (points: TravelPoint[]) => {
  return points
    .map(point => {
      const coords = getCityCoordinatesSync(point.city);
      if (!coords) return null;
      
      return {
        ...point,
        coordinates: coords,
        date: new Date(point.date),
      };
    })
    .filter(Boolean) // Remove null values
    .sort((a, b) => a!.date.getTime() - b!.date.getTime()); // Sort by date
};

/**
 * Generate a unique ID for a travel segment
 * @param fromCity From city
 * @param toCity To city
 * @param transport Transport type
 * @returns Unique ID string
 */
export const generateSegmentId = (fromCity: string, toCity: string, transport: string): string => {
  return `${fromCity}-${toCity}-${transport}`;
};

/**
 * Format date to a readable string
 * @param dateStr Date string
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  } catch (e) {
    return dateStr;
  }
};
