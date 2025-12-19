"use client";

import React, { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { ActivityRecord } from "@/lib/types";
import { format } from "date-fns";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface ProductivityTrendProps {
    data: ActivityRecord[];
}

export function ProductivityTrend({ data }: ProductivityTrendProps) {
    const chartData = useMemo(() => {
        const dailyMinutes: Record<string, number> = {};

        data.forEach((record) => {
            const dateObj = new Date(record.start);
            const dateKey = format(dateObj, "yyyy-MM-dd");

            dailyMinutes[dateKey] = (dailyMinutes[dateKey] || 0) + record.durationMinutes;
        });

        return Object.entries(dailyMinutes)
            .map(([date, minutes]) => ({
                date,
                hours: minutes / 60
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(140, 170, 255, 0.1)" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "rgba(234, 240, 255, 0.5)" }}
                    axisLine={{ stroke: "rgba(140, 170, 255, 0.1)" }}
                    tickFormatter={(value) => {
                        try {
                            return format(new Date(value), "MMM d");
                        } catch {
                            return value;
                        }
                    }}
                />
                <YAxis tick={{ fill: "rgba(234, 240, 255, 0.5)" }} axisLine={{ stroke: "rgba(140, 170, 255, 0.1)" }} />
                <Tooltip
                    content={<CustomChartTooltip />}
                />
                <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#00F5FF"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0B1020", stroke: "#00F5FF", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#00F5FF", stroke: "#EAF0FF", strokeWidth: 2 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
