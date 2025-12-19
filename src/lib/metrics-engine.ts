import { ActivityRecord } from "./types";
import { classifyActivity, DerivedCategory, isPlanned, isStrategic } from "./classification";
import { format, differenceInMinutes, parseISO, startOfDay, endOfDay, isAfter } from "date-fns";
import { splitActivity, overlapsLunchGap, isJakartaWeekend } from "./workRules";

// Actually user requested Asia/Jakarta.
// Since date-fns-tz might not be installed, I'll rely on the Date objects being correct UTC or use basic timezone offsets if needed.
// However, to strictly follow "Asia/Jakarta" (UTC+7), I should ideally use date-fns-tz or manually shift.
// Let's assume input Dates are UTC or local server time. The user requirement ("Asia/Jakarta") implies we should treat day boundaries in that TZ.

// Helper to get Jakarta date string yyyy-MM-dd
function getJakartaDateStr(date: Date): string {
    // Jakarta is UTC+7
    // This simple hack works if we just want to bin by day.
    // For a real app, use date-fns-tz.
    const jakartaOffset = 7 * 60; // minutes
    const localTime = new Date(date.getTime() + jakartaOffset * 60 * 1000);
    return localTime.toISOString().split("T")[0]; // returns YYYY-MM-DD based on Jakarta time
}

// --------------------------------------------------------
// Types
// --------------------------------------------------------

export interface VolumeMetrics {
    totalCount: number;
    countByDay: Record<string, number>;
    countByEmployee: Record<string, number>;
    countByProject: Record<string, number>;
    countByCategory: Record<string, number>;
    topDescriptions: { text: string; count: number }[];
    activityDensity: number; // avg per day
}

export interface TimeMetrics {
    totalHours: number;
    // New buckets
    netWorkingHours: number;
    workDuringLunchHours: number;
    weekdayOvertimeHours: number;
    weekendWorkHours: number;

    avgHoursPerDay: number;
    avgHoursPerActiveDay: number;
    hoursByEmployee: Record<string, number>;
    hoursByProject: Record<string, number>;
    hoursByDescription: Record<string, number>;
    avgDurationPerTask: number;
    medianDurationPerTask: number;
    shortTaskRatio: number;
    deepWorkRatio: number;
    fragmentationIndex: number;
    hoursByCategory: Record<string, number>;
    meetingHours: number;
    strategicHours: number;
    plannedHours: number;
    overtimeCount: number;
}

export interface ProjectHealth {
    effortShare: Record<string, number>; // %
    topProject: string;
}

export interface BehaviorPattern {
    employee: string;
    avgClockIn: string; // HH:mm
    avgClockOut: string; // HH:mm
    avgDailyHours: number;
    effortConsistency: number; // 0-100
}

// --------------------------------------------------------
// Calculators
// --------------------------------------------------------

export function calculateVolumeMetrics(records: ActivityRecord[]): VolumeMetrics {
    const byDay: Record<string, number> = {};
    const byEmp: Record<string, number> = {};
    const byProj: Record<string, number> = {};
    const byCat: Record<string, number> = {};
    const descCount: Record<string, number> = {};

    records.forEach(r => {
        const day = getJakartaDateStr(r.start);
        byDay[day] = (byDay[day] || 0) + 1;
        byEmp[r.employee] = (byEmp[r.employee] || 0) + 1;
        byProj[r.project] = (byProj[r.project] || 0) + 1;

        // Use classifier for category
        const cat = classifyActivity(r.description);
        byCat[cat] = (byCat[cat] || 0) + 1;

        descCount[r.description] = (descCount[r.description] || 0) + 1;
    });

    const uniqueDays = Object.keys(byDay).length;

    return {
        totalCount: records.length,
        countByDay: byDay,
        countByEmployee: byEmp,
        countByProject: byProj,
        countByCategory: byCat,
        topDescriptions: Object.entries(descCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([text, count]) => ({ text, count })),
        activityDensity: uniqueDays ? records.length / uniqueDays : 0,
    };
}

