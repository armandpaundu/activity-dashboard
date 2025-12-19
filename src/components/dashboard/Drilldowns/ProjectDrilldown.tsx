"use client";

import React, { useState, useMemo } from "react";
import { ActivityRecord } from "@/lib/types";
import { calculateProjectStats } from "@/lib/metrics-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeeklyTrend } from "../Charts/WeeklyTrend";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "../KpiCard";
import { Clock, Users } from "lucide-react";

interface ProjectDrilldownProps {
    data: ActivityRecord[];
    projects: string[];
}

export function ProjectDrilldown({ data, projects }: ProjectDrilldownProps) {
    const [selectedProject, setSelectedProject] = useState<string>(projects[0] || "");

    const filteredData = useMemo(() => {
        return data.filter(r => r.project === selectedProject);
    }, [data, selectedProject]);

    const stats = useMemo(() => calculateProjectStats(filteredData), [filteredData]);
    const totalHours = filteredData.reduce((acc, r) => acc + r.durationMinutes / 60, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Select Project:</span>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-[200px] bg-[rgba(11,16,32,0.8)] border-[rgba(140,170,255,0.18)] text-[#EAF0FF]">
                        <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B1020] border-[rgba(140,170,255,0.18)] text-[#EAF0FF]">
                        {projects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>



            <div className="grid gap-4 md:grid-cols-2">
                <KpiCard
                    title="TOTAL PROJECT HOURS"
                    value={totalHours.toFixed(1)}
                    subtext="All contributors"
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                    tooltip={{
                        description: "Total logged hours attributed to this project in the selected period."
                    }}
                />
                <KpiCard
                    title="TEAM SIZE"
                    value={stats.contributors.length}
                    subtext="Active members"
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    tooltip={{
                        description: "Number of unique employees who contributed time to this project in the selected period."
                    }}
                />
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden h-[300px] p-4">
                <h3 className="font-semibold mb-4">Weekly Effort Trend</h3>
                <WeeklyTrend data={filteredData} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                    <div className="p-6 border-b bg-[rgba(140,170,255,0.06)]">
                        <h3 className="font-semibold text-[#EAF0FF]">Top Activities</h3>
                    </div>
                    <div className="p-0 max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader className="bg-[rgba(140,170,255,0.06)] sticky top-0">
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Count</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                </TableRow>
                            </TableHeader>
                            {/* Totals Footer for Top Activities */}
                            <TableBody>
                                {stats.topDescriptions.map((d, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium truncate max-w-[200px]" title={d.desc}>{d.desc}</TableCell>
                                        <TableCell className="text-right">{d.count}</TableCell>
                                        <TableCell className="text-right">{d.hours.toFixed(1)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-[#0B1020] border-t border-[rgba(140,170,255,0.18)] font-semibold hover:bg-[#0B1020] sticky bottom-0 z-10">
                                    <TableCell className="text-[#EAF0FF]">TOTAL</TableCell>
                                    <TableCell className="text-right text-[#EAF0FF]">{stats.topDescriptions.reduce((acc, d) => acc + d.count, 0)}</TableCell>
                                    <TableCell className="text-right text-[#EAF0FF]">{stats.topDescriptions.reduce((acc, d) => acc + d.hours, 0).toFixed(1)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                    <div className="p-6 border-b bg-[rgba(140,170,255,0.06)]">
                        <h3 className="font-semibold text-[#EAF0FF]">Contributors</h3>
                    </div>
                    <div className="p-0 max-h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className="text-right">Hours</TableHead>
                                    <TableHead className="w-[100px] text-right">% Share</TableHead>
                                </TableRow>
                            </TableHeader>
                            {/* Totals Footer for Contributors */}
                            <TableBody>
                                {stats.contributors.map((c) => (
                                    <TableRow key={c.name}>
                                        <TableCell className="font-medium">{c.name}</TableCell>
                                        <TableCell className="text-right">{c.hours.toFixed(1)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-muted-foreground">{(c.share * 100).toFixed(0)}%</span>
                                                <Progress value={c.share * 100} className="h-2 w-[50px]" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-[#0B1020] border-t border-[rgba(140,170,255,0.18)] font-semibold hover:bg-[#0B1020] sticky bottom-0 z-10">
                                    <TableCell className="text-[#EAF0FF]">TOTAL</TableCell>
                                    <TableCell className="text-right text-[#EAF0FF]">{stats.contributors.reduce((acc, c) => acc + c.hours, 0).toFixed(1)}</TableCell>
                                    <TableCell className="text-right"></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div >
        </div >
    );
}
