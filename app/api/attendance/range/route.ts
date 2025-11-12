import { NextRequest, NextResponse } from "next/server";
import { getAttendanceByDateRange } from "@/lib/attendance";
import { getUserIdFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "fromDate and toDate are required" },
        { status: 400 }
      );
    }

    const records = await getAttendanceByDateRange(userId, fromDate, toDate);

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching attendance range:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
