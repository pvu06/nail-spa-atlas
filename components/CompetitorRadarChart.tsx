"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { getChartData } from "@/lib/mockData";
import { motion } from "framer-motion";

export function CompetitorRadarChart() {
  const data = getChartData();
  
  // Transform data for radar chart
  const radarData = [
    {
      metric: "Rating",
      ...Object.fromEntries(data.map(d => [d.name, d.rating]))
    },
    {
      metric: "Value Index",
      ...Object.fromEntries(data.map(d => [d.name, d.valueIndex]))
    },
    {
      metric: "Staff Score",
      ...Object.fromEntries(data.map(d => [d.name, d.staffScore]))
    },
    {
      metric: "Amenity Score",
      ...Object.fromEntries(data.map(d => [d.name, d.amenityScore]))
    }
  ];

  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="w-full rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Performance Radar</CardTitle>
          <CardDescription>
            Compare key metrics across competitors (normalized scores)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              {data.map((competitor, idx) => (
                <Radar
                  key={competitor.name}
                  name={competitor.name}
                  dataKey={competitor.name}
                  stroke={colors[idx]}
                  fill={colors[idx]}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

