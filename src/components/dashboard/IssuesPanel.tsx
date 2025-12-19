"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Issue {
    row: number;
    message: string;
    data: any;
}

interface IssuesPanelProps {
    issues: Issue[];
}

export function IssuesPanel({ issues }: IssuesPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (issues.length === 0) return null;

    return (
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
                <span>Data Quality Issues Found ({issues.length})</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </AlertTitle>
            <AlertDescription>
                Some rows could not be parsed correctly and were excluded.
                {isOpen && (
                    <div className="mt-4 max-h-[200px] overflow-auto border-t border-destructive/20 pt-2 text-xs font-mono">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="pb-1">Row</th>
                                    <th className="pb-1">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issues.map((issue, idx) => (
                                    <tr key={idx} className="border-t border-destructive/10">
                                        <td className="py-1 pr-4 align-top">{issue.row}</td>
                                        <td className="py-1 align-top">{issue.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AlertDescription>
        </Alert>
    );
}
