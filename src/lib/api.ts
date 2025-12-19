import Papa from "papaparse";
import { ActivityRecord, ActivityRecordSchema, DashboardData } from "./types";

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1jtf_4xdq_nG794oU9QStO-bfl0asIgHilkovrXl9Gko/export?format=csv";

// Simple in-memory cache
let cache: DashboardData | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchActivityData(): Promise<DashboardData> {
    const now = Date.now();

    if (cache && now - lastFetchTime < CACHE_TTL) {
        return cache;
    }

    try {
        const response = await fetch(SHEET_URL, {
            next: { revalidate: 300 }, // Next.js server-side caching
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const parsedRecords: ActivityRecord[] = [];
                    const errors: unknown[] = [];

                    results.data.forEach((row: unknown) => {
                        const result = ActivityRecordSchema.safeParse(row);
                        if (result.success) {
                            parsedRecords.push(result.data);
                        } else {
                            // console.warn("Validation error for row:", row, result.error);
                            // We can choose to skip or log errors
                        }
                    });

                    const data = {
                        records: parsedRecords,
                        lastUpdated: new Date().toISOString(),
                    };

                    cache = data;
                    lastFetchTime = now;
                    resolve(data);
                },
                error: (error: Error) => {
                    reject(error);
                },
            });
        });
    } catch (error) {
        console.error("Error fetching activity data:", error);
        // Return empty data or cached data if available (even if expired) as fallback
        if (cache) return cache;
        return { records: [], lastUpdated: new Date().toISOString() };
    }
}
