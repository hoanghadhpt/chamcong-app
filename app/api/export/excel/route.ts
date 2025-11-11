import { NextRequest, NextResponse } from "next/server";
import { generateAttendanceExcel } from "@/lib/excel";
import { getAttendanceByDateRange } from "@/lib/attendance";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fromDate, toDate } = await request.json();

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { error: "fromDate and toDate are required" },
        { status: 400 }
      );
    }

    const attendanceData = getAttendanceByDateRange(
      parseInt(userId),
      fromDate,
      toDate
    );

    const formattedData = attendanceData.map((record) => ({
      workerCode: record.workerCode,
      workerName: record.workerName,
      team: record.team || "",
      workDate: record.work_date,
      status: record.status || "",
      checkIn: record.check_in,
      checkOut: record.check_out,
      note: record.note,
    }));

    const buffer = await generateAttendanceExcel(fromDate, toDate, formattedData);

    const response = new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="attendance_${fromDate}_to_${toDate}.xlsx"`,
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
