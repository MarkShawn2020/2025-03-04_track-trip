import { NextRequest, NextResponse } from "next/server";

// Get AMap API key from environment variables
const AMAP_API_KEY = process.env.AMAP_API_KEY || process.env.NEXT_PUBLIC_AMAP_API_KEY;

console.log("AMap Geocode API route loaded with key:", AMAP_API_KEY ? "[API key available]" : "[API key missing]");

// In-memory cache for geocoded cities
const geocodeCache: Record<string, any> = {};

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerSecond: 1,  // Maximum requests per second
  maxQueueSize: 100,     // Maximum queue size
  requestDelay: 500,     // Delay between requests in ms (1000/requestsPerSecond)
};

// Request queue implementation
type QueueItem = {
  city: string;
  forceRefresh: boolean;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timestamp: number;
};

class RequestQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private lastRequestTime = 0;

  enqueue(item: QueueItem): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if queue is full
      if (this.queue.length >= RATE_LIMIT.maxQueueSize) {
        reject(new Error("Geocoding queue is full. Try again later."));
        return;
      }

      // Add to queue with resolve/reject functions
      this.queue.push({
        ...item,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const item = this.queue.shift();

    if (!item) {
      this.processing = false;
      return;
    }

    try {
      // Calculate time to wait based on rate limit
      const now = Date.now();
      const timeToWait = Math.max(0, RATE_LIMIT.requestDelay - (now - this.lastRequestTime));

      if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait));
      }

      // Process the request
      const result = await processGeocodeRequest(item.city, item.forceRefresh);
      this.lastRequestTime = Date.now();
      item.resolve(result);
    } catch (error) {
      console.error(`Error processing queue item for ${item.city}:`, error);
      item.reject(error);
    }

    // Small delay before processing next item
    setTimeout(() => this.processQueue(), 10);
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }
}

// Create a singleton request queue
const requestQueue = new RequestQueue();

// Function to process a single geocode request
async function processGeocodeRequest(city: string, forceRefresh: boolean) {
  // Check cache first (unless force refresh is requested)
  if (!forceRefresh && geocodeCache[city]) {
    console.log(`Using cached AMap coordinates for ${city}`);
    return geocodeCache[city];
  }

  if (!AMAP_API_KEY) {
    throw new Error("AMap API key is not configured");
  }

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
        // Add detailed location information to the response
        const enhancedResponse = {
          ...amapData,
          source: "amap-direct",
          geocodes: amapData.geocodes.map((geocode: any) => ({
            ...geocode,
            // Extract and include detailed location information
            province: geocode.province || "Unknown Province",
            city: geocode.city || "Unknown City",
            district: geocode.district || "Unknown District",
            formatted_address: geocode.formatted_address || `${geocode.province} ${geocode.city} ${geocode.district}`.trim(),
            location_details: {
              province: geocode.province,
              city: geocode.city,
              district: geocode.district,
              township: geocode.township,
              neighborhood: geocode.neighborhood,
              building: geocode.building,
              adcode: geocode.adcode,
              street: geocode.street,
              number: geocode.number
            }
          }))
        };
        
        // Cache the enhanced result
        geocodeCache[city] = enhancedResponse;
        
        return enhancedResponse;
      }
    }

    // If we get here, the AMap API request failed
    console.error(`AMap geocoding failed for ${city}`);
    throw new Error("No results found");
  } catch (error) {
    console.error("AMap geocoding error:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get("city");
  const forceRefresh = searchParams.get("refresh") === "true";
  const priority = searchParams.get("priority") === "high";

  if (!city) {
    return NextResponse.json(
      { error: "City parameter is required" },
      { status: 400 }
    );
  }

  console.log(`AMap Geocoding city: ${city}${forceRefresh ? ' (forced refresh)' : ''}${priority ? ' (high priority)' : ''}`);
  console.log(`Current queue length: ${requestQueue.getQueueLength()}`);

  try {
    // Add request to queue and wait for result
    const result = await requestQueue.enqueue({
      city,
      forceRefresh,
      resolve: () => {},
      reject: () => {},
      timestamp: Date.now()
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Queue processing error for ${city}:`, error);
    
    // Handle rate limit errors
    if (error.message?.includes("queue is full")) {
      return NextResponse.json(
        { 
          status: "0", 
          info: "Rate limit exceeded",
          error: error.message,
          queueLength: requestQueue.getQueueLength(),
          retryAfter: RATE_LIMIT.requestDelay * requestQueue.getQueueLength() 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(RATE_LIMIT.requestDelay * requestQueue.getQueueLength() / 1000).toString()
          }
        }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      { 
        status: "0", 
        info: "AMap geocoding error",
        error: error.message || String(error) 
      },
      { status: 500 }
    );
  }
}