import { NextRequest } from "next/server";
import { z } from "zod";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { competitors as mockCompetitors } from "@/lib/mockData";
import { getUserFromToken } from "@/lib/auth";

const searchSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  radius: z.number().min(1).max(50),
  competitorCount: z.number().min(1).max(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Optional authentication - allow public access but track if authenticated
    let user = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      user = await getUserFromToken(token);
    }

    const body = await request.json();
      
      // Validate input
      const result = searchSchema.safeParse(body);
      if (!result.success) {
        return errorResponse(
          "Validation error",
          400,
          "VALIDATION_ERROR",
          result.error.issues
        );
      }

      const { address, radius, competitorCount, lat, lng } = result.data;

      // If lat/lng not provided, we need to geocode first
      if (!lat || !lng) {
        return errorResponse(
          "Location coordinates required. Please geocode address first.",
          400,
          "MISSING_COORDINATES"
        );
      }

      // Import Google Maps functions
      const { searchNearbyPlaces, calculateDistance } = await import("@/lib/google-maps");
      
      // Search for real competitors using Google Places API
      const radiusMeters = Math.round(radius * 1609.34); // Convert miles to meters
      const places = await searchNearbyPlaces(
        { lat, lng },
        radiusMeters,
        "nail salon"
      );

      // Calculate distances and add to results
      const placesWithDistance = places.map((place) => ({
        id: place.placeId,
        name: place.name,
        address: place.address,
        location: place.location,
        rating: place.rating || 0,
        reviewCount: place.userRatingsTotal || 0,
        priceLevel: place.priceLevel || 2,
        distanceMiles: calculateDistance(lat, lng, place.location.lat, place.location.lng),
        // Mock service prices for now (can be scraped later)
        services: {
          gel: Math.round(25 + Math.random() * 20),
          pedicure: Math.round(30 + Math.random() * 20),
          acrylic: Math.round(45 + Math.random() * 25),
        },
        staffBand: place.userRatingsTotal > 200 ? "8+" : place.userRatingsTotal > 100 ? "4-7" : "1-3",
        hoursPerWeek: 50 + Math.floor(Math.random() * 30),
        amenities: ["Wi-Fi", "Wheelchair Accessible", "Parking"].slice(0, Math.floor(Math.random() * 3) + 1),
      }));

      // Sort by distance and limit
      placesWithDistance.sort((a, b) => a.distanceMiles - b.distanceMiles);
      const competitors = placesWithDistance.slice(0, competitorCount);

      // Save search to database (only if authenticated)
      if (user) {
        try {
          await prisma.savedSearch.create({
            data: {
              userId: user.id,
              searchAddress: address,
              radiusMiles: radius,
              competitorCount: competitors.length,
              results: JSON.parse(JSON.stringify(competitors)), // Convert to JSON
            },
          });
        } catch (dbError) {
          console.error("Failed to save search:", dbError);
          // Continue even if save fails
        }
      }

      // Track API usage (only if authenticated)
      if (user) {
        try {
          await prisma.apiUsage.upsert({
            where: {
              userId_endpoint_date: {
                userId: user.id,
                endpoint: "/api/competitors/search",
                date: new Date(),
              },
            },
            update: {
              requestCount: {
                increment: 1,
              },
            },
            create: {
              userId: user.id,
              endpoint: "/api/competitors/search",
              requestCount: 1,
              date: new Date(),
            },
          });
        } catch (dbError) {
          console.error("Failed to track usage:", dbError);
          // Continue even if tracking fails
        }
      }

      return successResponse({
        competitors,
        searchLocation: { lat, lng },
        meta: {
          searchAddress: address,
          radius,
          count: competitors.length,
          lat,
          lng,
        },
      }, "Competitors found successfully");
  } catch (error) {
    console.error("Search error:", error);
    return errorResponse(
      "Failed to search competitors",
      500,
      "INTERNAL_ERROR"
    );
  }
}



