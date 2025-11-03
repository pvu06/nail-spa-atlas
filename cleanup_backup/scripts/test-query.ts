import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function testQuery() {
  // Test with Miami coordinates (from the latest search)
  const latitude = 25.7616798;
  const longitude = -80.1917902;
  const latRange = 0.725;
  const lngRange = 0.725;

  console.log("🔍 Testing query with Miami coordinates:");
  console.log(`   Lat: ${latitude} ± ${latRange}`);
  console.log(`   Lng: ${longitude} ± ${lngRange}\n`);

  const where = {
    latitude: {
      gte: latitude - latRange,
      lte: latitude + latRange,
    },
    longitude: {
      gte: longitude - lngRange,
      lte: longitude + lngRange,
    },
  };

  console.log("📦 Query WHERE clause:", JSON.stringify(where, null, 2), "\n");

  const history = await prisma.searchHistory.findMany({
    where,
    include: {
      snapshots: true,
    },
    orderBy: {
      searchDate: "desc",
    },
    take: 10,
  });

  console.log(`✅ Found ${history.length} records\n`);

  if (history.length > 0) {
    console.log("📋 Results:");
    history.forEach((record, index) => {
      console.log(`${index + 1}. ${record.searchAddress}`);
      console.log(`   Saved Lat: ${record.latitude}`);
      console.log(`   Saved Lng: ${record.longitude}`);
      console.log(`   Date: ${record.searchDate}\n`);
    });
  }

  // Now test WITHOUT location filter
  console.log("\n🌍 Testing query WITHOUT location filter:");
  const allHistory = await prisma.searchHistory.findMany({
    orderBy: {
      searchDate: "desc",
    },
    take: 3,
  });
  console.log(`✅ Found ${allHistory.length} records (no filter)\n`);

  await prisma.$disconnect();
}

testQuery().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

