import { z } from "zod";
import Papa from "papaparse";
import { parse, isValid } from "date-fns";
import { ActivityRecord, ActivityRecordSchema } from "./types";
import { classifyActivity } from "./classification";

// --- Types & Schemas ---

export interface ParsingResult {
    records: ActivityRecord[];
    errors: { row: number; message: string; data: any }[];
    rawRows: any[];
    detectedColumns: string[];
    totalRows: number;
}

// --- Helpers ---

function parseDateString(dateStr: string, timeStr?: string): Date | null {
    if (!dateStr) return null;
    const cleanDateStr = dateStr.trim();
    const cleanTimeStr = timeStr ? timeStr.trim() : "00:00:00";

    // Try combining date and time
    const paramStr = `${cleanDateStr} ${cleanTimeStr}`;

    // Common formats to try
    const formats = [
        "d-MMM-yy h:mm:ss a", // "3-Nov-25 8:00:00 AM"
        "d-MMM-yy HH:mm:ss",
        "d-MMM-yy HH:mm",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd HH:mm",
        "MM/dd/yyyy h:mm:ss a",
    ];

    for (const fmt of formats) {
        const d = parse(paramStr, fmt, new Date());
        if (isValid(d)) return d;
    }

    // Fallback: Just parse date, assumed start of day if time fails or not provided
    const dateOnlyFormats = ["d-MMM-yy", "yyyy-MM-dd", "MM/dd/yyyy"];
    for (const fmt of dateOnlyFormats) {
        const d = parse(cleanDateStr, fmt, new Date());
        if (isValid(d)) return d;
    }

    // Last resort: let Date constructor try
    const d = new Date(paramStr);
    return isValid(d) ? d : null;
}

// --- Main Function ---

// --- Fetch Helper with Retry ---

async function fetchWithRetry(url: string, retries: number = 3, backoff: number = 1000): Promise<Response> {
    try {
        const response = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 minutes
        if (!response.ok) {
            // If 4xx error (client error), don't retry unless it's 429 (Too Many Requests)
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                return response;
            }
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying in ${backoff}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, retries - 1, backoff * 2);
        }
        throw error;
    }
}

export async function fetchAndNormalizeData(source: string): Promise<ParsingResult> {
    const isUrl = source.startsWith("http");
    const url = isUrl ? source : `https://docs.google.com/spreadsheets/d/${source}/export?format=csv&gid=0`;

    let csvText = "";
    try {
        const response = await fetchWithRetry(url);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        csvText = await response.text();
    } catch (error) {
        throw new Error(`Network error after retries: ${error instanceof Error ? error.message : String(error)}`);
    }

    return new Promise((resolve) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const records: ActivityRecord[] = [];
                const errors: { row: number; message: string; data: any }[] = [];
                const detectedColumns = results.meta.fields || [];
                const rawRows = results.data.slice(0, 20); // Keep first 20 for preview

                results.data.forEach((row: any, index) => {
                    try {
                        // 1. Map Columns (Normalize keys)
                        // Adjust these keys based on actual CSV headers
                        const start_date = row["start_date"] || row["Date"] || "";
                        const start_time = row["start_time"] || "00:00:00";
                        const end_date = row["end_date"] || start_date; // Fallback to start date
                        const end_time = row["end_time"] || "";
                        const employee = row["Employee"] || row["Owner"] || "Unknown";
                        const project = row["Project"] || "Unassigned";
                        const category = row["Task"] || row["Category"] || "General"; // 'Task' seems to be the category in sample
                        const description = row["Description"] || row["Activity"] || "";

                        // 2. Parse Dates (Strict ISO output required by type, but Date obj internally for calc)
                        let start = parseDateString(start_date, start_time);
                        let end = parseDateString(end_date, end_time);

                        if (!start) {
                            throw new Error("Missing or invalid start date");
                        }

                        // Fallback: End Date / Duration Logic checks
                        // "if end missing but duration exists, compute end = start + duration"
                        // "if both missing, set durationMinutes=0 and flag"
                        if (!end) {
                            const durationHours = parseFloat(row["duration"] || "0");
                            if (!isNaN(durationHours) && durationHours > 0) {
                                end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
                            } else {
                                // Both missing or invalid duration
                                end = new Date(start.getTime());
                                // Note: We are setting end=start, so duration will be 0.
                                // "Flag" is implicit as it might be a valid 0-minute record or filtered later.
                                // If strict validation is needed, we could throw here, but requirement says "set durationMinutes=0"
                            }
                        }

                        // 3. Calculate Duration
                        const durationMs = end.getTime() - start.getTime();
                        let durationMinutes = Math.max(0, Math.floor(durationMs / 60000));

                        // "category (if missing, derive from description keyword classification)"
                        let finalCategory = category;
                        if (!finalCategory || finalCategory === "General" || finalCategory === "Unassigned") {
                            finalCategory = classifyActivity(description);
                        }

                        // Normalized "Task" field from CSV
                        // According to requirement: Map "Task" / "TASK" / similar.
                        // Note: "category" logic above used 'Task' as fallback for Category, 
                        // but now we have a dedicated Task field.
                        const rawTask = row["Task"] || row["TASK"] || "";
                        const task = rawTask.trim() || "Unspecified Task";

                        const record: ActivityRecord = {
                            id: `${index}-${employee}-${start.getTime()}`,
                            start,
                            end,
                            durationMinutes,
                            employee,
                            project,
                            category: finalCategory,
                            description,
                            task,
                        };

                        // 4. Validate with Zod
                        const validation = ActivityRecordSchema.safeParse(record);
                        if (!validation.success) {
                            throw new Error("Schema validation failed: " + JSON.stringify(validation.error.format()));
                        }

                        records.push(record);
                    } catch (err) {
                        errors.push({
                            row: index + 2, // +2 for 1-based index and header row
                            message: err instanceof Error ? err.message : String(err),
                            data: row,
                        });
                    }
                });

                resolve({
                    records,
                    errors,
                    rawRows,
                    detectedColumns,
                    totalRows: results.data.length,
                });
            },
            error: (err: any) => {
                resolve({
                    records: [],
                    errors: [{ row: 0, message: "CSV Parsing Error: " + err.message, data: {} }],
                    rawRows: [],
                    detectedColumns: [],
                    totalRows: 0,
                });
            }
        });
    });
}
