import ExcelJS from "exceljs";
import { formatDate } from "./i18n";

export interface DetailRecord {
  date: string;
  workerCode: string;
  workerName: string;
  team: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number | null;
  earlyMinutes: number | null;
  ot_1_5: number;
  ot_2_0: number;
  ot_3_0: number;
  note: string | null;
}

export interface MatrixRecord {
  workerCode: string;
  workerName: string;
  team: string;
  dailyRecords: { [date: string]: string }; // date -> status code
}

const STATUS_CODES: { [key: string]: string } = {
  present: "P",
  absent: "V",
  leave_paid: "LP",
  leave_unpaid: "LN",
  sick: "S",
  ot: "OT",
};

export async function generateDetailExcel(
  fromDate: string,
  toDate: string,
  attendanceData: DetailRecord[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Chi tiết");

  // Set column widths
  worksheet.columns = [
    { header: "Ngày", key: "date", width: 12 },
    { header: "Mã NV", key: "workerCode", width: 10 },
    { header: "Họ tên", key: "workerName", width: 20 },
    { header: "Bộ phận", key: "team", width: 15 },
    { header: "Trạng thái", key: "status", width: 12 },
    { header: "Vào", key: "checkIn", width: 10 },
    { header: "Ra", key: "checkOut", width: 10 },
    { header: "Trễ (phút)", key: "lateMinutes", width: 10 },
    { header: "Sớm (phút)", key: "earlyMinutes", width: 10 },
    { header: "OT 1.5x", key: "ot_1_5", width: 8 },
    { header: "OT 2.0x", key: "ot_2_0", width: 8 },
    { header: "OT 3.0x", key: "ot_3_0", width: 8 },
    { header: "Ghi chú", key: "note", width: 20 },
  ];

  // Add title
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `Báo cáo chấm công: ${formatDate(fromDate)} đến ${formatDate(toDate)}`;
  titleCell.font = { bold: true, size: 14 };
  worksheet.mergeCells("A1:M1");

  // Style header row
  const headerRow = worksheet.getRow(2);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  headerRow.alignment = { horizontal: "center" as any, vertical: "middle" as any };

  // Add data (starting from row 3)
  let rowNum = 3;
  attendanceData.forEach((record) => {
    const row = worksheet.getRow(rowNum);
    row.values = {
      date: formatDate(record.date),
      workerCode: record.workerCode,
      workerName: record.workerName,
      team: record.team,
      status: getStatusLabel(record.status),
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      lateMinutes: record.lateMinutes || "-",
      earlyMinutes: record.earlyMinutes || "-",
      ot_1_5: record.ot_1_5 || "-",
      ot_2_0: record.ot_2_0 || "-",
      ot_3_0: record.ot_3_0 || "-",
      note: record.note,
    };

    // Add borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" as any, vertical: "middle" as any, wrapText: true };
    });

    rowNum++;
  });

  // Freeze header rows
  worksheet.views = [
    { state: "frozen", ySplit: 2, xSplit: 3, activeCell: "D3" } as any,
  ];

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

export async function generateMatrixExcel(
  month: number,
  year: number,
  workers: Array<{ id: number; code: string; name: string; team: string }>,
  attendanceData: { [key: string]: string } // key: "worker_id:YYYY-MM-DD", value: status code
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`${month}/${year}`);

  const daysInMonth = new Date(year, month, 0).getDate();
  const startDate = new Date(year, month - 1, 1);

  // Build columns: Code, Name, Team, then day 1-31
  const columns = [
    { header: "Mã NV", key: "code", width: 10 },
    { header: "Họ tên", key: "name", width: 20 },
    { header: "Bộ phận", key: "team", width: 15 },
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    columns.push({
      header: `${day}`,
      key: `day_${day}`,
      width: 4,
    });
  }

  // Summary columns
  columns.push({ header: "Có mặt", key: "present", width: 6 });
  columns.push({ header: "Vắng", key: "absent", width: 6 });
  columns.push({ header: "Phép", key: "leave", width: 6 });
  columns.push({ header: "Ốm", key: "sick", width: 6 });
  columns.push({ header: "OT", key: "ot_hours", width: 6 });

  worksheet.columns = columns;

  // Style title row
  const titleRow = worksheet.getRow(1);
  titleRow.values = [
    `Ma trận chấm công - Tháng ${month}/${year}`,
  ];
  titleRow.font = { bold: true, size: 14 };
  titleRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3B82F6" },
  };
  worksheet.mergeCells(`A1:${getLetter(columns.length)}1`);

  // Style header row
  const headerRow = worksheet.getRow(2);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  headerRow.alignment = { horizontal: "center" as any, vertical: "middle" as any };

  // Add worker data
  let rowNum = 3;
  const summaries = {
    present: 0,
    absent: 0,
    leave: 0,
    sick: 0,
    ot_hours: 0,
  };

  workers.forEach((worker) => {
    const row = worksheet.getRow(rowNum);
    const rowData: any = {
      code: worker.code,
      name: worker.name,
      team: worker.team,
    };

    let workerPresent = 0,
      workerAbsent = 0,
      workerLeave = 0,
      workerSick = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const key = `${worker.id}:${dateStr}`;
      const status = attendanceData[key] || "";
      rowData[`day_${day}`] = status;

      // Count for summary
      if (status === "P") workerPresent++;
      else if (status === "V") workerAbsent++;
      else if (status === "LP" || status === "LN") workerLeave++;
      else if (status === "S") workerSick++;
    }

    rowData.present = workerPresent;
    rowData.absent = workerAbsent;
    rowData.leave = workerLeave;
    rowData.sick = workerSick;
    rowData.ot_hours = "-";

    row.values = rowData;

    // Center align all cells
    row.eachCell((cell, colNum) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" as any, vertical: "middle" as any };

      // Bold day columns if weekend
      if (colNum > 3) {
        const dayNum = colNum - 3;
        const date = new Date(year, month - 1, dayNum);
        if (date.getDay() === 0 || date.getDay() === 6) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE5E7EB" },
          };
        }
      }
    });

    summaries.present += workerPresent;
    summaries.absent += workerAbsent;
    summaries.leave += workerLeave;
    summaries.sick += workerSick;

    rowNum++;
  });

  // Freeze panes
  worksheet.views = [
    { state: "frozen", xSplit: 3, ySplit: 2, activeCell: "D3" } as any,
  ];

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    present: "Có mặt",
    absent: "Vắng",
    leave_paid: "Phép có lương",
    leave_unpaid: "Phép không lương",
    sick: "Ốm",
    ot: "Tăng ca",
  };
  return labels[status] || status;
}

function getLetter(col: number): string {
  let letter = "";
  while (col > 0) {
    col--;
    letter = String.fromCharCode(65 + (col % 26)) + letter;
    col = Math.floor(col / 26);
  }
  return letter;
}
