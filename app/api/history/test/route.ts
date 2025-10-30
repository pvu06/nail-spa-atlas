import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Test if SearchHistory table exists by trying to count records
    const count = await prisma.searchHistory.count();
    
    // Try to get a sample record
    const sample = await prisma.searchHistory.findFirst({
      include: {
        snapshots: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Database tables exist",
      data: {
        totalSearches: count,
        sampleSearch: sample,
        tablesExist: true,
      },
    });
  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: "Tables might not exist. Run 'prisma db push' or check Vercel logs.",
      tablesExist: false,
    }, { status: 500 });
  }
}

