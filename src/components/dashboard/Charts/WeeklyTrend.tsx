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
import { calculateWeeklyTrend } from "@/lib/metrics-engine";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface WeeklyTrendProps {
    data: ActivityRecord[];
}

export function WeeklyTrend({ data }: WeeklyTrendProps) {
    const chartData = useMemo(() => calculateWeeklyTrend(data), [data]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis />

                <Tooltip
                    content={<CustomChartTooltip valueFormatter={(val) => `${Number(val).toFixed(1)} hrs`} />}
                />
                <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
