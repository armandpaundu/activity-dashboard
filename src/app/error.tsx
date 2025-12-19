"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-red-200 dark:border-red-900/50">
                <CardHeader>
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <CardTitle>Something went wrong!</CardTitle>
                    </div>
                    <CardDescription>
                        We encountered a critical error while loading the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-md text-sm font-mono break-all text-muted-foreground">
                        {error.message || "Unknown error occurred."}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => reset()} className="w-full">
                        Try Again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
