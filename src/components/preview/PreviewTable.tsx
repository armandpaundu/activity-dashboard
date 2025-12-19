"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityRecord } from "@/lib/types";
import { ParsingResult } from "@/lib/normalization";
import { AlertCircle, CheckCircle, Smartphone, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface PreviewTableProps {
    data: ParsingResult;
}

export function PreviewTable({ data }: PreviewTableProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalRows}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Success</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div className="text-2xl font-bold">{data.records.length}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <div className="text-2xl font-bold">{data.errors.length}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Detected Columns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground break-words">
                            {data.detectedColumns.slice(0, 5).join(", ")}
                            {data.detectedColumns.length > 5 && ` +${data.detectedColumns.length - 5} more`}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {data.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Parsing Errors ({data.errors.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {data.errors.slice(0, 10).map((err, i) => (
                                <div key={i} className="text-sm text-red-600 border-b border-red-100 last:border-0 pb-1">
                                    <span className="font-semibold">Row {err.row}:</span> {err.message}
                                </div>
                            ))}
                            {data.errors.length > 10 && (
                                <div className="text-sm text-red-600 font-medium pt-2">
                                    ...and {data.errors.length - 10} more errors
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Data Preview (First 20 Normalized Rows)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Start</TableHead>
                                    <TableHead>End</TableHead>
                                    <TableHead>Duration (m)</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Category</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.records.slice(0, 20).map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-mono text-xs">
                                            {format(new Date(record.start), "d-MMM HH:mm")}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {format(new Date(record.end), "d-MMM HH:mm")}
                                        </TableCell>
                                        <TableCell>{record.durationMinutes}</TableCell>
                                        <TableCell>{record.employee}</TableCell>
                                        <TableCell>{record.project}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{record.category}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
