import { NextRequest, NextResponse } from "next/server";
import { getWorkersByManagerId, workersToCSV } from "@/lib/workers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workers = getWorkersByManagerId(parseInt(userId));
    const csv = workersToCSV(workers);

    const response = new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="workers.csv"',
      },
    });

    return response;
  } catch (error) {
    console.error("Error exporting workers:", error);
    return NextResponse.json(
      { error: "Failed to export workers" },
      { status: 500 }
    );
  }
}
