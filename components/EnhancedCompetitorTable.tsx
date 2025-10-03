"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Competitor } from "@/lib/mockData";
import { Star, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X } from "lucide-react";
import { motion } from "framer-motion";

interface EnhancedCompetitorTableProps {
  competitors: Competitor[];
}

type SortField = "name" | "rating" | "reviewCount" | "distanceMiles" | "gel" | "pedicure" | "acrylic";
type SortOrder = "asc" | "desc" | null;

export function EnhancedCompetitorTable({ competitors }: EnhancedCompetitorTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [priceFilter, setPriceFilter] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // Sorting logic
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    if (sortOrder === "asc") return <ArrowUp className="h-4 w-4 ml-1" />;
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Filtering and sorting
  const filteredAndSortedCompetitors = useMemo(() => {
    let result = [...competitors];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.amenities.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Price filter
    if (priceFilter.length > 0) {
      result = result.filter((c) => priceFilter.includes(c.priceRange));
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter((c) => c.rating >= minRating);
    }

    // Sorting
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let aVal: number | string;
        let bVal: number | string;

        if (sortField === "gel" || sortField === "pedicure" || sortField === "acrylic") {
          aVal = a.samplePrices[sortField];
          bVal = b.samplePrices[sortField];
        } else {
          aVal = a[sortField];
          bVal = b[sortField];
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc" 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        }

        const numA = typeof aVal === "number" ? aVal : 0;
        const numB = typeof bVal === "number" ? bVal : 0;
        return sortOrder === "asc" ? numA - numB : numB - numA;
      });
    }

    return result;
  }, [competitors, searchTerm, priceFilter, minRating, sortField, sortOrder]);

  const togglePriceFilter = (price: string) => {
    setPriceFilter((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPriceFilter([]);
    setMinRating(0);
    setSortField(null);
    setSortOrder(null);
  };

  const hasActiveFilters = searchTerm || priceFilter.length > 0 || minRating > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl font-bold">Competitor Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {filteredAndSortedCompetitors.length} of {competitors.length}
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 pt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or amenities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search competitors"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              {/* Price Range Filters */}
              {["$", "$$", "$$$"].map((price) => (
                <Button
                  key={price}
                  variant={priceFilter.includes(price) ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePriceFilter(price)}
                >
                  {price}
                </Button>
              ))}

              {/* Rating Filter */}
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Filter by minimum rating"
              >
                <option value="0">All Ratings</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("rating")}
                  >
                    <div className="flex items-center">
                      Rating {getSortIcon("rating")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("reviewCount")}
                  >
                    <div className="flex items-center">
                      Reviews {getSortIcon("reviewCount")}
                    </div>
                  </TableHead>
                  <TableHead className="font-bold">Price</TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("gel")}
                  >
                    <div className="flex items-center">
                      Gel {getSortIcon("gel")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("pedicure")}
                  >
                    <div className="flex items-center">
                      Pedicure {getSortIcon("pedicure")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("acrylic")}
                  >
                    <div className="flex items-center">
                      Acrylic {getSortIcon("acrylic")}
                    </div>
                  </TableHead>
                  <TableHead className="font-bold">Staff</TableHead>
                  <TableHead className="font-bold">Hours/wk</TableHead>
                  <TableHead className="font-bold">Amenities</TableHead>
                  <TableHead 
                    className="font-bold cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("distanceMiles")}
                  >
                    <div className="flex items-center">
                      Distance {getSortIcon("distanceMiles")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCompetitors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No competitors found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedCompetitors.map((competitor) => (
                    <TableRow
                      key={competitor.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          {competitor.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{competitor.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {competitor.reviewCount}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{competitor.priceRange}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${competitor.samplePrices.gel}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${competitor.samplePrices.pedicure}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${competitor.samplePrices.acrylic}
                      </TableCell>
                      <TableCell className="text-sm">
                        {competitor.staffBand}
                      </TableCell>
                      <TableCell className="text-sm">
                        {competitor.hoursPerWeek}h
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {competitor.amenities.map((amenity, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {competitor.distanceMiles} mi
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
