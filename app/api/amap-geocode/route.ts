import { NextRequest, NextResponse } from 'next/server';
import { getDefaultCityCoordinates } from '@/data/cityCoordinates';

// 高德地图API密钥 - 在实际应用中，应该存储在环境变量中
// 请替换为您自己的API密钥
const AMAP_KEY = process.env.AMAP_KEY || 'YOUR_AMAP_KEY';

// 如果没有设置API密钥，输出警告信息
if (AMAP_KEY === 'YOUR_AMAP_KEY') {
  console.warn('警告: 未设置高德地图API密钥，将使用备用数据源');
}

/**
 * 使用高德地图API进行地理编码的代理接口
 * @param request 请求对象
 * @returns 响应对象，包含城市的经纬度坐标
 */
export async function GET(request: NextRequest) {
  // 从查询参数中获取城市名称
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  
  if (!city) {
    return NextResponse.json(
      { error: '城市参数是必需的' },
      { status: 400 }
    );
  }
  
  try {
    // 使用高德地图API进行地理编码
    const encodedCity = encodeURIComponent(city);
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/geo?address=${encodedCity}&key=${AMAP_KEY}&output=json`,
      {
        headers: {
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'User-Agent': 'TravelTracker/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`高德地图API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 检查API响应状态
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      // 从响应中提取坐标
      const location = data.geocodes[0].location;
      const [lng, lat] = location.split(',').map(parseFloat);
      
      const coordinates = {
        lat,
        lng
      };
      
      return NextResponse.json(coordinates);
    }
    
    // 如果高德地图API没有找到城市，使用备用数据库
    console.log(`高德地图API未找到城市: ${city}，使用备用数据`);
    const fallbackCoordinates = getDefaultCityCoordinates(city);
    return NextResponse.json({
      ...fallbackCoordinates,
      source: 'fallback'
    });
    
  } catch (error) {
    console.error('地理编码代理中的错误:', error);
    
    // 使用我们的城市坐标数据库作为备选
    console.error(`地理编码API错误: ${error}，使用备用数据库`);
    const fallbackCoordinates = getDefaultCityCoordinates(city);
    
    return NextResponse.json({
      ...fallbackCoordinates,
      source: 'error_fallback'
    });
  }
}
