import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [TEST] Starting test query...");
    
    // Test 1: Check if searchHistory exists
    console.log("🧪 [TEST] Available models:", Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
    
    // Test 2: Count all records
    const totalCount = await prisma.searchHistory.count();
    console.log("🧪 [TEST] Total searchHistory records:", totalCount);
    
    // Test 3: Get first record
    const firstRecord = await prisma.searchHistory.findFirst({
      orderBy: { searchDate: 'desc' },
    });
    console.log("🧪 [TEST] First record:", firstRecord ? `${firstRecord.searchAddress} at ${firstRecord.searchDate}` : "None");
    
    // Test 4: Query with Miami coordinates
    const miamiLat = 25.7616798;
    const miamiLng = -80.1917902;
    const latRange = 0.725;
    const lngRange = 0.725;
    
    const miamiResults = await prisma.searchHistory.findMany({
      where: {
        latitude: {
          gte: miamiLat - latRange,
          lte: miamiLat + latRange,
        },
        longitude: {
          gte: miamiLng - lngRange,
          lte: miamiLng + lngRange,
        },
      },
    });
    
    console.log("🧪 [TEST] Miami query results:", miamiResults.length);
    
    return NextResponse.json({
      success: true,
      data: {
        totalRecords: totalCount,
        firstRecord: firstRecord,
        miamiResults: miamiResults.length,
        miamiSample: miamiResults[0],
      },
    });
  } catch (error: any) {
    console.error("🧪 [TEST] Error:", error);
    console.error("🧪 [TEST] Stack:", error.stack);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

