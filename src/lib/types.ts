import { z } from "zod";

export const ActivityRecordSchema = z.object({
    id: z.string(),
    start: z.date(),
    end: z.date(),
    durationMinutes: z.number(),
    employee: z.string(),
    project: z.string(),
    category: z.string(),
    description: z.string(),
    task: z.string(),
});

export type ActivityRecord = z.infer<typeof ActivityRecordSchema>;

export interface DashboardData {
    records: ActivityRecord[];
    lastUpdated: string;
}
