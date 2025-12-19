"use client";

import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { ActivityRecord } from "@/lib/types";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface TimeAllocationProps {
    data: ActivityRecord[];
    limit?: number;
}

export function TimeAllocation({ data, limit = 10 }: TimeAllocationProps) {
    const chartData = useMemo(() => {
        const projectMinutes: Record<string, number> = {};
        data.forEach((record) => {
            // Use new field names (project, durationMinutes)
            projectMinutes[record.project] = (projectMinutes[record.project] || 0) + record.durationMinutes;
        });

        return Object.entries(projectMinutes)
            .map(([name, value]) => ({
                name,
                hours: value / 60
            }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, limit); // Top N projects
    }, [data]);

    // Neon Palette: Cyan, Purple, Orange, Lime, Pink
    const COLORS = ["#00F5FF", "#B026FF", "#FF6A00", "#B6FF00", "#FF2BD6", "#00F5FF"];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 16, right: 24, left: 24, bottom: 32 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(140, 170, 255, 0.1)" />
                <XAxis
                    type="number"
                    height={32}
                    tickMargin={8}
                    tick={{ fontSize: 13, fill: "rgba(234, 240, 255, 0.5)" }}
                    axisLine={{ stroke: "rgba(140, 170, 255, 0.1)" }}
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12, fill: "#EAF0FF" }}
                    axisLine={{ stroke: "rgba(140, 170, 255, 0.1)" }}
                />
                <Tooltip
                    content={<CustomChartTooltip
                        valueFormatter={(val: number) => `${Number(val).toFixed(1)} hrs`}
                    />}
                    cursor={{ fill: "rgba(140,170,255,0.05)" }}
                />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
