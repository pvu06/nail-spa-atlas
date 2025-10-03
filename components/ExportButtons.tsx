"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface ExportButtonsProps {
  onExport?: (format: "csv" | "pdf") => void;
}

export function ExportButtons({ onExport }: ExportButtonsProps) {
  const handleExportCSV = () => {
    if (onExport) {
      onExport("csv");
    } else {
      alert("CSV export functionality - coming soon!");
    }
  };

  const handleExportPDF = () => {
    if (onExport) {
      onExport("pdf");
    } else {
      alert("PDF export functionality - coming soon!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="flex flex-wrap gap-4 justify-center md:justify-start"
    >
      <Button onClick={handleExportCSV} variant="outline" size="lg">
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button onClick={handleExportPDF} variant="outline" size="lg">
        <FileText className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </motion.div>
  );
}