export function calculateTimeMetrics(records: ActivityRecord[]): TimeMetrics {
    let totalMin = 0;

    // Buckets
    let regularMin = 0;
    let lunchMin = 0;
    let overtimeMin = 0;
    let weekendMin = 0;

    const byEmp: Record<string, number> = {};
    const byProj: Record<string, number> = {};
    const byDesc: Record<string, number> = {};
    const durations: number[] = [];

    let shortTasks = 0;
    let deepTasks = 0;
    const byCat: Record<string, number> = {};
    let strategicMin = 0;
    let plannedMin = 0;
    let overtimeTaskCount = 0;

    const activeDaysSet = new Set<string>();

    records.forEach(r => {
        const min = r.durationMinutes;
        totalMin += min;
        durations.push(min);

        // Ensure splitActivity is available or assume imported
        const splits = splitActivity(r.start, r.end);
        regularMin += splits.regularMinutes;
        lunchMin += splits.lunchMinutes;
        overtimeMin += splits.overtimeMinutes;
        weekendMin += splits.weekendMinutes;

        if (splits.overtimeMinutes > 0) overtimeTaskCount++;

        byEmp[r.employee] = (byEmp[r.employee] || 0) + min;
        byProj[r.project] = (byProj[r.project] || 0) + min;
        byDesc[r.description] = (byDesc[r.description] || 0) + min;

        const cat = classifyActivity(r.description);
        byCat[cat] = (byCat[cat] || 0) + min;

        if (isStrategic(cat)) strategicMin += min;
        if (isPlanned(r.description, r.project)) plannedMin += min;

        if (min <= 30) shortTasks++;
        if (min >= 120) deepTasks++;

        activeDaysSet.add(getJakartaDateStr(r.start));
    });

    const totalHours = totalMin / 60;

    let activeWorkdays = 0;
    activeDaysSet.forEach(dayStr => {
        const dayDate = new Date(dayStr);
        const dayNum = dayDate.getDay();
        if (dayNum !== 0 && dayNum !== 6) activeWorkdays++;
    });

    const avgHoursPerDay = activeWorkdays ? (regularMin / 60) / activeWorkdays : 0;
    const avgHoursPerActiveDay = activeDaysSet.size ? totalHours / activeDaysSet.size : 0;

    // Median
    durations.sort((a, b) => a - b);
    const mid = Math.floor(durations.length / 2);
    const median = durations.length
        ? (durations.length % 2 !== 0 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2)
        : 0;

    return {
        totalHours,
        netWorkingHours: regularMin / 60,
        workDuringLunchHours: lunchMin / 60,
        weekdayOvertimeHours: overtimeMin / 60,
        weekendWorkHours: weekendMin / 60,

        avgHoursPerDay,
        avgHoursPerActiveDay,

        hoursByEmployee: mapValues(byEmp, m => m / 60),
        hoursByProject: mapValues(byProj, m => m / 60),
        hoursByDescription: mapValues(byDesc, m => m / 60),
        avgDurationPerTask: records.length ? totalMin / records.length : 0,
        medianDurationPerTask: median,
        shortTaskRatio: records.length ? shortTasks / records.length : 0,
        deepWorkRatio: records.length ? deepTasks / records.length : 0,
        fragmentationIndex: records.length ? shortTasks / records.length : 0,
        hoursByCategory: mapValues(byCat, m => m / 60),
        meetingHours: (byCat["Meeting"] || 0) / 60,
        strategicHours: strategicMin / 60,
        plannedHours: plannedMin / 60,
        overtimeCount: overtimeTaskCount // Using count of tasks with overtime
    };
}

