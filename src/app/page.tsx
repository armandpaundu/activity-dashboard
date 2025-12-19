import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { fetchAndNormalizeData } from "@/lib/normalization";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Suspense } from "react";

export const revalidate = 300; // Revalidate every 5 minutes

const DEFAULT_DATA_SOURCE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8s1IAVtsKEpk11tlzf4wFqHOTs3R0GucbmQ52B5NowV3MrcAs9Hd-ANVsMfNqChYxObfl-TQ46SxI/pub?output=csv";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home(props: PageProps) {
  const searchParams = await props.searchParams;
  const source = typeof searchParams.id === "string" ? searchParams.id : DEFAULT_DATA_SOURCE;

  try {
    const data = await fetchAndNormalizeData(source);

    // Check if critical errors exist (e.g. no records)
    if (data.records.length === 0 && data.errors.length > 0) {
      throw new Error("No valid records found. Check the sheet format or source.");
    }

    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0B1020] flex items-center justify-center text-white">Loading data...</div>}>
        <DashboardClient
          initialData={data.records}
          lastUpdated={new Date().toISOString()} // fetchAndNormalize doesn't return date yet, assume now or update it
          parsingErrors={data.errors}
        />
      </Suspense>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "An unknown error occurred."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
