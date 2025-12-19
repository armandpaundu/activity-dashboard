import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface TooltipData {
    description: string;
    interpretation?: string;
    insight?: string;
    badge?: React.ReactNode;
}

export interface KpiCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon?: React.ReactNode;
    tooltip?: TooltipData;
}

export function KpiCard({ title, value, subtext, icon, tooltip }: KpiCardProps) {
    return (
        <Card className="border border-border shadow-none rounded-xl hover:border-border/60 transition-colors relative overflow-hidden bg-card">
            {/* Left Accent Bar (Permanent) */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
                <div className="flex items-center gap-2">
                    <CardTitle className="card-title-sm flex items-center gap-2">
                        {title}
                        {/* Optional tiny neon dot */}
                        <span className="h-1.5 w-1.5 rounded-full bg-chart-1 shadow-[0_0_8px_var(--chart-1)]" />
                    </CardTitle>
                    {tooltip && (
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-pointer hover:text-primary transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent className="tooltip-glass" side="bottom" align="start">
                                    <p className="tooltip-title">{title}</p>
                                    <p className="tooltip-row !items-start">{tooltip.description}</p>
                                    {tooltip.interpretation && (
                                        <div className="space-y-1 pt-1 mt-1 border-t border-white/10">
                                            <p className="text-[10px] font-medium uppercase text-muted-foreground">Interpretation</p>
                                            <p className="tooltip-row !items-start text-xs">{tooltip.interpretation}</p>
                                        </div>
                                    )}
                                    {tooltip.insight && (
                                        <div className="space-y-1 pt-1 border-t border-border/50">
                                            <p className="text-[10px] font-medium uppercase text-muted-foreground">Insight</p>
                                            <p className="text-xs italic text-muted-foreground">{tooltip.insight}</p>
                                        </div>
                                    )}
                                    {tooltip.badge && (
                                        <div className="pt-1">
                                            {tooltip.badge}
                                        </div>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
                {icon && (
                    <div className="text-muted-foreground/60">
                        {icon}
                    </div>
                )}
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
                <div className="kpi-value">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            </CardContent>
        </Card>
    );
}
