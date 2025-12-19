"use client";

import React, { useState, useMemo } from "react";
import { ActivityRecord } from "@/lib/types";
import { calculateTimeMetrics, calculateEmployeeDailyTimeline } from "@/lib/metrics-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryDistribution } from "../Charts/CategoryDistribution";
import { TimeAllocation } from "../Charts/TimeAllocation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "../KpiCard";
import { Clock, PieChart, Users, AlertTriangle } from "lucide-react";

interface EmployeeDrilldownProps {
    data: ActivityRecord[]; // Should be FULL data, filtering happens inside
    employees: string[];
}

export function EmployeeDrilldown({ data, employees }: EmployeeDrilldownProps) {
    const [selectedEmployee, setSelectedEmployee] = useState<string>(employees[0] || "");

    const filteredData = useMemo(() => {
        return data.filter(r => r.employee === selectedEmployee);
    }, [data, selectedEmployee]);

    const metrics = useMemo(() => calculateTimeMetrics(filteredData), [filteredData]);
    const timeline = useMemo(() => calculateEmployeeDailyTimeline(filteredData), [filteredData]);

    if (!selectedEmployee) return <div>No employee selected.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Select Employee:</span>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-[200px] bg-[rgba(11,16,32,0.8)] border-[rgba(140,170,255,0.18)] text-[#EAF0FF]">
                        <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B1020] border-[rgba(140,170,255,0.18)] text-[#EAF0FF]">
                        {employees.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>



            <div className="grid gap-4 md:grid-cols-4">
                <KpiCard
                    title="LOGGED HOURS"
                    value={metrics.totalHours.toFixed(1)}
                    subtext="Total duration"
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                    tooltip={{
                        description: "Total time recorded for the selected employee in the selected period (includes workday + overtime + weekend if present)."
                    }}
                />
                <KpiCard
                    title="AVG / WORKDAY"
                    value={metrics.avgHoursPerDay.toFixed(1)}
                    subtext="Mon-Fri (Net)"
                    icon={<Clock className="h-4 w-4 text-primary" />}
                    tooltip={{
                        description: "Average hours per workday (Mon–Fri) within the selected date range. Weekend work is tracked separately if needed."
                    }}
                />
                <KpiCard
                    title="MEETING RATIO"
                    value={`${((metrics.meetingHours / metrics.totalHours || 0) * 100).toFixed(0)}%`}
                    subtext="Of total time"
                    icon={<PieChart className="h-4 w-4 text-muted-foreground" />}
                    tooltip={{
                        description: "Percentage of the employee’s logged time classified as meetings."
                    }}
                />
                <KpiCard
                    title="OVERTIME TASKS"
                    value={metrics.overtimeCount}
                    subtext="Outside Work Hours"
                    icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                    tooltip={{
                        description: "Number of tasks that occurred outside normal work hours (before 08:00, after 17:00) or on weekends."
                    }}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden h-[300px] p-4">
                    <h3 className="font-semibold mb-4">Time by Category</h3>
                    <CategoryDistribution data={filteredData} />
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden h-[300px] p-4">
                    <h3 className="font-semibold mb-4">Top Projects</h3>
                    <TimeAllocation data={filteredData} limit={5} />
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6 border-b bg-[rgba(140,170,255,0.06)]">
                    <h3 className="font-semibold text-[#EAF0FF]">Daily Timeline</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>First Activity</TableHead>
                            <TableHead>Last Activity</TableHead>
                            <TableHead className="text-right">Logged Hours</TableHead>
                            <TableHead className="text-right">Break Hours</TableHead>
                            <TableHead className="text-right">Tasks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timeline.map((day) => (
                            <TableRow key={day.date}>
                                <TableCell className="font-medium">{day.date}</TableCell>
                                <TableCell>{day.firstActivity}</TableCell>
                                <TableCell>{day.lastActivity}</TableCell>
                                <TableCell className="text-right">{day.loggedHours.toFixed(1)}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{day.breakHours.toFixed(1)}</TableCell>
                                <TableCell className="text-right">{day.taskCount}</TableCell>
                            </TableRow>
                        ))}
                        {/* Totals Row */}
                        <TableRow className="bg-[#0B1020] border-t border-[rgba(140,170,255,0.18)] font-semibold hover:bg-[#0B1020]">
                            <TableCell colSpan={3} className="text-[#EAF0FF]">TOTAL</TableCell>
                            <TableCell className="text-right text-[#EAF0FF]">{timeline.reduce((acc, d) => acc + d.loggedHours, 0).toFixed(1)}</TableCell>
                            <TableCell className="text-right text-[#EAF0FF]">{timeline.reduce((acc, d) => acc + d.breakHours, 0).toFixed(1)}</TableCell>
                            <TableCell className="text-right text-[#EAF0FF]">{timeline.reduce((acc, d) => acc + d.taskCount, 0)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
