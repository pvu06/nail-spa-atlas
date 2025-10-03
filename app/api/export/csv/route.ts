import { NextRequest } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/middleware";
import { errorResponse } from "@/lib/api-response";
import { Competitor } from "@/lib/mockData";

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { competitors } = body as { competitors: Competitor[] };

      if (!competitors || !Array.isArray(competitors)) {
        return errorResponse("Invalid competitors data", 400);
      }

      // Generate CSV
      const headers = [
        "Name",
        "Rating",
        "Reviews",
        "Price Range",
        "Gel Manicure",
        "Pedicure",
        "Acrylic",
        "Staff Band",
        "Hours/Week",
        "Distance (mi)",
        "Website",
      ];

      const rows = competitors.map((c) => [
        c.name,
        c.rating,
        c.reviewCount,
        c.priceRange,
        c.samplePrices.gel,
        c.samplePrices.pedicure,
        c.samplePrices.acrylic,
        c.staffBand,
        c.hoursPerWeek,
        c.distanceMiles,
        c.website,
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      // Return CSV as downloadable file
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="competitors-${Date.now()}.csv"`,
        },
      });
    } catch (error) {
      console.error("CSV export error:", error);
      return errorResponse(
        "Failed to export CSV",
        500,
        "INTERNAL_ERROR"
      );
    }
  });
}



