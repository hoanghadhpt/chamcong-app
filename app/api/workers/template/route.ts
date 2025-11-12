import { NextResponse } from "next/server";
import { generateExcelTemplate } from "@/lib/workers";

export async function GET() {
  try {
    // Generate Excel template with sample data
    const buffer = await generateExcelTemplate();

    // Get current date for filename
    const date = new Date().toISOString().split("T")[0];

    // Create response with Excel file
    const response = new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="mau_danh_sach_nhan_vien_${date}.xlsx"`,
      },
    });

    return response;
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
