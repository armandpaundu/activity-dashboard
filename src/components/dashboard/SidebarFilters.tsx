"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";

interface SidebarFiltersProps {
    employees: string[];
    projects: string[];
    categories: string[];
}

export function SidebarFilters({ employees, projects, categories }: SidebarFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state for immediate UI feedback before URL update
    const [range, setRange] = useState(searchParams.get("range") || "this_month");
    const [employee, setEmployee] = useState(searchParams.get("employee") || "all");
    const [project, setProject] = useState(searchParams.get("project") || "all");
    const [category, setCategory] = useState(searchParams.get("category") || "all");
    const [search, setSearch] = useState(searchParams.get("search") || "");

    // Sync state with URL when URL changes (e.g. back button)
    useEffect(() => {
        setRange(searchParams.get("range") || "this_month");
        setEmployee(searchParams.get("employee") || "all");
        setProject(searchParams.get("project") || "all");
        setCategory(searchParams.get("category") || "all");
        setSearch(searchParams.get("search") || "");
    }, [searchParams]);

    // Helper to update URL
    const updateUrl = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "all") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    const handleReset = () => {
        setRange("this_month");
        setEmployee("all");
        setProject("all");
        setCategory("all");
        setSearch("");
        router.push(pathname, { scroll: false });
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (search) {
                params.set("search", search);
            } else {
                params.delete("search");
            }
            if (params.toString() !== searchParams.toString()) {
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, router, pathname, searchParams]);


    const hasFilters = range !== "this_month" || employee !== "all" || project !== "all" || category !== "all" || search;

    return (
        <div className="w-[260px] flex-shrink-0 glass-panel min-h-screen sticky top-0 self-start p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-sidebar-foreground flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" /> Filters
                </h2>
                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-transparent"
                    >
                        Reset
                    </Button>
                )}
            </div>

            <div className="space-y-4">

                {/* Search */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Keyword..."
                            className="pl-8 h-9 text-sm bg-sidebar-accent/50 border-sidebar-border focus-visible:ring-primary/50 text-sidebar-foreground placeholder:text-muted-foreground"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Date Range */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Range</Label>
                    <Select value={range} onValueChange={(val) => { setRange(val); updateUrl("range", val); }}>
                        <SelectTrigger className="w-full bg-sidebar-accent/50 border-sidebar-border focus:ring-primary/50 text-sidebar-foreground">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Employee */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</Label>
                    <Select value={employee} onValueChange={(val) => { setEmployee(val); updateUrl("employee", val); }}>
                        <SelectTrigger className="w-full bg-sidebar-accent/50 border-sidebar-border focus:ring-primary/50 text-sidebar-foreground">
                            <SelectValue placeholder="All Employees" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Project */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project</Label>
                    <Select value={project} onValueChange={(val) => { setProject(val); updateUrl("project", val); }}>
                        <SelectTrigger className="w-full bg-sidebar-accent/50 border-sidebar-border focus:ring-primary/50 text-sidebar-foreground">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                    <Select value={category} onValueChange={(val) => { setCategory(val); updateUrl("category", val); }}>
                        <SelectTrigger className="w-full bg-sidebar-accent/50 border-sidebar-border focus:ring-primary/50 text-sidebar-foreground">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

            </div>

            <div className="pt-8 text-xs text-muted-foreground border-t border-sidebar-border mt-auto">
                <p>Activity Dashboard v2.0</p>
                <p>&copy; 2024 Eigerindo</p>
            </div>
        </div>
    );
}
