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
