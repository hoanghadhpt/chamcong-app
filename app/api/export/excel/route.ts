import { NextRequest, NextResponse } from "next/server";
import {
  generateDetailExcel,
  generateMatrixExcel,
  DetailRecord,
} from "@/lib/excel";
import {
  getAttendanceByDateRange,
} from "@/lib/attendance";
import { getWorkersByManagerId } from "@/lib/workers";
import { getUserIdFromSession } from "@/lib/auth";

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

    const { fromDate, toDate, format = "detail" } = await request.json();

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "fromDate and toDate are required" },
        { status: 400 }
      );
    }

    const attendanceData = getAttendanceByDateRange(userId, fromDate, toDate);
    const workers = getWorkersByManagerId(userId);

    let buffer: Buffer;
    let filename: string;

    if (format === "matrix") {
      // Parse fromDate to get month and year
      const [year, month] = fromDate.split("-").slice(0, 2).map(Number);

      // Build attendance map for matrix
      const attendanceMap: { [key: string]: string } = {};
      const statusCodes: { [key: string]: string } = {
        present: "P",
        absent: "V",
        leave_paid: "LP",
        leave_unpaid: "LN",
        sick: "S",
        ot: "OT",
      };

      attendanceData.forEach((record) => {
        const key = `${record.worker_id}:${record.work_date}`;
        attendanceMap[key] = record.status ? (statusCodes[record.status as keyof typeof statusCodes] || "") : "";
      });

      const workersForMatrix = workers.map((w) => ({
        id: w.id,
        code: w.code,
        name: w.name,
        team: w.team || "",
      }));

      buffer = await generateMatrixExcel(month, year, workersForMatrix, attendanceMap);
      filename = `attendance_matrix_${month}_${year}.xlsx`;
    } else {
      // Detail format
      const detailData: DetailRecord[] = attendanceData.map((record) => ({
        date: record.work_date,
        workerCode: record.workerCode,
        workerName: record.workerName,
        team: record.team || "",
        status: record.status || "absent",
        checkIn: record.check_in,
        checkOut: record.check_out,
        lateMinutes: record.late_minutes,
        earlyMinutes: record.early_minutes,
        ot_1_5: record.ot_1_5,
        ot_2_0: record.ot_2_0,
        ot_3_0: record.ot_3_0,
        note: record.note,
      }));

      buffer = await generateDetailExcel(fromDate, toDate, detailData);
      filename = `attendance_detail_${fromDate}_to_${toDate}.xlsx`;
    }

    const response = new NextResponse(Buffer.from(buffer) as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

    return response;
  } catch (error) {
    console.error("Error exporting Excel:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel file" },
      { status: 500 }
    );
  }
}
