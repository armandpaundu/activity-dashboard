import { fetchAndNormalizeData } from "@/lib/normalization";
import { ActivityRecord } from "@/lib/types";
import { format } from "date-fns";
import { IssuesPanel } from "@/components/dashboard/IssuesPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const DEFAULT_DATA_SOURCE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8s1IAVtsKEpk11tlzf4wFqHOTs3R0GucbmQ52B5NowV3MrcAs9Hd-ANVsMfNqChYxObfl-TQ46SxI/pub?output=csv";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PreviewPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const source = typeof searchParams.id === "string" ? searchParams.id : DEFAULT_DATA_SOURCE;

    const data = await fetchAndNormalizeData(source);

    return (
        <div className="container mx-auto py-8 space-y-8">
            <h1 className="text-3xl font-bold">Data Ingestion Preview</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Rows Fetched</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{data.totalRows}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Valid Records</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{data.records.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Skipped / Errors</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{data.errors.length}</div></CardContent>
                </Card>
            </div>

            <IssuesPanel issues={data.errors} />

            <div className="rounded-md border">
                <div className="p-4 border-b bg-muted/40">
                    <h3 className="font-semibold">First 25 Normalized Records</h3>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Start</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.records.slice(0, 25).map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="whitespace-nowrap font-mono text-xs">
                                    {format(record.start, "yyyy-MM-dd HH:mm")}
                                </TableCell>
                                <TableCell>{record.durationMinutes}m</TableCell>
                                <TableCell>{record.employee}</TableCell>
                                <TableCell>{record.project}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="font-normal text-xs">{record.category}</Badge>
                                </TableCell>
                                <TableCell className="truncate max-w-[300px]" title={record.description}>{record.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
