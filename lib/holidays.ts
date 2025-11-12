import { getDB } from "./db";

export interface Holiday {
  manager_id: number;
  date: string;
  name: string;
}

export function getHolidaysByManagerId(managerId: number): Holiday[] {
  const db = getDB();
  return db
    .prepare("SELECT * FROM holidays WHERE manager_id = ? ORDER BY date ASC")
    .all(managerId) as Holiday[];
}

export function getHolidayByDate(
  managerId: number,
  date: string
): Holiday | undefined {
  const db = getDB();
  return db
    .prepare("SELECT * FROM holidays WHERE manager_id = ? AND date = ?")
    .get(managerId, date) as Holiday | undefined;
}

export function createHoliday(
  managerId: number,
  date: string,
  name: string
): Holiday {
  const db = getDB();
  db.prepare(
    "INSERT INTO holidays (manager_id, date, name) VALUES (?, ?, ?)"
  ).run(managerId, date, name);

  return getHolidayByDate(managerId, date)!;
}

export function updateHoliday(
  managerId: number,
  date: string,
  name: string
): Holiday {
  const db = getDB();
  db.prepare("UPDATE holidays SET name = ? WHERE manager_id = ? AND date = ?").run(
    name,
    managerId,
    date
  );

  return getHolidayByDate(managerId, date)!;
}

export function deleteHoliday(managerId: number, date: string): void {
  const db = getDB();
  db.prepare("DELETE FROM holidays WHERE manager_id = ? AND date = ?").run(
    managerId,
    date
  );
}

export function getHolidaysInDateRange(
  managerId: number,
  fromDate: string,
  toDate: string
): Holiday[] {
  const db = getDB();
  return db
    .prepare(
      "SELECT * FROM holidays WHERE manager_id = ? AND date >= ? AND date <= ? ORDER BY date ASC"
    )
    .all(managerId, fromDate, toDate) as Holiday[];
}