export function calculateBehaviorMetrics(records: ActivityRecord[]): BehaviorPattern[] {
    const byEmp: Record<string, ActivityRecord[]> = {};

    records.forEach(r => {
        if (!byEmp[r.employee]) byEmp[r.employee] = [];
        byEmp[r.employee].push(r);
    });

    return Object.entries(byEmp).map(([emp, recs]) => {
        const days: Record<string, { start: Date[], totalMin: number }> = {};

        recs.forEach(r => {
            const d = getJakartaDateStr(r.start);
            if (!days[d]) days[d] = { start: [], totalMin: 0 };
            days[d].start.push(r.start);
            days[d].totalMin += r.durationMinutes;
        });

        let totalClockInMin = 0;
        let totalClockOutMin = 0;
        let validDays = 0;
        const dailyHoursArr: number[] = [];

        Object.values(days).forEach(dayData => {
            if (dayData.start.length === 0) return;
            validDays++;

            // Sort starts
            dayData.start.sort((a, b) => a.getTime() - b.getTime());

            // Earliest start
            const first = dayData.start[0];
            // Simple Jakarta hour conversion
            const jakartaFirst = new Date(first.getTime() + 7 * 60 * 60 * 1000);
            totalClockInMin += jakartaFirst.getUTCHours() * 60 + jakartaFirst.getUTCMinutes();

            // Latest end (approximation: last start + duration of that task)
            // Ideally we need end time of last task.
            // Let's find task with max end time.
            let maxEnd = new Date(0);
            recs.filter(r => getJakartaDateStr(r.start) === getJakartaDateStr(first)).forEach(r => {
                const end = r.end;
                if (end > maxEnd) maxEnd = end;
            });

            const jakartaEnd = new Date(maxEnd.getTime() + 7 * 60 * 60 * 1000);
            totalClockOutMin += jakartaEnd.getUTCHours() * 60 + jakartaEnd.getUTCMinutes();

            dailyHoursArr.push(dayData.totalMin / 60);
        });

        // Consistency (CV)
        const avgDaily = dailyHoursArr.reduce((a, b) => a + b, 0) / (validDays || 1);
        const variance = dailyHoursArr.reduce((a, b) => a + Math.pow(b - avgDaily, 2), 0) / (validDays || 1);
        const stdDev = Math.sqrt(variance);
        const cv = avgDaily ? stdDev / avgDaily : 0;
        const consistency = Math.max(0, 100 * (1 - cv));

        return {
            employee: emp,
            avgClockIn: minutesToHHMM(validDays ? totalClockInMin / validDays : 0),
            avgClockOut: minutesToHHMM(validDays ? totalClockOutMin / validDays : 0),
            avgDailyHours: avgDaily,
            effortConsistency: consistency
        };
    });
}

// Helpers
function mapValues(obj: Record<string, number>, fn: (v: number) => number): Record<string, number> {
    const res: Record<string, number> = {};
    for (const k in obj) res[k] = fn(obj[k]);
    return res;
}

function minutesToHHMM(totalMin: number): string {
    const h = Math.floor(totalMin / 60);
    const m = Math.floor(totalMin % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// --------------------------------------------------------
// Week & Heatmap Helpers
// --------------------------------------------------------

export interface HeatmapPoint {
    dayOfWeek: number; // 0=Sun, 6=Sat
    hourOfDay: number; // 0-23
    value: number; // intensity (count or duration)
}

export function calculateHeatmapData(records: ActivityRecord[]): HeatmapPoint[] {
    // grid: [day][hour]
    const grid: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

    records.forEach(r => {
        // Adjust to Jakarta time for visualization consistency
        // r.start is Date object. correct local time logic:
        const jakartaTime = new Date(r.start.getTime() + 7 * 60 * 60 * 1000);
        const day = jakartaTime.getUTCDay();
        const hour = jakartaTime.getUTCHours();
        grid[day][hour] += 1; // Count based intensity
    });

    const points: HeatmapPoint[] = [];
    for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
            points.push({ dayOfWeek: d, hourOfDay: h, value: grid[d][h] });
        }
    }
    return points;
}

export interface WeeklyData {
    week: string; // "Week 42" or "Oct 02"
    hours: number;
}

export function calculateWeeklyTrend(records: ActivityRecord[]): WeeklyData[] {
    const weekly: Record<string, number> = {};

    records.forEach(r => {
        // Simple binning by "Week N" 
        // Or ISO Week. Let's use start of week date string
        const d = new Date(r.start);
        // get start of week (Sunday)
        const day = d.getDay();
        const diff = d.getDate() - day;
        const startOfWeek = new Date(d);
        startOfWeek.setDate(diff);
        const key = startOfWeek.toISOString().split("T")[0]; // yyyy-mm-dd of Sunday

        weekly[key] = (weekly[key] || 0) + r.durationMinutes;
    });

    return Object.entries(weekly)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, min]) => ({
            week: format(new Date(date), "MMM d"),
            hours: min / 60
        }));
}

export interface ProjectPerformance {
    name: string;
    hours: number;
    share: number; // 0-1
    count: number;
}

