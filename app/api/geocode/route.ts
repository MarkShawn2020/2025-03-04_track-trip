import { NextRequest, NextResponse } from 'next/server';
import { getDefaultCityCoordinates } from '@/data/cityCoordinates';

/**
 * API route to proxy geocoding requests to avoid CORS issues
 * @param request The incoming request
 * @returns Response with geocoding data
 */
export async function GET(request: NextRequest) {
  // Get the city name from the query parameters
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  
  if (!city) {
    return NextResponse.json(
      { error: 'City parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    // First try OpenStreetMap Nominatim API
    const encodedCity = encodeURIComponent(city);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedCity}&format=json&limit=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'TravelTracker/1.0' // Nominatim requires a User-Agent header
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      // Extract coordinates from the response
      const coordinates = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      return NextResponse.json(coordinates);
    }
    
    // Fallback to MapQuest Nominatim API if OpenStreetMap doesn't find the city
    // Note: In a production app, you would use your own API key
    const mapQuestResponse = await fetch(
      `https://open.mapquestapi.com/nominatim/v1/search.php?key=YOUR_MAPQUEST_KEY&q=${encodedCity}&format=json&limit=1`
    );
    
    if (!mapQuestResponse.ok) {
      throw new Error(`MapQuest API error: ${mapQuestResponse.status}`);
    }
    
    const mapQuestData = await mapQuestResponse.json();
    
    if (mapQuestData && mapQuestData.length > 0) {
      const coordinates = {
        lat: parseFloat(mapQuestData[0].lat),
        lng: parseFloat(mapQuestData[0].lon)
      };
      
      return NextResponse.json(coordinates);
    }
    
    // If no coordinates found with either API
    return NextResponse.json(
      { error: 'City not found' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error in geocoding proxy:', error);
    
    // Use our city coordinates database for fallback
    const fallbackCoordinates = getDefaultCityCoordinates(city);
    
    return NextResponse.json(fallbackCoordinates);
  }
}
