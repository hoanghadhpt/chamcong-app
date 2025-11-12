import { NextRequest, NextResponse } from "next/server";
import { getWorkersByManagerId, workersToCSV } from "@/lib/workers";
import { getUserIdFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const workers = getWorkersByManagerId(userId);
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
