"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Competitor } from "@/lib/mockData";
import { Star, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface CompetitorTableProps {
  competitors: Competitor[];
}

export function CompetitorTable({ competitors }: CompetitorTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Competitor Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Rating</TableHead>
                  <TableHead className="font-bold">Reviews</TableHead>
                  <TableHead className="font-bold">Price</TableHead>
                  <TableHead className="font-bold">Gel</TableHead>
                  <TableHead className="font-bold">Pedicure</TableHead>
                  <TableHead className="font-bold">Acrylic</TableHead>
                  <TableHead className="font-bold">Staff</TableHead>
                  <TableHead className="font-bold">Hours/wk</TableHead>
                  <TableHead className="font-bold">Amenities</TableHead>
                  <TableHead className="font-bold">Distance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitors.map((competitor) => (
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