export function calculateProjectPerformance(records: ActivityRecord[]): ProjectPerformance[] {
    const stats: Record<string, { minutes: number; count: number }> = {};
    let totalMin = 0;

    records.forEach(r => {
        const p = r.project;
        if (!stats[p]) stats[p] = { minutes: 0, count: 0 };
        stats[p].minutes += r.durationMinutes;
        stats[p].count += 1;
        totalMin += r.durationMinutes;
    });

    return Object.entries(stats)
        .map(([name, s]) => ({
            name,
            hours: s.minutes / 60,
            share: totalMin ? s.minutes / totalMin : 0,
            count: s.count
        }))
        .sort((a, b) => b.hours - a.hours);
}

// --------------------------------------------------------
// Productivity Pattern Helpers
// --------------------------------------------------------

export interface DailyBehavior {
    date: string;
    clockIn: number; // hour (decimal)
    clockOut: number; // hour (decimal)
    breakHours: number;
}

export function calculateDailyBehaviorSeries(records: ActivityRecord[]): DailyBehavior[] {
    const days: Record<string, ActivityRecord[]> = {};

    records.forEach(r => {
        const d = getJakartaDateStr(r.start);
        if (!days[d]) days[d] = [];
        days[d].push(r);
    });

    return Object.entries(days).map(([date, recs]) => {
        recs.sort((a, b) => a.start.getTime() - b.start.getTime());

        const first = recs[0];
        const last = recs[recs.length - 1];

        // Jakarta shift for display
        const startH = new Date(first.start.getTime() + 7 * 60 * 60 * 1000);
        const endH = new Date(last.end.getTime() + 7 * 60 * 60 * 1000); // Approximation: using reported End would be better if reliable, but we have normalized ends.

        const clockIn = startH.getUTCHours() + startH.getUTCMinutes() / 60;
        const clockOut = endH.getUTCHours() + endH.getUTCMinutes() / 60;

        // Break duration
        let breakMin = 0;
        for (let i = 0; i < recs.length - 1; i++) {
            const currentEnd = recs[i].end;
            const nextStart = recs[i + 1].start;
            const diffMs = nextStart.getTime() - currentEnd.getTime();
            // Ignore small overlaps or huge gaps (>4h)
            if (diffMs > 0 && diffMs < 4 * 60 * 60 * 1000) {
                breakMin += diffMs / 60000;
            }
        }

        return {
            date,
            clockIn,
            clockOut: clockOut < clockIn ? clockIn + (first.durationMinutes / 60) : clockOut, // Sanity check
            breakHours: breakMin / 60
        };
    }).sort((a, b) => a.date.localeCompare(b.date));
}

export interface DurationBin {
    bin: string; // "0-15", etc
    count: number;
}

export function calculateDurationDistribution(records: ActivityRecord[]): DurationBin[] {
    const bins = {
        "0-15m": 0,
        "15-30m": 0,
        "30-60m": 0,
        "1-2h": 0,
        "2h+": 0
    };

    records.forEach(r => {
        const m = r.durationMinutes;
        if (m <= 15) bins["0-15m"]++;
        else if (m <= 30) bins["15-30m"]++;
        else if (m <= 60) bins["30-60m"]++;
        else if (m <= 120) bins["1-2h"]++;
        else bins["2h+"]++;
    });

    return Object.entries(bins).map(([bin, count]) => ({ bin, count }));
}

export interface FragmentationPoint {
    week: string;
    index: number; // 0-1
}

export function calculateFragmentationTrend(records: ActivityRecord[]): FragmentationPoint[] {
    const weekly: Record<string, { total: number; short: number }> = {};

    records.forEach(r => {
        const d = new Date(r.start);
        const day = d.getDay();
        const diff = d.getDate() - day;
        const startOfWeek = new Date(d);
        startOfWeek.setDate(diff);
        const key = startOfWeek.toISOString().split("T")[0];

        if (!weekly[key]) weekly[key] = { total: 0, short: 0 };
        weekly[key].total++;
        if (r.durationMinutes <= 30) weekly[key].short++;
    });

    return Object.entries(weekly)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, counts]) => ({
            week: format(new Date(date), "MMM d"),
            index: counts.total ? counts.short / counts.total : 0
        }));
}

// --------------------------------------------------------
// Drilldown Helpers
// --------------------------------------------------------

export interface EmployeeDailyStats {
    date: string;
    firstActivity: string;
    lastActivity: string;
    loggedHours: number;
    breakHours: number;
    taskCount: number;
}

