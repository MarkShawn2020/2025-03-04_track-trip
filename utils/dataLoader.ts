import { TravelPoint } from "@/components/travel/types";
import travelData from '@/data/travel-trajectory-2025-03-04 (5).json';

/**
 * 从JSON文件加载旅行轨迹数据
 * @returns 旅行点数组
 */
export const loadTravelData = (): TravelPoint[] => {
  try {
    // 确保数据是数组
    if (!Array.isArray(travelData)) {
      console.error('旅行数据格式不正确，应为数组');
      return [];
    }
    
    // 将JSON数据转换为TravelPoint格式
    const points: TravelPoint[] = travelData.map(item => ({
      city: item.city,
      date: item.date,
      transport: item.transport || [],
      notes: item.notes || ''
    }));
    
    return points;
  } catch (error) {
    console.error('加载旅行数据时出错:', error);
    return [];
  }
};

/**
 * 获取默认旅行数据
 * 如果没有数据，则返回一些示例数据
 */
export const getDefaultTravelData = (): TravelPoint[] => {
  const loadedData = loadTravelData();
  
  // 如果成功加载了数据，则返回
  if (loadedData && loadedData.length > 0) {
    return loadedData;
  }
  
  // 否则返回默认示例数据 - 中国经典旅行路线
  return [
    {
      city: "北京",
      date: "2025-03-01",
      transport: [],
      notes: "起点，游览故宫和长城"
    },
    {
      city: "西安",
      date: "2025-03-03",
      transport: ["flight"],
      notes: "参观兵马俑和古城墙"
    },
    {
      city: "成都",
      date: "2025-03-05",
      transport: ["train"],
      notes: "品尝川菜，看大熊猫"
    },
    {
      city: "重庆",
      date: "2025-03-07",
      transport: ["train"],
      notes: "游览洪崖洞和解放碑"
    },
    {
      city: "张家界",
      date: "2025-03-09",
      transport: ["flight"],
      notes: "探索天门山和玻璃栈道"
    },
    {
      city: "上海",
      date: "2025-03-12",
      transport: ["train"],
      notes: "参观外滩和迪士尼"
    },
    {
      city: "杭州",
      date: "2025-03-14",
      transport: ["train"],
      notes: "游览西湖和灵隐寺"
    },
    {
      city: "香港",
      date: "2025-03-16",
      transport: ["flight"],
      notes: "购物和游览维多利亚港"
    }
  ];
};
