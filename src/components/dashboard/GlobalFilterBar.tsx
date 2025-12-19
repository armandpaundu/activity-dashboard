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


// Since I don't have useDebounce hook file yet, I'll inline a simple effect or just trigger on blur/enter for search to keep it simple for now, 
// or implement a quick debounce logic. 
// Actually, let's just update URL on change with a small timeout or just use local state + effect.

interface GlobalFilterBarProps {
    employees: string[];
    projects: string[];
    categories: string[];
}

export function GlobalFilterBar({ employees, projects, categories }: GlobalFilterBarProps) {
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

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (search) {
                params.set("search", search);
            } else {
                params.delete("search");
            }
            // Only push if different to avoid redundant pushes
            if (params.toString() !== searchParams.toString()) {
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, router, pathname, searchParams]);

    const handleReset = () => {
        setRange("this_month");
        setEmployee("all");
        setProject("all");
        setCategory("all");
        setSearch("");
        router.push(pathname, { scroll: false });
    };

    return (
        <div className="sticky top-16 z-20 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 pt-2 mb-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar scroll-smooth">

                    {/* Date Range */}
                    <Select
                        value={range}
                        onValueChange={(val) => {
                            setRange(val);
                            updateUrl("range", val);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Employee */}
                    <Select
                        value={employee}
                        onValueChange={(val) => {
                            setEmployee(val);
                            updateUrl("employee", val);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Employees" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map((e) => (
                                <SelectItem key={e} value={e}>
                                    {e}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Project */}
                    <Select
                        value={project}
                        onValueChange={(val) => {
                            setProject(val);
                            updateUrl("project", val);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p} value={p}>
                                    {p}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Category */}
                    <Select
                        value={category}
                        onValueChange={(val) => {
                            setCategory(val);
                            updateUrl("category", val);
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Reset Button */}
                    {(range !== "this_month" || employee !== "all" || project !== "all" || category !== "all" || search) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            className="ml-auto sm:ml-0 rounded-full h-8 w-8"
                            title="Reset Filters"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Search Bar - Separate logic or part of the same row on desktop? 
            Let's keep it separate or integrated. Integrated below for better mobile view or side by side.
        */}
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search descriptions..."
                        className="pl-8 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
