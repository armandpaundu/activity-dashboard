"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ActivityRecord } from "@/lib/types";
import { DashboardShell } from "./DashboardShell";
import { SidebarFilters } from "./SidebarFilters";
import { KPIGrid } from "./KPIGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssuesPanel } from "./IssuesPanel";
import { TimeAllocation } from "./Charts/TimeAllocation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductivityTrend } from "./Charts/ProductivityTrend";
import { ActivityTable } from "./ActivityTable";
import { isSameMonth, isSameDay, subMonths, subDays } from "date-fns";
import { calculateTimeMetrics, calculateVolumeMetrics } from "@/lib/metrics-engine";
import { CategoryDistribution } from "./Charts/CategoryDistribution";
import { ActivityHeatmap } from "./Charts/ActivityHeatmap";
import { WeeklyTrend } from "./Charts/WeeklyTrend";
import { ProjectPerformanceTable } from "./ProjectPerformanceTable";
import { ExportButton } from "./ExportButton";
import { BehaviorTrend } from "./Charts/BehaviorTrend";
import { DurationHistogram } from "./Charts/DurationHistogram";
import { FragmentationTrend } from "./Charts/FragmentationTrend";
import { ProductivityKPIs } from "./ProductivityKPIs";
import { EmployeeDrilldown } from "./Drilldowns/EmployeeDrilldown";
import { ProjectDrilldown } from "./Drilldowns/ProjectDrilldown";

interface DashboardClientProps {
    initialData: ActivityRecord[];
    lastUpdated: string;
    parsingErrors?: { row: number; message: string; data: any }[];
}

