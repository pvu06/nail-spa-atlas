import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuthAndRateLimit, AuthenticatedRequest } from "@/lib/middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { competitors as mockCompetitors } from "@/lib/mockData";

const searchSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  radius: z.number().min(1).max(50),
  competitorCount: z.number().min(1).max(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: NextRequest) {
  return withAuthAndRateLimit(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      
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

      // Save search to database
      if (req.user) {
        await prisma.savedSearch.create({
          data: {
            userId: req.user.id,
            searchAddress: address,
            radiusMiles: radius,
            competitorCount: competitors.length,
            results: JSON.parse(JSON.stringify(competitors)), // Convert to JSON
          },
        });
      }

      // Track API usage
      if (req.user) {
        await prisma.apiUsage.upsert({
          where: {
            userId_endpoint_date: {
              userId: req.user.id,
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
            userId: req.user.id,
            endpoint: "/api/competitors/search",
            requestCount: 1,
            date: new Date(),
          },
        });
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
  });
}



