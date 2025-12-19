import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Briefcase, CheckCircle, PieChart, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface KPIGridProps {
    totalHours: number;
    netWorkingHours: number;
    weekdayOvertimeHours: number;
    weekendWorkHours: number;
    workDuringLunchHours: number;
    activeHoursPerDay: number;
    topProject: { name: string; hours: number } | null;
    totalTasks: number;
    meetingRatio: number; // 0-1
    plannedRatio: number; // 0-1
}

export function KPIGrid({
    totalHours, // This is raw total
    netWorkingHours,
    weekdayOvertimeHours,
    weekendWorkHours,
    workDuringLunchHours,
    activeHoursPerDay,
    topProject,
    totalTasks,
    meetingRatio,
    plannedRatio,
}: KPIGridProps) {
    const formatPercent = (val: number) => `${(val * 100).toFixed(0)}%`;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <KpiCard
                title="Total Logged"
                value={totalHours.toFixed(1)}
                subtext="Raw hours"
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                tooltip={{ description: "Total raw time recorded for all activities." }}
            />
            <KpiCard
                title="Net Working Hours"
                value={netWorkingHours.toFixed(1)}
                subtext="Mon-Fri 08-17 (Excl. Lunch)"
                icon={<Clock className="h-4 w-4 text-primary" />}
                tooltip={{ description: "Productive hours within the standard working window (08:00-12:00, 13:00-17:00) on weekdays." }}
            />
            <KpiCard
                title="Overtime (Weekday)"
                value={weekdayOvertimeHours.toFixed(1)}
                subtext="Outside 08-17"
                icon={<Clock className="h-4 w-4 text-red-500" />}
                tooltip={{ description: "Hours worked before 08:00 or after 17:00 on weekdays." }}
            />
            <KpiCard
                title="Weekend Work"
                value={weekendWorkHours.toFixed(1)}
                subtext="Sat / Sun"
                icon={<Clock className="h-4 w-4 text-purple-500" />}
                tooltip={{ description: "Total hours worked on Saturdays and Sundays." }}
            />
            <KpiCard
                title="Lunch Work"
                value={workDuringLunchHours.toFixed(1)}
                subtext="Mon-Fri 12-13"
                icon={<Clock className="h-4 w-4 text-yellow-500" />}
                tooltip={{ description: "Hours worked during the official lunch break (12:00-13:00)." }}
            />

            {/* 
            <KpiCard
                title="Avg Hours / Workday"
                value={activeHoursPerDay.toFixed(1)} // This is Net / Workdays
                subtext="Net hours (Mon-Fri)"
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                tooltip={{ description: "Average Net Working Hours per active workday." }}
            />
             */}

            {/* Re-adding previous useful KPIs if space permits or User removed them? 
                 User request: "Update KPI cards... clearly (e.g. Net Working Hours...)"
                 I replaced the top section. 
                 I should keep Meeting & Planned Ratio as they are valuable.
             */}

            <KpiCard
                title="Total Tasks"
                value={totalTasks}
                subtext="Activity count"
                icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
                tooltip={{ description: "Number of activity entries logged." }}
            />
            <KpiCard
                title="Meeting Ratio"
                value={formatPercent(meetingRatio)}
                subtext="Of total time"
                icon={<PieChart className="h-4 w-4 text-muted-foreground" />}
                tooltip={{ description: "Percentage of working time spent in meetings." }}
            />
            <KpiCard
                title="Planned Work"
                value={formatPercent(plannedRatio)}
                subtext="Strategic/Planned"
                icon={<Target className="h-4 w-4 text-muted-foreground" />}
                tooltip={{ description: "Percentage of time spent on planned versus unplanned activities." }}
            />
        </div>
    );
}

import { KpiCard, TooltipData } from "./KpiCard";

