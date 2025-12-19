"use client";

import React, { useMemo } from "react";
import { ActivityRecord } from "@/lib/types";
import { calculateHeatmapData, HeatmapPoint } from "@/lib/metrics-engine";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityHeatmapProps {
    data: ActivityRecord[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    const points = useMemo(() => calculateHeatmapData(data), [data]);

    // Find max value for normalization
    const maxVal = Math.max(...points.map(p => p.value), 1);

    const getOpacity = (val: number) => {
        return val === 0 ? 0.05 : 0.2 + (val / maxVal) * 0.8;
    };

    return (
        <div className="flex flex-col gap-2 w-full h-full overflow-auto">
            <div className="flex items-center">
                <div className="w-10"></div>
                <div className="flex-1 grid grid-cols-24 gap-0.5">
                    {HOURS.map(h => (
                        <div key={h} className="text-[10px] text-center text-muted-foreground">
                            {h % 3 === 0 ? h : ""}
                        </div>
                    ))}
                </div>
            </div>

            {DAYS.map((day, dIndex) => (
                <div key={day} className="flex items-center h-6">
                    <div className="w-10 text-xs font-medium text-muted-foreground">{day}</div>
                    <div className="flex-1 grid grid-cols-24 gap-0.5 h-full">
                        {HOURS.map(h => {
                            const point = points.find(p => p.dayOfWeek === dIndex && p.hourOfDay === h);
                            const val = point?.value || 0;
                            return (
                                <TooltipProvider key={h}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="w-full h-full rounded-sm bg-[#00F5FF] transition-opacity hover:opacity-100 shadow-[0_0_4px_rgba(0,245,255,0.3)]"
                                                style={{ opacity: getOpacity(val) }}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent className="tooltip-glass min-w-[120px]">
                                            <p className="tooltip-title text-primary text-center">{day} {h}:00</p>
                                            <div className="tooltip-row justify-center">
                                                <span className="tooltip-value">{val}</span>
                                                <span className="tooltip-label">entries</span>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
