"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ActivityRecord } from "@/lib/types";
import { classifyActivity } from "@/lib/classification";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface CategoryDistributionProps {
    data: ActivityRecord[];
}

export function CategoryDistribution({ data }: CategoryDistributionProps) {
    const chartData = useMemo(() => {
        const byCat: Record<string, number> = {};
        data.forEach(r => {
            const cat = classifyActivity(r.description); // or r.category if we trust it
            byCat[cat] = (byCat[cat] || 0) + r.durationMinutes;
        });

        return Object.entries(byCat)
            .map(([name, min]) => ({ name, value: min / 60 }))
            .sort((a, b) => b.value - a.value);
    }, [data]);

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>

                <Tooltip content={<CustomChartTooltip valueFormatter={(val) => `${Number(val).toFixed(1)} hrs`} />} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
