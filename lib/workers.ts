import { getDB } from "./db";
import ExcelJS from "exceljs";

export interface Worker {
  id: number;
  manager_id: number;
  code: string;
  name: string;
  phone: string | null;
  team: string | null;
  active: number;
}

export function getWorkersByManagerId(managerId: number): Worker[] {
  const db = getDB();
  return db
    .prepare("SELECT * FROM workers WHERE manager_id = ? ORDER BY code ASC")
    .all(managerId) as Worker[];
}

export function getWorkerById(workerId: number): Worker | undefined {
  const db = getDB();
  return db.prepare("SELECT * FROM workers WHERE id = ?").get(workerId) as
    | Worker
    | undefined;
}

export function createWorker(
  managerId: number,
  code: string,
  name: string,
  phone: string | null,
  team: string | null
): Worker {
  const db = getDB();
  const stmt = db.prepare(
    "INSERT INTO workers (manager_id, code, name, phone, team, active) VALUES (?, ?, ?, ?, ?, 1)"
  );
  const result = stmt.run(managerId, code, name, phone, team);

  return getWorkerById(result.lastInsertRowid as number)!;
}

export function updateWorker(
  workerId: number,
  managerId: number,
  code: string,
  name: string,
  phone: string | null,
  team: string | null,
  active: number
): Worker {
  const db = getDB();
  db.prepare(
    "UPDATE workers SET code = ?, name = ?, phone = ?, team = ?, active = ? WHERE id = ? AND manager_id = ?"
  ).run(code, name, phone, team, active, workerId, managerId);

  return getWorkerById(workerId)!;
}

export function deleteWorker(workerId: number, managerId: number): void {
  const db = getDB();
  db.prepare("DELETE FROM workers WHERE id = ? AND manager_id = ?").run(
    workerId,
    managerId
  );
}

