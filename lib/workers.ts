import { getDB } from "./db";

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
