import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Create sample CSV with proper headers and format
    const headers = ["mã_nv", "họ_tên", "điện_thoại", "bộ_phận", "hoạt_động"];
    const sampleData = [
      ["NV001", "Nguyễn Văn A", "0912345678", "Sản xuất", "Có"],
      ["NV002", "Trần Thị B", "0987654321", "Kế toán", "Có"],
      ["NV003", "Phạm Văn C", "0901234567", "Kinh doanh", "Không"],
    ];

    // Build CSV content
    const csvLines = [
      headers.join(","),
      ...sampleData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ];
    const csvContent = csvLines.join("\n");

    // Create response with CSV content
    const response = new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="chamcong_sample_workers.csv"',
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
