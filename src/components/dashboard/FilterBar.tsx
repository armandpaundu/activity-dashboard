"use client";

import * as React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterBarProps {
    employees: string[];
    projects: string[];
    selectedEmployee: string | "all";
    selectedProject: string | "all";
    onEmployeeChange: (value: string) => void;
    onProjectChange: (value: string) => void;
    onReset: () => void;
}

export function FilterBar({
    employees,
    projects,
    selectedEmployee,
    selectedProject,
    onEmployeeChange,
    onProjectChange,
    onReset,
}: FilterBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-lg border shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                        Employee
                    </label>
                    <Select
                        value={selectedEmployee}
                        onValueChange={onEmployeeChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Employees" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map((emp) => (
                                <SelectItem key={emp} value={emp}>
                                    {emp}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                        Project
                    </label>
                    <Select
                        value={selectedProject}
                        onValueChange={onProjectChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map((proj) => (
                                <SelectItem key={proj} value={proj}>
                                    {proj}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Placeholder for Date Range Picker - can be added later */}

                <div className="flex items-end">
                    {(selectedEmployee !== "all" || selectedProject !== "all") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Reset Filters
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
