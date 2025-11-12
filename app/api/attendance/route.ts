import { NextRequest, NextResponse } from "next/server";
import {
  getAttendanceByDateRange,
  getAttendanceByDate,
  upsertAttendance,
} from "@/lib/attendance";
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

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const date = searchParams.get("date");

    let records;

    if (date) {
      records = getAttendanceByDate(userId, date);
    } else if (fromDate && toDate) {
      records = getAttendanceByDateRange(userId, fromDate, toDate);
    } else {
      return NextResponse.json(
        { error: "Please provide date or date range (from/to)" },
        { status: 400 }
      );
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const {
      workerId,
      workDate,
      status,
      checkIn,
      checkOut,
      lateMinutes,
      earlyMinutes,
      ot_1_5 = 0,
      ot_2_0 = 0,
      ot_3_0 = 0,
      note,
      shiftId,
      shiftAmount = 1.0,
    } = await request.json();

    if (!workerId || !workDate || !status) {
      return NextResponse.json(
        { error: "Worker ID, date, and status are required" },
        { status: 400 }
      );
    }

    const record = upsertAttendance(
      userId,
      workerId,
      workDate,
      status,
      checkIn || null,
      checkOut || null,
      lateMinutes || null,
      earlyMinutes || null,
      ot_1_5,
      ot_2_0,
      ot_3_0,
      note || null,
      shiftId || null,
      shiftAmount
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error upserting attendance:", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
