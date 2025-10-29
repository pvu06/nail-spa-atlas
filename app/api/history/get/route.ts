import { NextRequest, NextResponse } from "next/server";
import { getSearchHistory, getCompetitorTrends, detectMarketChanges } from "@/lib/search-history";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchAddress, limit } = body;

    if (!searchAddress) {
      return NextResponse.json(
        { success: false, error: "searchAddress is required" },
        { status: 400 }
      );
    }

    const [history, trends, changes] = await Promise.all([
      getSearchHistory({ searchAddress, limit }),
      getCompetitorTrends({ searchAddress, limit: 10 }),
      detectMarketChanges({ searchAddress }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        history,
        trends,
        changes,
      },
    });
  } catch (error: any) {
    console.error("Error fetching search history:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch search history" },
      { status: 500 }
    );
  }
}

