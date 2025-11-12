import { NextRequest, NextResponse } from "next/server";
import { getWorkersByManagerId, workersToExcel } from "@/lib/workers";
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
    const buffer = await workersToExcel(workers);

    // Get current date for filename
    const date = new Date().toISOString().split("T")[0];

    const response = new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="danh_sach_nhan_vien_${date}.xlsx"`,
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
