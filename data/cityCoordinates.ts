/**
 * 常用城市坐标数据库
 * 用于在API请求失败时提供默认坐标
 */

export interface CityCoordinates {
  [cityName: string]: {
    lat: number;
    lng: number;
  };
}

// 中国主要城市坐标
export const chineseCities: CityCoordinates = {
  "北京": { lat: 39.9042, lng: 116.4074 },
  "上海": { lat: 31.2304, lng: 121.4737 },
  "广州": { lat: 23.1291, lng: 113.2644 },
  "深圳": { lat: 22.5431, lng: 114.0579 },
  "成都": { lat: 30.5728, lng: 104.0668 },
  "重庆": { lat: 29.4316, lng: 106.9123 },
  "杭州": { lat: 30.2741, lng: 120.1551 },
  "南京": { lat: 32.0603, lng: 118.7969 },
  "武汉": { lat: 30.5928, lng: 114.3055 },
  "西安": { lat: 34.3416, lng: 108.9398 },
  "天津": { lat: 39.3434, lng: 117.3616 },
  "苏州": { lat: 31.2990, lng: 120.5853 },
  "郑州": { lat: 34.7466, lng: 113.6253 },
  "长沙": { lat: 28.2282, lng: 112.9388 },
  "青岛": { lat: 36.0671, lng: 120.3826 },
  "沈阳": { lat: 41.8057, lng: 123.4315 },
  "大连": { lat: 38.9140, lng: 121.6147 },
  "厦门": { lat: 24.4798, lng: 118.0894 },
  "哈尔滨": { lat: 45.8038, lng: 126.5340 },
  "济南": { lat: 36.6512, lng: 117.1201 },
  // 添加旅行轨迹中的其他城市
  "常州": { lat: 31.8112, lng: 119.9741 },
  "无锡": { lat: 31.5689, lng: 120.2883 },
  "香港": { lat: 22.3193, lng: 114.1694 },
  "昆明": { lat: 25.0389, lng: 102.7183 },
  "曲靖": { lat: 25.4901, lng: 103.7961 },
  "合肥": { lat: 31.8206, lng: 117.2272 },
  "泰安": { lat: 36.1941, lng: 117.0874 }
};

// 国际主要城市坐标
export const internationalCities: CityCoordinates = {
  "纽约": { lat: 40.7128, lng: -74.0060 },
  "伦敦": { lat: 51.5074, lng: -0.1278 },
  "东京": { lat: 35.6762, lng: 139.6503 },
  "巴黎": { lat: 48.8566, lng: 2.3522 },
  "新加坡": { lat: 1.3521, lng: 103.8198 },
  "悉尼": { lat: -33.8688, lng: 151.2093 },
  "洛杉矶": { lat: 34.0522, lng: -118.2437 },
  "多伦多": { lat: 43.6532, lng: -79.3832 },
  "柏林": { lat: 52.5200, lng: 13.4050 },
  "莫斯科": { lat: 55.7558, lng: 37.6173 },
  "迪拜": { lat: 25.2048, lng: 55.2708 },
  "曼谷": { lat: 13.7563, lng: 100.5018 },
  "首尔": { lat: 37.5665, lng: 126.9780 },
  "香港": { lat: 22.3193, lng: 114.1694 },
  "台北": { lat: 25.0330, lng: 121.5654 },
  "吉隆坡": { lat: 3.1390, lng: 101.6869 },
  "阿姆斯特丹": { lat: 52.3676, lng: 4.9041 },
  "马德里": { lat: 40.4168, lng: -3.7038 },
  "罗马": { lat: 41.9028, lng: 12.4964 },
  "开罗": { lat: 30.0444, lng: 31.2357 }
};

// 合并所有城市数据
export const allCityCoordinates: CityCoordinates = {
  ...chineseCities,
  ...internationalCities
};

/**
 * 根据城市名获取默认坐标
 * @param cityName 城市名称
 * @returns 城市坐标或null
 */
export const getDefaultCityCoordinates = (cityName: string) => {
  // 尝试直接匹配
  if (allCityCoordinates[cityName]) {
    return allCityCoordinates[cityName];
  }
  
  // 尝试模糊匹配（检查城市名是否包含在任何已知城市中）
  const cityKeys = Object.keys(allCityCoordinates);
  for (const key of cityKeys) {
    if (cityName.includes(key) || key.includes(cityName)) {
      return allCityCoordinates[key];
    }
  }
  
  // 如果没有匹配，返回中国中部的默认坐标
  return {
    lat: 35.86166,
    lng: 104.195397
  };
};
