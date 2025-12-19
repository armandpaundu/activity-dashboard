import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Scissors, BrainCircuit, Moon } from "lucide-react";

interface ProductivityKPIsProps {
    medianDuration: number;
    fragmentationIndex: number;
    deepWorkRatio: number;
    overtimeHours: number;
}

export function ProductivityKPIs({
    medianDuration,
    fragmentationIndex,
    deepWorkRatio,
    overtimeHours,
}: ProductivityKPIsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            <KpiCard
                title="Median Task"
                value={`${medianDuration.toFixed(0)}m`}
                subtext="Typical duration"
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                tooltip={{
                    description: "The middle value of task durations in the selected period.",
                    interpretation: "50% of tasks are shorter than this, and 50% are longer.",
                    insight: "Median is less affected by extreme outliers than an average."
                }}
            />
            <KpiCard
                title="Fragmentation"
                value={`${(fragmentationIndex * 100).toFixed(0)}%`}
                subtext="Tasks ≤ 30min"
                icon={<Scissors className="h-4 w-4 text-muted-foreground" />}
                tooltip={{
                    description: "Measures how much work is split into short, interrupted tasks. (Percentage of tasks 30m or shorter)",
                    interpretation: "Lower percentage indicates better focus and deeper work.",
                    insight: "A low value suggests good task consolidation and focus quality.",
                    badge: getFragmentationBadge(fragmentationIndex)
                }}
            />
            <KpiCard
                title="Deep Work"
                value={`${(deepWorkRatio * 100).toFixed(0)}%`}
                subtext="Tasks ≥ 120min"
                icon={<BrainCircuit className="h-4 w-4 text-muted-foreground" />}
                tooltip={{
                    description: "Percentage of tasks considered “deep work” (long, uninterrupted tasks). Deep work = tasks with duration ≥ 120 minutes (2 hours).",
                    interpretation: "Higher % usually means more focused execution time and fewer interruptions."
                }}
            />
            <KpiCard
                title="Overtime Hours"
                value={overtimeHours.toFixed(1)}
                subtext="Weekday > 17:00 / < 08:00"
                icon={<Moon className="h-4 w-4 text-red-400" />}
                tooltip={{
                    description: "Total hours logged outside normal work hours. Overtime includes time before 08:00 or after 17:00 on workdays, plus any time logged on weekends.",
                    insight: "Helps monitor workload pressure and after-hours work patterns."
                }}
            />
        </div>
    );
}

function getFragmentationBadge(val: number) {
    if (val < 0.2) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Focused (&lt;20%)</span>;
    if (val < 0.4) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Mixed (20-40%)</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Highly Fragmented (&gt;40%)</span>;
}

import { KpiCard } from "./KpiCard";
