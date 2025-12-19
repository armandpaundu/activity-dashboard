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
    Cell
} from "recharts";
import { ActivityRecord } from "@/lib/types";
import { calculateDurationDistribution } from "@/lib/metrics-engine";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface DurationHistogramProps {
    data: ActivityRecord[];
}

export function DurationHistogram({ data }: DurationHistogramProps) {
    const chartData = useMemo(() => calculateDurationDistribution(data), [data]);
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />

                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(140,170,255,0.05)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
