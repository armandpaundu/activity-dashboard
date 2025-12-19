import { NextResponse } from "next/server";
import { fetchAndNormalizeData } from "@/lib/normalization";

export const revalidate = 300; // 5 minutes

const DEFAULT_DATA_SOURCE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8s1IAVtsKEpk11tlzf4wFqHOTs3R0GucbmQ52B5NowV3MrcAs9Hd-ANVsMfNqChYxObfl-TQ46SxI/pub?output=csv";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || DEFAULT_DATA_SOURCE;

    try {
        const result = await fetchAndNormalizeData(source);

        return NextResponse.json({
            records: result.records,
            errors: result.errors,
            meta: {
                totalRows: result.totalRows,
                validCount: result.records.length,
                errorCount: result.errors.length,
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch data", details: String(error) },
            { status: 500 }
        );
    }
}