export function importWorkers(
  managerId: number,
  workers: Array<{
    code: string;
    name: string;
    phone?: string;
    team?: string;
    active?: boolean;
  }>
): { imported: number; errors: string[] } {
  const db = getDB();
  const errors: string[] = [];
  let imported = 0;

  const stmt = db.prepare(
    "INSERT OR REPLACE INTO workers (manager_id, code, name, phone, team, active) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const worker of workers) {
    try {
      if (!worker.code || !worker.name) {
        errors.push(`Row skipped: code and name are required`);
        continue;
      }

      stmt.run(
        managerId,
        worker.code,
        worker.name,
        worker.phone || null,
        worker.team || null,
        worker.active !== false ? 1 : 0
      );
      imported++;
    } catch (error) {
      errors.push(
        `Error importing worker ${worker.code}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return { imported, errors };
}

export function parseCSV(csvContent: string): Array<Record<string, string>> {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const records: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });

    records.push(record);
  }

  return records;
}

/**
 * Parse Excel file and return records
 */
export async function parseExcel(buffer: ArrayBuffer): Promise<{
  headers: string[];
  records: Array<Record<string, string>>;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Excel file is empty");
  }

  const headers: string[] = [];
  const records: Array<Record<string, string>> = [];

  // Get headers from first row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const headerValue = cell.value?.toString().trim().toLowerCase() || "";
    headers.push(headerValue);
  });

  // Process data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const record: Record<string, string> = {};
    let hasData = false;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        const value = cell.value?.toString().trim() || "";
        record[header] = value;
        if (value) hasData = true;
      }
    });

    // Only add rows that have at least one non-empty cell
    if (hasData) {
      records.push(record);
    }
  });

  return { headers, records };
}

/**
 * Auto-detect column mapping from CSV headers
 * Supports Vietnamese and English column names
 */
export interface ColumnMapping {
  code: string | null;
  name: string | null;
  phone: string | null;
  team: string | null;
  active: string | null;
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // Define Vietnamese and English variations for each field
  const codePatterns = [
    "mã nv",
    "mã nhân viên",
    "code",
    "mã",
    "employee code",
    "id",
    "stt",
  ];
  const namePatterns = [
    "họ tên",
    "tên",
    "name",
    "họ và tên",
    "full name",
    "nhân viên",
  ];
  const phonePatterns = [
    "điện thoại",
    "sdt",
    "số điện thoại",
    "phone",
    "mobile",
    "số điện thoại liên hệ",
  ];
  const teamPatterns = [
    "bộ phận",
    "tổ",
    "phòng ban",
    "department",
    "team",
    "phân xưởng",
    "chức danh",
  ];
  const activePatterns = [
    "trạng thái",
    "hoạt động",
    "active",
    "status",
    "enabled",
  ];

  const mapping: ColumnMapping = {
    code: findMatchingHeader(lowerHeaders, codePatterns),
    name: findMatchingHeader(lowerHeaders, namePatterns),
    phone: findMatchingHeader(lowerHeaders, phonePatterns),
    team: findMatchingHeader(lowerHeaders, teamPatterns),
    active: findMatchingHeader(lowerHeaders, activePatterns),
  };

  return mapping;
}

/**
 * Find the best matching header from a list of patterns
 */
function findMatchingHeader(
  headers: string[],
  patterns: string[]
): string | null {
  for (const pattern of patterns) {
    const match = headers.find(
      (h) => h === pattern || h.includes(pattern) || pattern.includes(h)
    );
    if (match) return match;
  }
  return null;
}

/**
 * Transform raw CSV records using column mapping
 */
export function transformRecordsByMapping(
  records: Array<Record<string, string>>,
  mapping: ColumnMapping
): Array<{
  code: string;
  name: string;
  phone?: string;
  team?: string;
  active?: boolean;
}> {
  return records
    .map((record) => {
      const transformed = {
        code: mapping.code ? record[mapping.code]?.trim() || "" : "",
        name: mapping.name ? record[mapping.name]?.trim() || "" : "",
        phone: mapping.phone ? record[mapping.phone]?.trim() || undefined : undefined,
        team: mapping.team ? record[mapping.team]?.trim() || undefined : undefined,
        active: mapping.active
          ? isActive(record[mapping.active])
          : undefined,
      };

      // Remove empty optional fields
      if (!transformed.phone) delete transformed.phone;
      if (!transformed.team) delete transformed.team;
      if (transformed.active === undefined) delete transformed.active;

      return transformed;
    })
    .filter((r) => r.code && r.name); // Filter out records without code or name
}

/**
 * Parse active/inactive status from various formats
 */
function isActive(value: string): boolean {
  if (!value) return true; // Default to active if not specified
  const lowerValue = value.toLowerCase().trim();
  const activeValues = [
    "true",
    "yes",
    "có",
    "1",
    "active",
    "hoạt động",
    "✓",
    "x",
  ];
  return activeValues.includes(lowerValue);
}

export function workersToCSV(workers: Worker[]): string {
  const headers = ["code", "name", "phone", "team", "active"];
  const rows = [
    headers.join(","),
    ...workers.map(
      (w) =>
        `"${w.code}","${w.name}","${w.phone || ""}","${w.team || ""}",${w.active}`
    ),
  ];
  return rows.join("\n");
}

/**
 * Convert workers to Excel format
 */
export async function workersToExcel(workers: Worker[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Danh sách nhân viên");

  // Define columns with Vietnamese headers
  worksheet.columns = [
    { header: "Mã NV", key: "code", width: 15 },
    { header: "Họ tên", key: "name", width: 25 },
    { header: "Điện thoại", key: "phone", width: 15 },
    { header: "Bộ phận", key: "team", width: 20 },
    { header: "Hoạt động", key: "active", width: 12 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  // Add data rows
  workers.forEach((worker) => {
    worksheet.addRow({
      code: worker.code,
      name: worker.name,
      phone: worker.phone || "",
      team: worker.team || "",
      active: worker.active ? "Có" : "Không",
    });
  });

  // Add borders to all cells with data
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate Excel template with sample data
 */
export async function generateExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Danh sách nhân viên");

  // Define columns with Vietnamese headers
  worksheet.columns = [
    { header: "Mã NV", key: "code", width: 15 },
    { header: "Họ tên", key: "name", width: 25 },
    { header: "Điện thoại", key: "phone", width: 15 },
    { header: "Bộ phận", key: "team", width: 20 },
    { header: "Hoạt động", key: "active", width: 12 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  // Add sample data
  const sampleData = [
    { code: "NV001", name: "Nguyễn Văn A", phone: "0912345678", team: "Sản xuất", active: "Có" },
    { code: "NV002", name: "Trần Thị B", phone: "0987654321", team: "Kế toán", active: "Có" },
    { code: "NV003", name: "Phạm Văn C", phone: "0901234567", team: "Kinh doanh", active: "Không" },
  ];

  sampleData.forEach((data) => {
    worksheet.addRow(data);
  });

  // Add borders to all cells with data
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Add note below the table
  const noteRow = worksheet.addRow([]);
  noteRow.getCell(1).value = "Lưu ý: Cột 'Hoạt động' nhập 'Có' hoặc 'Không'";
  noteRow.getCell(1).font = { italic: true, color: { argb: "FF666666" } };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
