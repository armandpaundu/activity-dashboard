import React from "react";
import { LayoutDashboard } from "lucide-react";

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                    <span>Activity Monitor</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    {/* Add user profile or other actions here if needed */}
                </div>
            </header>
            <main className="container mx-auto p-6 space-y-8">
                {children}
            </main>
        </div>
    );
}
