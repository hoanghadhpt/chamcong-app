import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromSession } from "@/lib/auth";
import { calculateMonthlyPayroll } from "@/lib/payroll";

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
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json(
        { error: "Invalid month or year" },
        { status: 400 }
      );
    }

    const payroll = await calculateMonthlyPayroll(userId, month, year);

    return NextResponse.json(payroll);
  } catch (error) {
    console.error("Error calculating payroll:", error);
    return NextResponse.json(
      { error: "Failed to calculate payroll" },
      { status: 500 }
    );
  }
}
