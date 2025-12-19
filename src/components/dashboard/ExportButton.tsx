"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ActivityRecord } from "@/lib/types";
import { format } from "date-fns";
import Papa from "papaparse";

interface ExportButtonProps {
    data: ActivityRecord[];
}

export function ExportButton({ data }: ExportButtonProps) {
    const handleExport = () => {
        if (!data.length) return;

        // Flatten data for CSV
        const csvData = data.map(r => ({
            ID: r.id,
            Employee: r.employee,
            Project: r.project,
            Category: r.category,
            Description: r.description,
            Start: format(r.start, "yyyy-MM-dd HH:mm:ss"),
            End: format(r.end, "yyyy-MM-dd HH:mm:ss"),
            DurationMinutes: r.durationMinutes,
            DurationHours: (r.durationMinutes / 60).toFixed(2)
        }));

        const csvString = Papa.unparse(csvData);
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `activity_export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0} className="glow-pulse border-primary/50 text-foreground hover:text-primary hover:border-primary">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    );
}
