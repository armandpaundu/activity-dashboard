"use client";

import React, { useMemo } from "react";
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { ActivityRecord } from "@/lib/types";
import { calculateDailyBehaviorSeries } from "@/lib/metrics-engine";
import { format } from "date-fns";
import { CustomChartTooltip } from "./CustomChartTooltip";

interface BehaviorTrendProps {
    data: ActivityRecord[];
}

export function BehaviorTrend({ data }: BehaviorTrendProps) {
    const chartData = useMemo(() => calculateDailyBehaviorSeries(data), [data]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickFormatter={(val) => format(new Date(val), "MMM d")}
                    scale="point"
                />
                <YAxis
                    yAxisId="left"
                    label={{ value: 'Hour of Day (0-24)', angle: -90, position: 'insideLeft' }}
                    domain={[6, 22]} // Focus on typical work hours
                    allowDataOverflow={false}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Break Hours', angle: 90, position: 'insideRight' }}
                />

                <Tooltip
                    content={
                        <CustomChartTooltip
                            titleFormatter={(val) => format(new Date(val), "EEE, MMM d")}
                            valueFormatter={(value, name) => {
                                if (name === "Break Duration") return `${Number(value).toFixed(2)} hrs`;
                                const val = Number(value);
                                if (isNaN(val)) return String(value);

                                const h = Math.floor(val);
                                const m = Math.floor((val - h) * 60);
                                return `${h}:${m.toString().padStart(2, '0')}`;
                            }}
                        />
                    }
                />
                <Legend />
                <Bar yAxisId="right" dataKey="breakHours" name="Break Duration" fill="#8884d8" opacity={0.5} barSize={20} />
                <Line yAxisId="left" type="monotone" dataKey="clockIn" name="Clock In" stroke="#82ca9d" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="clockOut" name="Clock Out" stroke="#ff7300" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
