import { NextRequest, NextResponse } from "next/server";
import { cronManager } from "@/lib/crawler/cron-manager";

/**
 * Stop automated competitor crawling
 */
export async function POST() {
  try {
    cronManager.stopAll();

    return NextResponse.json({
      success: true,
      message: "Crawler stopped successfully",
      status: cronManager.getStatus()
    });

  } catch (error) {
    console.error("Failed to stop crawler:", error);
    return NextResponse.json(
      { error: "Failed to stop crawler" },
      { status: 500 }
    );
  }
}