export function DashboardClient({ initialData, lastUpdated, parsingErrors = [] }: DashboardClientProps) {
    const searchParams = useSearchParams();

    // Extract Filter Params
    const rangeParam = searchParams.get("range") || "this_month";
    const employeeParam = searchParams.get("employee") || "all";
    const projectParam = searchParams.get("project") || "all";
    const categoryParam = searchParams.get("category") || "all";
    const searchParam = searchParams.get("search") || "";

    // Unique values for dropdowns
    const employees = useMemo(() => Array.from(new Set(initialData.map(r => r.employee))).sort(), [initialData]);
    const projects = useMemo(() => Array.from(new Set(initialData.map(r => r.project))).sort(), [initialData]);
    const categories = useMemo(() => Array.from(new Set(initialData.map(r => r.category))).sort(), [initialData]);

    // Filtering Logic
    const filteredData = useMemo(() => {
        // Use lastUpdated as the stable 'now' reference to ensure Server/Client consistency
        const now = new Date(lastUpdated);

        return initialData.filter((record) => {
            // 1. Search (Description)
            if (searchParam && !record.description.toLowerCase().includes(searchParam.toLowerCase())) {
                return false;
            }

            // 2. Employee
            if (employeeParam !== "all" && record.employee !== employeeParam) {
                return false;
            }

            // 3. Project
            if (projectParam !== "all" && record.project !== projectParam) {
                return false;
            }

            // 4. Category
            if (categoryParam !== "all" && record.category !== categoryParam) {
                return false;
            }

            // 5. Date Range
            const recordDate = new Date(record.start);
            if (rangeParam === "this_month") {
                return isSameMonth(recordDate, now);
            }
            if (rangeParam === "last_month") {
                return isSameMonth(recordDate, subMonths(now, 1));
            }
            if (rangeParam === "last_7_days") {
                const sevenDaysAgo = subDays(now, 7);
                return recordDate >= sevenDaysAgo && recordDate <= now;
            }
            if (rangeParam === "last_30_days") {
                const thirtyDaysAgo = subDays(now, 30);
                return recordDate >= thirtyDaysAgo && recordDate <= now;
            }

            return true; // "all" or unknown range
        });
    }, [initialData, rangeParam, employeeParam, projectParam, categoryParam, searchParam, lastUpdated]);

    // Compute Metrics
    const metrics = useMemo(() => {
        const time = calculateTimeMetrics(filteredData);
        const volume = calculateVolumeMetrics(filteredData);
        return { time, volume };
    }, [filteredData]);

    // Derive Top Project for KPI
    const topProject = useMemo(() => {
        const projects = metrics.time.hoursByProject;
        const sorted = Object.entries(projects).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? { name: sorted[0][0], hours: sorted[0][1] } : null;
    }, [metrics.time.hoursByProject]);

    // Sidebar State with Persistence
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("sidebarOpen");
        if (stored !== null) {
            setIsSidebarOpen(stored === "true");
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarOpen;
        setIsSidebarOpen(newState);
        localStorage.setItem("sidebarOpen", String(newState));
    };

    return (
        <div className="min-h-screen bg-background flex font-sans text-foreground overflow-hidden">
            {/* Left Sidebar */}
            <aside
                className={cn(
                    "flex-shrink-0 bg-sidebar border-r border-sidebar-border h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "w-[260px]" : "w-0 border-r-0"
                )}
            >
                <div className="w-[260px]">
                    <SidebarFilters
                        employees={employees}
                        projects={projects}
                        categories={categories}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen relative transition-all duration-300 bg-[#0B1020]">

                {/* Sidebar Toggle Button */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSidebar}
                    className="absolute left-4 top-4 z-10 h-8 w-8 bg-card border-border text-muted-foreground hover:text-primary hover:border-primary shadow-lg hover:shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all"
                    title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <div className={cn("p-8 pt-16 transition-all duration-300", !isSidebarOpen && "container mx-auto max-w-[1600px]")}>

                    {/* Header */}
                    <div className="mb-8 p-6">
                        <h1 className="page-title">
                            Data Analytics Department - Activity Monitoring Dashboard
                        </h1>
                        <p className="page-subtitle">
                            Activity insights based on logged records
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
                            <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Last updated: <span suppressHydrationWarning>{new Date(lastUpdated).toLocaleString()}</span>
                            </p>
                            <div className="flex items-center gap-3">
                                <ExportButton data={filteredData} />
                            </div>
                        </div>
                    </div>

                    <IssuesPanel issues={parsingErrors} />

                    {/* Main Canvas Card */}
                    <div className="bg-[#0B1020] rounded-xl border border-border p-8 shadow-none min-h-[500px]">
                        <Tabs defaultValue="summary" className="space-y-8">
                            <div className="border-b border-border/40">
                                <TabsList className="bg-transparent p-0 space-x-8">
                                    <TabsTrigger
                                        value="summary"
                                        className="glow-underline-container rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-transparent data-[state=active]:text-foreground bg-transparent transition-all"
                                    >
                                        Summary
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="time"
                                        className="glow-underline-container rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-transparent data-[state=active]:text-foreground bg-transparent transition-all"
                                    >
                                        Time Allocation
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="productivity"
                                        className="glow-underline-container rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-transparent data-[state=active]:text-foreground bg-transparent transition-all"
                                    >
                                        Productivity
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="drilldowns"
                                        className="glow-underline-container rounded-none border-b-2 border-transparent px-2 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-transparent data-[state=active]:text-foreground bg-transparent transition-all"
                                    >
                                        Drilldowns
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="summary" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">
                                <KPIGrid
                                    totalHours={metrics.time.totalHours}
                                    netWorkingHours={metrics.time.netWorkingHours}
                                    weekdayOvertimeHours={metrics.time.weekdayOvertimeHours}
                                    weekendWorkHours={metrics.time.weekendWorkHours}
                                    workDuringLunchHours={metrics.time.workDuringLunchHours}
                                    activeHoursPerDay={metrics.time.avgHoursPerDay} // Mapping Net/Workday here
                                    topProject={topProject}
                                    totalTasks={metrics.volume.totalCount}
                                    meetingRatio={metrics.time.totalHours ? metrics.time.meetingHours / metrics.time.totalHours : 0}
                                    plannedRatio={metrics.time.totalHours ? metrics.time.plannedHours / metrics.time.totalHours : 0}
                                />
                                <div className="grid gap-6 md:grid-cols-2">
                                    <ChartCard title="Top 5 Projects (Hours)">
                                        <TimeAllocation data={filteredData} limit={5} />
                                    </ChartCard>
                                    <ChartCard title="Daily Activity Trend">
                                        <ProductivityTrend data={filteredData} />
                                    </ChartCard>
                                </div>
                            </TabsContent>

                            <TabsContent value="time" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <ChartCard title="Time by Project (Top 10)" height="h-[400px]">
                                            <TimeAllocation data={filteredData} limit={10} />
                                        </ChartCard>
                                        <ChartCard title="Time by Category" height="h-[400px]">
                                            <CategoryDistribution data={filteredData} />
                                        </ChartCard>
                                    </div>

                                    <ChartCard title="Activity Density Heatmap" subtitle="Distribution of tasks by Day and Hour (Jakarta Time)">
                                        <ActivityHeatmap data={filteredData} />
                                    </ChartCard>

                                    <ChartCard title="Weekly Hours Trend">
                                        <WeeklyTrend data={filteredData} />
                                    </ChartCard>

                                    <ChartCard title="Project Performance Details" height="auto">
                                        <ProjectPerformanceTable data={filteredData} />
                                    </ChartCard>
                                </div>
                            </TabsContent>

                            <TabsContent value="productivity" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">
                                <ProductivityKPIs
                                    medianDuration={metrics.time.medianDurationPerTask}
                                    fragmentationIndex={metrics.time.fragmentationIndex}
                                    deepWorkRatio={metrics.time.deepWorkRatio}
                                    overtimeHours={metrics.time.weekdayOvertimeHours}
                                />

                                <ChartCard title="Daily Behavior Pattern" subtitle="Clock-in, Clock-out, and Break Durations." height="h-[400px]">
                                    <BehaviorTrend data={filteredData} />
                                </ChartCard>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <ChartCard title="Task Duration Distribution">
                                        <DurationHistogram data={filteredData} />
                                    </ChartCard>
                                    <ChartCard title="Fragmentation Trend (Weekly)" subtitle="% of tasks under 30 minutes">
                                        <FragmentationTrend data={filteredData} />
                                    </ChartCard>
                                </div>
                            </TabsContent>

                            <TabsContent value="drilldowns" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">
                                <Tabs defaultValue="employee" className="w-full">
                                    <div className="mb-6">
                                        <TabsList className="bg-[rgba(14,22,48,0.35)] p-1 border border-[rgba(140,170,255,0.18)] rounded-xl backdrop-blur-md">
                                            <TabsTrigger
                                                value="employee"
                                                className="data-[state=active]:bg-[rgba(255,106,0,0.10)] data-[state=active]:text-[#EAF0FF] data-[state=active]:border data-[state=active]:border-[rgba(255,106,0,0.28)] data-[state=active]:shadow-[0_0_0_1px_rgba(255,106,0,0.25),0_0_14px_rgba(255,106,0,0.10)] text-[rgba(234,240,255,0.68)] hover:text-[#EAF0FF] rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                                            >
                                                Employee
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="project"
                                                className="data-[state=active]:bg-[rgba(255,106,0,0.10)] data-[state=active]:text-[#EAF0FF] data-[state=active]:border data-[state=active]:border-[rgba(255,106,0,0.28)] data-[state=active]:shadow-[0_0_0_1px_rgba(255,106,0,0.25),0_0_14px_rgba(255,106,0,0.10)] text-[rgba(234,240,255,0.68)] hover:text-[#EAF0FF] rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                                            >
                                                Project
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="full_log"
                                                className="data-[state=active]:bg-[rgba(255,106,0,0.10)] data-[state=active]:text-[#EAF0FF] data-[state=active]:border data-[state=active]:border-[rgba(255,106,0,0.28)] data-[state=active]:shadow-[0_0_0_1px_rgba(255,106,0,0.25),0_0_14px_rgba(255,106,0,0.10)] text-[rgba(234,240,255,0.68)] hover:text-[#EAF0FF] rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                                            >
                                                Full Activity Log
                                            </TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="employee" className="mt-4 focus-visible:outline-none">
                                        <EmployeeDrilldown data={filteredData} employees={employees} />
                                    </TabsContent>

                                    <TabsContent value="project" className="mt-4 focus-visible:outline-none">
                                        <ProjectDrilldown data={filteredData} projects={projects} />
                                    </TabsContent>

                                    <TabsContent value="full_log" className="mt-4 focus-visible:outline-none">
                                        <div className="rounded-xl border border-[rgba(140,170,255,0.18)] bg-[#0E1630]">
                                            <div className="p-6 border-b border-[rgba(140,170,255,0.18)] flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-[#EAF0FF] glow-text">Detailed Activity Log</h3>
                                                    <p className="text-sm text-muted-foreground">Individual records matching your filters.</p>
                                                </div>
                                                <div className="text-xs font-semibold uppercase tracking-wider bg-[#F05A28]/10 text-[#F05A28] px-3 py-1 rounded-full">
                                                    {filteredData.length} records
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <ActivityTable data={filteredData} />
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main >
        </div >
    );
}

function ChartCard({ title, subtitle, children, height = "h-[300px]" }: { title: string; subtitle?: string; children: React.ReactNode; height?: string }) {
    return (
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-none hover:border-border/60 transition-colors">
            <div className="glass-panel border-b-0 rounded-t-xl p-6 border-b border-white/5">
                <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">{title}</h3>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <div className={`p-6 ${height}`}>
                {children}
            </div>
        </div>
    );
}
