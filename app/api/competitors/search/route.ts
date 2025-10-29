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

      // TODO: Replace with real Google Places API call
      // For now, return mock data
      const competitors = mockCompetitors.slice(0, competitorCount);

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