export function calculateEmployeeDailyTimeline(records: ActivityRecord[]): EmployeeDailyStats[] {
    const days: Record<string, ActivityRecord[]> = {};

    records.forEach(r => {
        const d = getJakartaDateStr(r.start);
        if (!days[d]) days[d] = [];
        days[d].push(r);
    });

    return Object.entries(days).map(([date, recs]) => {
        recs.sort((a, b) => a.start.getTime() - b.start.getTime());

        let totalMin = 0;
        recs.forEach(r => totalMin += r.durationMinutes);

        // Breaks
        let breakMin = 0;
        let workedLunchMin = 0;

        // Calculate worked lunch from records
        // This is strictly "Time worked during 12-13" for the day.

        recs.forEach(r => {
            const s = splitActivity(r.start, r.end);
            workedLunchMin += s.lunchMinutes;
        });

        for (let i = 0; i < recs.length - 1; i++) {
            const currentEnd = recs[i].end;
            const nextStart = recs[i + 1].start;
            const diffMs = nextStart.getTime() - currentEnd.getTime();

            // Ignore small overlaps or huge gaps (>4h)
            if (diffMs > 0 && diffMs < 4 * 60 * 60 * 1000) {
                // Total gap minutes
                const gapMinutes = diffMs / 60000;

                // Subtract any portion of this gap that falls in 12:00-13:00 on a workday
                // We assume getJakartaDateStr(currentEnd) == getJakartaDateStr(nextStart) mostly
                // If gap spans lunch, we remove lunch duration from the "Break" penalty.
                // Standard Lunch is 12:00-13:00.
                // We need to know if 'date' is a workday.

                // Construct Date object for 'date' string (YYYY-MM-DD)
                // We're iterating days, so 'date' is known.
                // Check if 'date' is weekend.
                const isWeekend = isJakartaWeekend(new Date(date));

                if (!isWeekend) {
                    // Check overlap with 12-13 window
                    // Effectively, we can use overlapsLunchGap(currentEnd, nextStart)
                    // But overlapsLunchGap checks if the INTERVAL (gap) contains lunch.
                    // IMPORTANT: 'Lunch Gap' means user TOOK A BREAK during lunch. 
                    // The user requirement: "do NOT count the standard lunch window (12–13) as 'break penalty'".
                    // So if gap is 12:00-13:00, breakMin should be 0 (or close to).

                    const lunchOverlap = overlapsLunchGap(currentEnd, nextStart);
                    const adjustedGap = Math.max(0, gapMinutes - lunchOverlap);
                    breakMin += adjustedGap;
                } else {
                    breakMin += gapMinutes;
                }
            }
        }

        return {
            date,
            firstActivity: format(recs[0].start, "HH:mm"),
            lastActivity: format(recs[recs.length - 1].end, "HH:mm"),
            loggedHours: totalMin / 60,
            breakHours: breakMin / 60,
            taskCount: recs.length
        };
    }).sort((a, b) => a.date.localeCompare(b.date));
}

export interface ProjectStats {
    topDescriptions: { desc: string; count: number; hours: number }[];
    contributors: { name: string; hours: number; share: number }[];
}

export function calculateProjectStats(records: ActivityRecord[]): ProjectStats {
    const descMap: Record<string, { count: number; min: number }> = {};
    const contribMap: Record<string, number> = {};
    let totalMin = 0;

    records.forEach(r => {
        // Descriptions
        const d = r.description;
        if (!descMap[d]) descMap[d] = { count: 0, min: 0 };
        descMap[d].count++;
        descMap[d].min += r.durationMinutes;

        // Contributors
        const e = r.employee;
        contribMap[e] = (contribMap[e] || 0) + r.durationMinutes;

        totalMin += r.durationMinutes;
    });

    const topDescriptions = Object.entries(descMap)
        .map(([desc, stats]) => ({
            desc,
            count: stats.count,
            hours: stats.min / 60
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 50); // Top 50

    const contributors = Object.entries(contribMap)
        .map(([name, min]) => ({
            name,
            hours: min / 60,
            share: totalMin ? min / totalMin : 0
        }))
        .sort((a, b) => b.hours - a.hours);

    return { topDescriptions, contributors };
}
