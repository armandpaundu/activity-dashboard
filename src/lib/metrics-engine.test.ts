import { describe, it, expect } from "vitest";
import { calculateVolumeMetrics, calculateTimeMetrics, calculateBehaviorMetrics } from "./metrics-engine";
import { ActivityRecord } from "./types";

// Helper to create mock record
function mockRecord(
    id: string,
    startStr: string,
    durationMin: number,
    employee: string,
    project: string,
    description: string
): ActivityRecord {
    const start = new Date(startStr); // ISO string assumed UTC or handled
    const end = new Date(start.getTime() + durationMin * 60000);
    return {
        id,
        start,
        end,
        durationMinutes: durationMin,
        employee,
        project,
        category: "General", // simplified for test
        description
    };
}

const mockData: ActivityRecord[] = [
    // Alice: 2 days
    mockRecord("1", "2024-10-01T09:00:00Z", 60, "Alice", "Project A", "Morning sync"),
    mockRecord("2", "2024-10-01T10:30:00Z", 120, "Alice", "Project A", "Deep coding"), // Deep work
    mockRecord("3", "2024-10-01T14:00:00Z", 15, "Alice", "Project B", "Quick fix"), // Short task
    mockRecord("4", "2024-10-02T09:30:00Z", 240, "Alice", "Project A", "Feature dev"), // Deep work

    // Bob: 1 day
    mockRecord("5", "2024-10-01T10:00:00Z", 30, "Bob", "Project B", "Standup"),
    mockRecord("6", "2024-10-01T11:00:00Z", 60, "Bob", "Project C", "Analysis"),
];

describe("Metrics Engine", () => {
    describe("Volume Metrics", () => {
        const metrics = calculateVolumeMetrics(mockData);

        it("counts total activity correctly", () => {
            expect(metrics.totalCount).toBe(6);
        });

        it("counts by employee correctly", () => {
            expect(metrics.countByEmployee["Alice"]).toBe(4);
            expect(metrics.countByEmployee["Bob"]).toBe(2);
        });

        it("identifies top descriptions", () => {
            // "Morning sync" appears once
            expect(metrics.topDescriptions).toContainEqual({ text: "Morning sync", count: 1 });
        });
    });

    describe("Time Metrics", () => {
        const metrics = calculateTimeMetrics(mockData);

        it("calculates total hours correctly", () => {
            // Alice: 60+120+15+240 = 435 min = 7.25h
            // Bob: 30+60 = 90 min = 1.5h
            // Total: 525 min = 8.75h
            expect(metrics.totalHours).toBeCloseTo(8.75);
        });

        it("calculates deep work ratio correctly", () => {
            // Deep tasks (>120): #2 (120), #4 (240). Total 2.
            // Total tasks: 6.
            // Ratio: 2/6 = 0.333
            expect(metrics.deepWorkRatio).toBeCloseTo(1 / 3);
        });

        it("calculates short task ratio correctly", () => {
            // Short tasks (<=30): #3 (15), #5 (30). Total 2.
            // Ratio: 2/6 = 0.333
            expect(metrics.shortTaskRatio).toBeCloseTo(1 / 3);
        });
    });

    describe("Behavior Metrics", () => {
        const patterns = calculateBehaviorMetrics(mockData);

        it("calculates clock-in time correctly for Alice", () => {
            const alice = patterns.find(p => p.employee === "Alice");
            // Day 1: 09:00 UTC -> 16:00 Jakarta (UTC+7)
            // Day 2: 09:30 UTC -> 16:30 Jakarta (UTC+7)
            // Avg: 16:15
            // "16" is hour 16.
            // Wait, implementation uses Jakarta shift. 
            // 09:00Z + 7h = 16:00.
            // 09:30Z + 7h = 16:30. 
            // Avg is 16:15.
            expect(alice?.avgClockIn).toBe("16:15");
        });

        it("calculates effort consistency", () => {
            const alice = patterns.find(p => p.employee === "Alice");
            // Day 1: 3.25h (195 min)
            // Day 2: 4h (240 min)
            expect(alice?.avgDailyHours).toBeGreaterThan(0);
        });
    });
});
