import { NextRequest, NextResponse } from "next/server";
import {
  createShift,
  getShiftsByManagerId,
  updateShift,
  deleteShift,
} from "@/lib/shifts";
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

    const shifts = await getShiftsByManagerId(userId);
    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
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

    const userId = await getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { name, start_time, end_time, break_minutes = 0, is_overnight = 0 } =
      await request.json();

    if (!name || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Name, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    const shift = await createShift(
      userId,
      name,
      start_time,
      end_time,
      break_minutes,
      is_overnight
    );

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const {
      id,
      name,
      start_time,
      end_time,
      break_minutes = 0,
      is_overnight = 0,
    } = await request.json();

    if (!id || !name || !start_time || !end_time) {
      return NextResponse.json(
        { error: "ID, name, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    const shift = await updateShift(
      id,
      userId,
      name,
      start_time,
      end_time,
      break_minutes,
      is_overnight
    );

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json(
      { error: "Failed to update shift" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const shiftId = searchParams.get("id");

    if (!shiftId) {
      return NextResponse.json(
        { error: "Shift ID is required" },
        { status: 400 }
      );
    }

    await deleteShift(parseInt(shiftId), userId);

    return NextResponse.json({ message: "Shift deleted successfully" });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json(
      { error: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
