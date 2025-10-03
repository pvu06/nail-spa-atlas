"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getPriceChartData } from "@/lib/mockData";
import { motion } from "framer-motion";
import { Download, Eye, EyeOff } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export function EnhancedBarChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const data = getPriceChartData();
  const [visibleServices, setVisibleServices] = useState({
    gel: true,
    pedicure: true,
    acrylic: true,
  });

  const toggleService = (service: keyof typeof visibleServices) => {
    setVisibleServices(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const exportAsImage = async () => {
    if (!chartRef.current) return;
    
    try {
      toast.info("Generating image...");
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      
      const link = document.createElement("a");
      link.download = `price-chart-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Chart exported successfully!");
    } catch (error) {
      toast.error("Failed to export chart");
      console.error(error);
    }
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry) => (
            <p key={entry.name} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="w-full rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Service Pricing Comparison</CardTitle>
              <CardDescription>
                Compare prices for key services across all competitors
              </CardDescription>
            </div>
            <Button 
              onClick={exportAsImage} 
              variant="outline" 
              size="sm"
              aria-label="Export chart as image"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Service Toggle */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button
              variant={visibleServices.gel ? "default" : "outline"}
              size="sm"
              onClick={() => toggleService("gel")}
              className="text-xs"
              style={{
                backgroundColor: visibleServices.gel ? "#8b5cf6" : undefined,
                borderColor: "#8b5cf6",
              }}
            >
              {visibleServices.gel ? (
                <Eye className="h-3 w-3 mr-1" />
              ) : (
                <EyeOff className="h-3 w-3 mr-1" />
              )}
              Gel Manicure
            </Button>
            <Button
              variant={visibleServices.pedicure ? "default" : "outline"}
              size="sm"
              onClick={() => toggleService("pedicure")}
              className="text-xs"
              style={{
                backgroundColor: visibleServices.pedicure ? "#3b82f6" : undefined,
                borderColor: "#3b82f6",
              }}
            >
              {visibleServices.pedicure ? (
                <Eye className="h-3 w-3 mr-1" />
              ) : (
                <EyeOff className="h-3 w-3 mr-1" />
              )}
              Pedicure
            </Button>
            <Button
              variant={visibleServices.acrylic ? "default" : "outline"}
              size="sm"
              onClick={() => toggleService("acrylic")}
              className="text-xs"
              style={{
                backgroundColor: visibleServices.acrylic ? "#10b981" : undefined,
                borderColor: "#10b981",
              }}
            >
              {visibleServices.acrylic ? (
                <Eye className="h-3 w-3 mr-1" />
              ) : (
                <EyeOff className="h-3 w-3 mr-1" />
              )}
              Acrylic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {visibleServices.gel && (
                  <Bar dataKey="gel" fill="#8b5cf6" name="Gel Manicure" radius={[8, 8, 0, 0]} />
                )}
                {visibleServices.pedicure && (
                  <Bar dataKey="pedicure" fill="#3b82f6" name="Pedicure" radius={[8, 8, 0, 0]} />
                )}
                {visibleServices.acrylic && (
                  <Bar dataKey="acrylic" fill="#10b981" name="Acrylic" radius={[8, 8, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
