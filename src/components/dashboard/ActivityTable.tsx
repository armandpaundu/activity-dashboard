"use client";

import React, { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityRecord } from "@/lib/types";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ActivityTableProps {
    data: ActivityRecord[];
}

type SortField = "start" | "employee" | "project" | "category" | "durationMinutes";
type SortDirection = "asc" | "desc";

export function ActivityTable({ data }: ActivityTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sortField, setSortField] = useState<SortField>("start");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [localSearch, setLocalSearch] = useState("");

    // Reset page when data changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const processedData = useMemo(() => {
        let processed = [...data];

        // Local Search (Optional, on top of global)
        if (localSearch) {
            const q = localSearch.toLowerCase();
            processed = processed.filter(r =>
                r.description.toLowerCase().includes(q) ||
                r.project.toLowerCase().includes(q) ||
                r.employee.toLowerCase().includes(q)
            );
        }

        // Sort
        processed.sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];

            // Special handling for date
            if (sortField === "start") {
                valA = new Date(a.start).getTime();
                valB = new Date(b.start).getTime();
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return processed;
    }, [data, sortField, sortDirection, localSearch]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = processedData.slice(startIndex, endIndex);

    const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
        return <ArrowUpDown className={cn("ml-2 h-4 w-4", sortDirection === "asc" ? "rotate-180" : "")} />;
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No activity records found.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Filter log..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="h-8 w-[200px] bg-[rgba(11,16,32,0.8)] border-[rgba(140,170,255,0.18)] text-[#EAF0FF] placeholder:text-[rgba(234,240,255,0.45)] focus-visible:ring-[rgba(0,245,255,0.45)]"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <Select
                        value={String(itemsPerPage)}
                        onValueChange={(v) => {
                            setItemsPerPage(Number(v));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px] bg-[rgba(11,16,32,0.8)] border-[rgba(140,170,255,0.18)] text-[#EAF0FF]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0B1020] border-[rgba(140,170,255,0.18)] text-[#EAF0FF]">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border border-[rgba(140,170,255,0.18)] overflow-hidden">
                <Table>
                    <TableHeader className="bg-[rgba(140,170,255,0.06)] sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("start")}>
                                <div className="flex items-center">Date <SortIcon field="start" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("employee")}>
                                <div className="flex items-center">Employee <SortIcon field="employee" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("project")}>
                                <div className="flex items-center">Project <SortIcon field="project" /></div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                                <div className="flex items-center">Category <SortIcon field="category" /></div>
                            </TableHead>
                            <TableHead className="w-[300px]">Description</TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => handleSort("durationMinutes")}>
                                <div className="flex items-center justify-end">Duration (h) <SortIcon field="durationMinutes" /></div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.map((record) => {
                            // Highlighting Logic
                            const isMeeting = record.category === "Meeting";
                            // Approx Jakarta Check for Overtime highlight
                            const jakartaHour = new Date(new Date(record.start).getTime() + 7 * 3600 * 1000).getUTCHours();
                            const isOvertime = jakartaHour >= 19;

                            return (
                                <TableRow
                                    key={record.id}
                                    className={cn(
                                        "hover:bg-[rgba(0,245,255,0.06)] border-b border-[rgba(140,170,255,0.12)] transition-colors data-[state=selected]:bg-[rgba(0,245,255,0.1)]",
                                        isMeeting && "bg-yellow-500/10 hover:bg-yellow-500/20",
                                        isOvertime && !isMeeting && "bg-red-500/10 hover:bg-red-500/20"
                                    )}
                                >
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(new Date(record.start), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell>{record.employee}</TableCell>
                                    <TableCell>{record.project}</TableCell>
                                    <TableCell>
                                        <div className="inline-flex items-center rounded-full border border-[rgba(255,106,0,0.28)] bg-[rgba(255,106,0,0.12)] px-2.5 py-0.5 text-xs font-semibold text-[#FF6A00] shadow-[0_0_10px_rgba(255,106,0,0.1)]">
                                            {record.category}
                                        </div>
                                    </TableCell>
                                    <TableCell className="truncate max-w-[300px] text-[rgba(234,240,255,0.78)]" title={record.description}>
                                        {record.description}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {(record.durationMinutes / 60).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {/* Filtered Totals Row */}
                        <TableRow className="bg-[#0B1020] border-t-2 border-[rgba(140,170,255,0.25)] font-bold hover:bg-[#0B1020]">
                            <TableCell colSpan={5} className="text-[#EAF0FF] text-right pr-4 uppercase tracking-wider text-xs">
                                Filtered Total ({processedData.length} records)
                            </TableCell>
                            <TableCell className="text-right text-[#EAF0FF] font-mono text-base">
                                {(processedData.reduce((sum, r) => sum + r.durationMinutes, 0) / 60).toFixed(2)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, processedData.length)} of {processedData.length} records
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                        Page {currentPage} / {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
