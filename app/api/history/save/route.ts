import { NextRequest, NextResponse } from "next/server";
import { saveSearchHistory } from "@/lib/search-history";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchAddress, latitude, longitude, radiusMiles, competitors } = body;

    if (!searchAddress || !latitude || !longitude || !competitors) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const historyId = await saveSearchHistory({
      searchAddress,
      latitude,
      longitude,
      radiusMiles: radiusMiles || 10,
      competitors,
    });

    return NextResponse.json({
      success: true,
      data: { historyId },
      message: "Search history saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving search history:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save search history" },
      { status: 500 }
    );
  }
}

