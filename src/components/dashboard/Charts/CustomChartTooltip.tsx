import React from 'react';
import { format, isValid } from 'date-fns';

interface ChartTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string | number;
    // Optional props for flexibility
    titleFormatter?: (label: string | number) => string;
    valueFormatter?: (value: number, name: string) => string;
}

export const CustomChartTooltip = ({ active, payload, label, titleFormatter, valueFormatter }: ChartTooltipProps) => {
    if (active && payload && payload.length) {

        let displayLabel = label;
        if (titleFormatter) {
            displayLabel = titleFormatter(label || '');
        } else if (typeof label === 'string' && !label.includes('Time') && !label.includes('Category')) {
            // Heuristic: try to format if it looks like a standard date
            const date = new Date(label);
            if (isValid(date) && label.length >= 10) {
                try {
                    displayLabel = format(date, "EEE, MMM d, yyyy");
                } catch { /* ignore */ }
            }
        }

        return (
            <div className="tooltip-glass min-w-[150px]">
                {displayLabel && <p className="tooltip-title">{displayLabel}</p>}
                <div className="flex flex-col gap-1">
                    {payload.map((entry: any, index: number) => {
                        const name = entry.name || entry.dataKey || 'Value';
                        // Fallback for color if not provided by payload (e.g. some line charts)
                        const color = entry.color || entry.fill || entry.stroke || 'var(--primary)';

                        let valueDisplay = typeof entry.value === 'number'
                            ? (entry.value % 1 !== 0 ? entry.value.toFixed(2) : entry.value)
                            : entry.value;

                        if (valueFormatter) {
                            valueDisplay = valueFormatter(entry.value, name);
                        }

                        return (
                            <div key={index} className="tooltip-row justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full shadow-[0_0_4px_currentColor]"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="tooltip-label capitalize">
                                        {name}
                                    </span>
                                </div>
                                <span className="tooltip-value">
                                    {valueDisplay}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};
