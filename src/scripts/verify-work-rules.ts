import { splitActivity } from "../lib/workRules";

function runTest(name: string, startIso: string, endIso: string, expected: any) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const result = splitActivity(start, end);

    let pass = true;
    const diffs = [];

    for (const k of Object.keys(expected)) {
        // @ts-ignore
        if (result[k] !== expected[k]) {
            pass = false;
            // @ts-ignore
            diffs.push(`${k}: got ${result[k]} expected ${expected[k]}`);
        }
    }

    if (pass) {
        console.log(`PASS: ${name}`);
    } else {
        console.error(`FAIL: ${name}`);
        console.error(`   Range: ${startIso} - ${endIso}`);
        diffs.forEach(d => console.error(`   ${d}`));
    }
}

// Jakarta is UTC+7.
// So 08:00 Jakarta is 01:00 UTC.
// 12:00 Jakarta is 05:00 UTC.
// 13:00 Jakarta is 06:00 UTC.
// 17:00 Jakarta is 10:00 UTC.

console.log("Running Work Rules Tests (Assuming Inputs are UTC)...");

// Test 1: Pure Morning Work (Mon)
// Jakarta 09:00 - 10:00 (Mon) => UTC 02:00 - 03:00
runTest(
    "Mon Morning Work (1h)",
    "2023-10-23T02:00:00Z",
    "2023-10-23T03:00:00Z",
    { regularMinutes: 60, lunchMinutes: 0, overtimeMinutes: 0, weekendMinutes: 0 }
);

// Test 2: Lunch Overlap
// Jakarta 11:30 - 12:30 (Mon) => UTC 04:30 - 05:30
// Should be 30m Regular, 30m Lunch
runTest(
    "Mon Lunch Overlap (30m work, 30m lunch)",
    "2023-10-23T04:30:00Z",
    "2023-10-23T05:30:00Z",
    { regularMinutes: 30, lunchMinutes: 30, overtimeMinutes: 0, weekendMinutes: 0 }
);

// Test 3: Overtime Evening
// Jakarta 16:30 - 17:30 (Mon) => UTC 09:30 - 10:30
// Should be 30m Regular, 30m Overtime
runTest(
    "Mon Evening Overlap (30m work, 30m OT)",
    "2023-10-23T09:30:00Z",
    "2023-10-23T10:30:00Z",
    { regularMinutes: 30, lunchMinutes: 0, overtimeMinutes: 30, weekendMinutes: 0 }
);

// Test 4: Weekend
// Jakarta Sat 10:00 - 11:00 => UTC Sat 03:00 - 04:00
// 2023-10-28 is Saturday
runTest(
    "Saturday Work (1h)",
    "2023-10-28T03:00:00Z",
    "2023-10-28T04:00:00Z",
    { regularMinutes: 0, lunchMinutes: 0, overtimeMinutes: 0, weekendMinutes: 60 }
);

// Test 5: Standard Day Overlap (Mixed)
// 07:00 - 18:00 Jakarta (11h total)
// 07-08 (1h OT)
// 08-12 (4h Reg)
// 12-13 (1h Lunch)
// 13-17 (4h Reg)
// 17-18 (1h OT)
// Total: 8h Reg, 1h Lunch, 2h OT
// UTC: 00:00 - 11:00
runTest(
    "Full Day + OT",
    "2023-10-23T00:00:00Z",
    "2023-10-23T11:00:00Z",
    { regularMinutes: 8 * 60, lunchMinutes: 60, overtimeMinutes: 2 * 60, weekendMinutes: 0 }
);
