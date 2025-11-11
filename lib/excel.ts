import ExcelJS from "exceljs";

export async function generateAttendanceExcel(
  fromDate: string,
  toDate: string,
  attendanceData: Array<{
    workerCode: string;
    workerName: string;
    team: string;
    workDate: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    note: string | null;
  }>
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance");

  // Set column widths
  worksheet.columns = [
    { header: "Worker Code", key: "workerCode", width: 12 },
    { header: "Worker Name", key: "workerName", width: 20 },
    { header: "Team", key: "team", width: 15 },
    { header: "Date", key: "workDate", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Check In", key: "checkIn", width: 12 },
    { header: "Check Out", key: "checkOut", width: 12 },
    { header: "Note", key: "note", width: 20 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  headerRow.alignment = { horizontal: "center", vertical: "center" };

  // Add title
  worksheet.insertRow(1, null);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Attendance Report: ${fromDate} to ${toDate}`;
  titleCell.font = { bold: true, size: 14 };
  worksheet.mergeCells("A1:H1");

  // Add data
  attendanceData.forEach((record) => {
    worksheet.addRow({
      workerCode: record.workerCode,
      workerName: record.workerName,
      team: record.team,
      workDate: new Date(record.workDate).toLocaleDateString(),
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      note: record.note,
    });
  });

  // Add borders and alignment
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { horizontal: "left", vertical: "center", wrapText: true };
      });
    }
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}
