"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CompetitorSnapshot {
  id: string;
  placeId: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  gelPrice: number;
  pedicurePrice: number;
  acrylicPrice: number;
  distanceMiles: number;
  competitiveScore: number;
  snapshotDate: string;
}

interface SearchHistory {
  id: string;
  searchAddress: string;
  latitude: number;
  longitude: number;
  radiusMiles: number;
  competitorCount: number;
  searchDate: string;
  avgRating: number;
  avgGelPrice: number;
  avgPedicurePrice: number;
  avgAcrylicPrice: number;
  snapshots: CompetitorSnapshot[];
}

interface HistoricalTrackingDashboardProps {
  currentSearchLocation?: { lat: number; lng: number };
}

export function HistoricalTrackingDashboard({ currentSearchLocation }: HistoricalTrackingDashboardProps) {
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  useEffect(() => {
    fetchSearchHistory();
  }, [currentSearchLocation]);

  const fetchSearchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/history/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 10,
          latitude: currentSearchLocation?.lat,
          longitude: currentSearchLocation?.lng,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure data.data is an array
        const historyData = Array.isArray(data.data) ? data.data : [];
        setHistory(historyData);
      } else {
        console.warn("Failed to fetch history, status:", response.status);
        setHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch search history:", error);
      setHistory([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for market trends
  const marketTrendsData = Array.isArray(history) 
    ? history.map((h) => ({
        date: new Date(h.searchDate).toLocaleDateString(),
        avgRating: parseFloat(h.avgRating?.toString() || "0"),
        avgGelPrice: parseFloat(h.avgGelPrice?.toString() || "0"),
        competitors: h.competitorCount,
      })).reverse()
    : [];

  // Prepare competitor-specific trend data
  const getCompetitorTrend = (placeId: string) => {
    const competitorData: { date: string; rating: number; reviewCount: number; gelPrice: number }[] = [];
    
    history.forEach((search) => {
      const snapshot = search.snapshots.find((s) => s.placeId === placeId);
      if (snapshot) {
        competitorData.push({
          date: new Date(search.searchDate).toLocaleDateString(),
          rating: snapshot.rating,
          reviewCount: snapshot.reviewCount,
          gelPrice: snapshot.gelPrice,
        });
      }
    });

    return competitorData.reverse();
  };

  // Get unique competitors across all searches
  const uniqueCompetitors = Array.from(
    new Set(history.flatMap((h) => h.snapshots.map((s) => s.placeId)))
  ).map((placeId) => {
    const snapshot = history
      .flatMap((h) => h.snapshots)
      .find((s) => s.placeId === placeId);
    return snapshot;
  }).filter(Boolean) as CompetitorSnapshot[];

  if (loading) {
    return (
      <Card className="w-full bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading historical data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="w-full bg-white border border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-bold text-gray-900">Historical Tracking</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <p className="mb-2">No historical data available yet.</p>
            <p className="text-sm">Search history will appear here after your first search is saved.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white border border-gray-200">
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-bold text-gray-900">Historical Market Analysis</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Tracking {history.length} previous searches with longitudinal competitive trends
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Market Trends Chart */}
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-3">Market Trend Analysis</h3>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={marketTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "6px" }}
                  labelStyle={{ color: "#111827", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgRating" 
                  stroke="#E6863B" 
                  name="Avg Rating" 
                  strokeWidth={2}
                  dot={{ fill: "#E6863B", r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgGelPrice" 
                  stroke="#2CA02C" 
                  name="Avg Gel Price ($)" 
                  strokeWidth={2}
                  dot={{ fill: "#2CA02C", r: 4 }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="competitors" 
                  stroke="#9467BD" 
                  name="Competitor Count" 
                  strokeWidth={2}
                  dot={{ fill: "#9467BD", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            <strong>Analysis:</strong> Longitudinal tracking reveals market quality trends ({marketTrendsData[0]?.avgRating?.toFixed(2)} → {marketTrendsData[marketTrendsData.length - 1]?.avgRating?.toFixed(2)} stars), 
            pricing dynamics, and competitive density evolution over {history.length} search iterations.
          </p>
        </section>

        {/* Search History Table */}
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-3">Search History Log</h3>
          <div className="bg-gray-50 border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="text-left p-2 font-bold text-gray-900">Date</th>
                  <th className="text-left p-2 font-bold text-gray-900">Location</th>
                  <th className="text-center p-2 font-bold text-gray-900">Radius</th>
                  <th className="text-center p-2 font-bold text-gray-900">Competitors</th>
                  <th className="text-center p-2 font-bold text-gray-900">Avg Rating</th>
                  <th className="text-center p-2 font-bold text-gray-900">Avg Gel Price</th>
                </tr>
              </thead>
              <tbody>
                {history.map((search) => (
                  <tr key={search.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="p-2 text-gray-700">
                      {new Date(search.searchDate).toLocaleDateString()} {new Date(search.searchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-2 text-gray-700">{search.searchAddress}</td>
                    <td className="text-center p-2 text-gray-700">{search.radiusMiles} mi</td>
                    <td className="text-center p-2 text-gray-700">{search.competitorCount}</td>
                    <td className="text-center p-2">
                      <Badge className="bg-gray-700 text-white text-xs">{search.avgRating?.toFixed(2)}</Badge>
                    </td>
                    <td className="text-center p-2 text-gray-700">${search.avgGelPrice?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Competitor-Specific Tracking */}
        {uniqueCompetitors.length > 0 && (
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3">Competitor-Specific Trend Analysis</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {uniqueCompetitors.slice(0, 10).map((competitor) => (
                  <button
                    key={competitor.placeId}
                    onClick={() => setSelectedCompetitor(competitor.placeId === selectedCompetitor ? null : competitor.placeId)}
                    className={`px-3 py-1 text-xs border rounded ${
                      selectedCompetitor === competitor.placeId
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {competitor.name}
                  </button>
                ))}
              </div>

              {selectedCompetitor && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={getCompetitorTrend(selectedCompetitor)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#6B7280" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "11px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#E6863B" 
                        name="Rating" 
                        strokeWidth={2}
                        dot={{ fill: "#E6863B", r: 3 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="reviewCount" 
                        stroke="#9467BD" 
                        name="Reviews" 
                        strokeWidth={2}
                        dot={{ fill: "#9467BD", r: 3 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="gelPrice" 
                        stroke="#2CA02C" 
                        name="Gel Price ($)" 
                        strokeWidth={2}
                        dot={{ fill: "#2CA02C", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Interpretation:</strong> Individual competitor tracking enables identification of quality trajectory, 
                    pricing adjustments, and review accumulation velocity.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Summary Statistics */}
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-3">Historical Summary</h3>
          <div className="bg-gray-50 border-l-4 border-gray-900 p-4">
            <p className="text-xs leading-relaxed text-gray-700">
              <strong>Total Searches:</strong> {history.length} searches conducted
              {history.length > 1 && (
                <>
                  {" · "}
                  <strong>Time Span:</strong> {new Date(history[history.length - 1].searchDate).toLocaleDateString()} to {new Date(history[0].searchDate).toLocaleDateString()}
                </>
              )}
              {" · "}
              <strong>Unique Competitors Tracked:</strong> {uniqueCompetitors.length}
              {" · "}
              <strong>Average Market Quality:</strong> {(history.reduce((sum, h) => sum + parseFloat(h.avgRating?.toString() || "0"), 0) / history.length).toFixed(2)} stars
            </p>
          </div>
        </section>

      </CardContent>
    </Card>
  );
}

