import { addMinutes, differenceInMinutes, startOfDay, isSameDay } from "date-fns";

// Jakarta is UTC+7
const JAKARTA_OFFSET_MINUTES = 7 * 60;

// Configuration
// 08:00 - 12:00 (Work)
// 12:00 - 13:00 (Lunch)
// 13:00 - 17:00 (Work)
const WORK_START_HOUR = 8;
const LUNCH_START_HOUR = 12;
const LUNCH_END_HOUR = 13;
const WORK_END_HOUR = 17;

export interface TimeSplits {
    regularMinutes: number;
    lunchMinutes: number;
    overtimeMinutes: number;
    weekendMinutes: number;
}

/**
 * Returns a new Date object shifted to Jakarta time (UTC+7)
 * NOTE: This is a "shifted" date, meaning the getUTCHours() of this object
 * matches the local hours in Jakarta.
 */
function toJakarta(date: Date): Date {
    return new Date(date.getTime() + JAKARTA_OFFSET_MINUTES * 60 * 1000);
}

function isWeekendJakarta(jakartaDate: Date): boolean {
    const day = jakartaDate.getUTCDay(); // 0=Sun, 6=Sat
    return day === 0 || day === 6;
}

/**
 * Splits a single activity interval into buckets based on Jakarta Work Rules.
 * Handles activities spanning multiple days strictly (though users usually log daily).
 */
export function splitActivity(start: Date, end: Date): TimeSplits {
    let current = start;
    const finalEnd = end;

    const splits: TimeSplits = {
        regularMinutes: 0,
        lunchMinutes: 0,
        overtimeMinutes: 0,
        weekendMinutes: 0
    };

    // Process minute by minute for robustness (or minute chunks/intervals)
    // Since expected duration is hours, iterating minutes or calculating overlaps is fine.
    // For performance with long durations, we should calculate overlaps, but simple iteration 
    // is safer to get right quickly given the specific windows. 
    // Optimization: Calculate overlaps with specific windows for the current day.

    // We will iterate day-by-day.
    while (current < finalEnd) {
        // Determine end of current processing chunk (either end of activity or end of current IDT day)
        // We work with "Jakarta Time" logic.

        const jakartaCurrent = toJakarta(current);
        const jakartaDayStart = startOfDay(jakartaCurrent); // 00:00 Jakarta time for that day

        // Define critical boundaries for THIS day in Jakarta time (shifted back to UTC for comparison)
        // Actually, let's keep everything in UTC timestamps for comparison.
        // We know the offset.

        // Boundaries in Jakarta Hour terms:
        // Day Start: 00:00
        // Work Start: 08:00
        // Lunch Start: 12:00
        // Lunch End: 13:00
        // Work End: 17:00
        // Day End: 24:00

        // Convert these Jakarta-hours back to the absolute timeline of 'current'
        // 'jakartaDayStart' is already a shifted object. 
        // We need the UTC timestamp that corresponds to Jakarta 00:00, 08:00 etc.
        // Timestamp(Jakarta 00:00) = Timestamp(JakartaCurrent) stripped to day start - Offset?
        // No.

        // Easier approach: Get UTC hours of the shifted date.
        const jHour = jakartaCurrent.getUTCHours();
        const jMin = jakartaCurrent.getUTCMinutes();
        const minutesFromMidnight = jHour * 60 + jMin;

        const workStartMin = WORK_START_HOUR * 60;
        const lunchStartMin = LUNCH_START_HOUR * 60;
        const lunchEndMin = LUNCH_END_HOUR * 60;
        const workEndMin = WORK_END_HOUR * 60;

        // Determine what bucket the CURRENT MINUTE falls into.
        // And how many minutes we can stay in this bucket until state change or activity end.

        let bucket: 'regular' | 'lunch' | 'overtime' | 'weekend';
        let nextBoundaryMin: number;

        if (isWeekendJakarta(jakartaCurrent)) {
            bucket = 'weekend';
            nextBoundaryMin = 24 * 60; // Until end of day
        } else {
            // Monday-Friday
            if (minutesFromMidnight < workStartMin) {
                bucket = 'overtime';
                nextBoundaryMin = workStartMin;
            } else if (minutesFromMidnight < lunchStartMin) {
                bucket = 'regular';
                nextBoundaryMin = lunchStartMin;
            } else if (minutesFromMidnight < lunchEndMin) {
                bucket = 'lunch';
                nextBoundaryMin = lunchEndMin;
            } else if (minutesFromMidnight < workEndMin) {
                bucket = 'regular';
                nextBoundaryMin = workEndMin;
            } else {
                bucket = 'overtime';
                nextBoundaryMin = 24 * 60;
            }
        }

        // Calculate minutes remaining in this bucket
        const minutesUntilBoundary = nextBoundaryMin - minutesFromMidnight;

        // Calculate minutes remaining in actual activity
        const minutesUntilEnd = differenceInMinutes(finalEnd, current);

        // Take the smaller chunk
        // Ensure we take at least 1 minute/non-zero to progress if start < end
        // differenceInMinutes might return 0 if < 1 min, handle precision if needed. 
        // We'll treat standard integer minutes.

        let step = Math.min(minutesUntilBoundary, minutesUntilEnd);
        if (step <= 0 && minutesUntilEnd > 0) step = 1; // Fallback for sub-minute precision if needed, but lets assume minute steps.
        if (step === 0) break; // Done

        // Add to bucket
        if (bucket === 'regular') splits.regularMinutes += step;
        else if (bucket === 'lunch') splits.lunchMinutes += step;
        else if (bucket === 'overtime') splits.overtimeMinutes += step;
        else if (bucket === 'weekend') splits.weekendMinutes += step;

        // Advance
        current = addMinutes(current, step);
    }

    return splits;
}

export function isJakartaWeekend(date: Date): boolean {
    return isWeekendJakarta(toJakarta(date));
}

// Check if a gap (start -> end) overlaps with Lunch (12-13) on a workday
export function overlapsLunchGap(start: Date, end: Date): number {
    // This calculates how many minutes of "Lunch Window" are inside the gap.
    // If the gap is purely 12:00-13:00, return 60.
    // Logic reuses splitActivity but we only care about 'lunchMinutes' on working days.
    const s = splitActivity(start, end);
    return s.lunchMinutes;
}
