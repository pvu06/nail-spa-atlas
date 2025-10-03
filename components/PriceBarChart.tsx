"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getPriceChartData } from "@/lib/mockData";
import { motion } from "framer-motion";

export function PriceBarChart() {
  const data = getPriceChartData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="w-full rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Service Pricing Comparison</CardTitle>
          <CardDescription>
            Compare prices for key services across all competitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value) => `$${value}`}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="gel" fill="#8b5cf6" name="Gel Manicure" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pedicure" fill="#3b82f6" name="Pedicure" radius={[8, 8, 0, 0]} />
              <Bar dataKey="acrylic" fill="#10b981" name="Acrylic" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

