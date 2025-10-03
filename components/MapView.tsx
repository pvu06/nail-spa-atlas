"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export function MapView() {
  return (
    <Card className="w-full h-full rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          <MapPin className="mr-2 h-5 w-5" />
          Location Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center space-y-2">
            <MapPin className="h-12 w-12 mx-auto text-gray-400" />
            <p className="text-gray-500 font-medium">Map View</p>
            <p className="text-sm text-gray-400">Interactive map placeholder</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

