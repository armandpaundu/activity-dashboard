"use client";

import React, { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { ActivityRecord } from "@/lib/types";
import { calculateFragmentationTrend } from "@/lib/metrics-engine";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface FragmentationTrendProps {
    data: ActivityRecord[];
}

export function FragmentationTrend({ data }: FragmentationTrendProps) {
    const chartData = useMemo(() => calculateFragmentationTrend(data), [data]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    domain={[0, 1]}
                />

                <Tooltip content={<CustomChartTooltip valueFormatter={(val) => `${(Number(val) * 100).toFixed(1)}%`} />} />
                <Area type="monotone" dataKey="index" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
            </AreaChart>
        </ResponsiveContainer>
    );
}
