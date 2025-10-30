import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { limit = 10, latitude, longitude } = body;

    // Build query
    const where: any = {};
    
    // If latitude and longitude provided, search nearby
    if (latitude && longitude) {
      // Search within a reasonable distance (e.g., 50 miles)
      const latRange = 0.725; // ~50 miles in latitude degrees
      const lngRange = 0.725; // ~50 miles in longitude degrees
      
      where.latitude = {
        gte: latitude - latRange,
        lte: latitude + latRange,
      };
      where.longitude = {
        gte: longitude - lngRange,
        lte: longitude + lngRange,
      };
    }

    // Fetch search history with snapshots
    const history = await prisma.searchHistory.findMany({
      where,
      include: {
        snapshots: true,
      },
      orderBy: {
        searchDate: "desc",
      },
      take: limit,
    });

    return successResponse({ data: history }, "Search history retrieved successfully");
  } catch (error) {
    console.error("Error fetching search history:", error);
    return errorResponse("Failed to fetch search history", 500);
  }
}
