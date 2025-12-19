"use client";

import React, { useMemo, useState } from "react";
import { ActivityRecord } from "@/lib/types";
import { calculateProjectPerformance } from "@/lib/metrics-engine";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
    data: ActivityRecord[];
}

interface TaskStat {
    task: string;
    hours: number;
    count: number;
    share: number;
}

export function ProjectPerformanceTable({ data }: Props) {
    const rows = useMemo(() => calculateProjectPerformance(data), [data]);
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const [showAllTasks, setShowAllTasks] = useState<boolean>(false);

    // Toggle expansion - Single row expansion rule
    const toggleRow = (projectName: string) => {
        if (expandedProject === projectName) {
            setExpandedProject(null);
            setShowAllTasks(false); // Reset toggle on collapse
        } else {
            setExpandedProject(projectName);
            setShowAllTasks(false); // Reset toggle on new expansion
        }
    };

    // Calculate Task Breakdown for expanded project
    const taskBreakdown = useMemo(() => {
        if (!expandedProject) return [];

        const projectRecords = data.filter(r => r.project === expandedProject);
        const totalHours = projectRecords.reduce((acc, r) => acc + r.durationMinutes / 60, 0);

        const group: Record<string, { hours: number; count: number }> = {};

        projectRecords.forEach(r => {
            // Task is already normalized in ActivityRecord now (trim + fallback)
            const t = r.task || "Unspecified Task";
            if (!group[t]) group[t] = { hours: 0, count: 0 };
            group[t].hours += r.durationMinutes / 60;
            group[t].count += 1;
        });

        return Object.entries(group)
            .map(([task, stats]) => ({
                task,
                hours: stats.hours,
                count: stats.count,
                share: totalHours ? stats.hours / totalHours : 0
            }))
            .sort((a, b) => b.hours - a.hours);
    }, [data, expandedProject]);

    const visibleTasks = showAllTasks ? taskBreakdown.slice(0, 30) : taskBreakdown.slice(0, 10);

    // Calculate Parent Table Totals
    const totalHours = rows.reduce((acc, r) => acc + r.hours, 0);
    const totalActivity = rows.reduce((acc, r) => acc + r.count, 0);

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead className="text-foreground font-semibold">Project / Task</TableHead>
                        <TableHead className="text-right text-foreground font-semibold">Hours</TableHead>
                        <TableHead className="w-[120px] text-right text-foreground font-semibold">Share</TableHead>
                        <TableHead className="text-right text-foreground font-semibold">Activity</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <React.Fragment key={row.name}>
                            <TableRow
                                className="border-b border-border/40 cursor-pointer hover:bg-muted/30 transition-colors"
                                onClick={() => toggleRow(row.name)}
                            >
                                <TableCell className="py-3 pl-4">
                                    {expandedProject === row.name ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </TableCell>
                                <TableCell className="font-semibold text-foreground py-3">{row.name}</TableCell>
                                <TableCell className="text-right text-foreground font-semibold py-3">{row.hours.toFixed(1)}</TableCell>
                                <TableCell className="text-right py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-xs text-foreground font-semibold w-8 text-right">{(row.share * 100).toFixed(0)}%</span>
                                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                                                style={{ width: `${Math.min(row.share * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right text-foreground font-semibold py-3">{row.count}</TableCell>
                            </TableRow>

                            {/* Expanded Content - Inline Rows */}
                            {expandedProject === row.name && (
                                <>
                                    {visibleTasks.map((task, idx) => (
                                        <TableRow key={`${row.name}-task-${idx}`} className="bg-muted/5 hover:bg-muted/10 border-b border-border/20 transition-colors">
                                            <TableCell className="py-2" /> {/* Col 0: Chevron space */}
                                            <TableCell className="py-2 pl-2">
                                                <div className="flex items-center border-l-[3px] border-[#FF6A00] pl-3 py-1">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {task.task.length > 35 ? (
                                                            <TooltipProvider>
                                                                <Tooltip delayDuration={300}>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="truncate text-xs text-muted-foreground/80 cursor-help border-b border-dotted border-muted-foreground/50 max-w-[200px] md:max-w-[300px]">
                                                                            {task.task}
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="tooltip-glass max-w-[300px] break-words">
                                                                        {task.task}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground/80 truncate max-w-[200px] md:max-w-[300px]">{task.task}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2 text-xs font-mono text-muted-foreground">
                                                {task.hours.toFixed(1)}
                                            </TableCell>
                                            <TableCell className="text-right py-2">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs text-muted-foreground w-8 text-right">{(task.share * 100).toFixed(0)}%</span>
                                                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                                                            style={{ width: `${Math.min(task.share * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-2 pr-4 text-xs text-muted-foreground">
                                                {task.count}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {visibleTasks.length === 0 && (
                                        <TableRow className="bg-muted/5 border-b border-border/20">
                                            <TableCell />
                                            <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                                                No task data available.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Show All Toggle */}
                                    {taskBreakdown.length > 10 && (
                                        <TableRow className="bg-muted/5 hover:bg-muted/10 border-b border-border/20">
                                            <TableCell />
                                            <TableCell colSpan={4} className="text-center py-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowAllTasks(!showAllTasks); }}
                                                    className="text-[10px] uppercase font-semibold text-primary hover:text-primary/80 transition-colors"
                                                >
                                                    {showAllTasks ? "Show Less" : `Show All ${taskBreakdown.length} Tasks`}
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </React.Fragment>
                    ))}
                    {/* Parent Table TOTAL */}
                    <TableRow className="bg-[rgba(140,170,255,0.06)] border-t border-[rgba(140,170,255,0.18)] hover:bg-[rgba(140,170,255,0.08)]">
                        <TableCell colSpan={2} className="py-3 pl-4 font-bold text-[#EAF0FF]">TOTAL</TableCell>
                        <TableCell className="text-right font-bold text-[#EAF0FF] py-3">{totalHours.toFixed(1)}</TableCell>
                        <TableCell className="py-3" />
                        <TableCell className="text-right font-bold text-[#EAF0FF] py-3">{totalActivity}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
