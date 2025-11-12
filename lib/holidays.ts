import { getDB } from "./db";

export interface Holiday {
  manager_id: number;
  date: string;
  name: string;
}

export async function getHolidaysByManagerId(managerId: number): Promise<Holiday[]> {
  const db = getDB();
  const result = await db.query(
    "SELECT * FROM holidays WHERE manager_id = $1 ORDER BY date ASC",
    [managerId]
  );
  return result.rows as Holiday[];
}

export async function getHolidayByDate(
  managerId: number,
  date: string
): Promise<Holiday | undefined> {
  const db = getDB();
  const result = await db.query(
    "SELECT * FROM holidays WHERE manager_id = $1 AND date = $2",
    [managerId, date]
  );
  return result.rows[0] as Holiday | undefined;
}

export async function createHoliday(
  managerId: number,
  date: string,
  name: string
): Promise<Holiday> {
  const db = getDB();
  await db.query(
    "INSERT INTO holidays (manager_id, date, name) VALUES ($1, $2, $3)",
    [managerId, date, name]
  );

  const holiday = await getHolidayByDate(managerId, date);
  return holiday!;
}

export async function updateHoliday(
  managerId: number,
  date: string,
  name: string
): Promise<Holiday> {
  const db = getDB();
  await db.query(
    "UPDATE holidays SET name = $1 WHERE manager_id = $2 AND date = $3",
    [name, managerId, date]
  );

  const holiday = await getHolidayByDate(managerId, date);
  return holiday!;
}

export async function deleteHoliday(managerId: number, date: string): Promise<void> {
  const db = getDB();
  await db.query(
    "DELETE FROM holidays WHERE manager_id = $1 AND date = $2",
    [managerId, date]
  );
}

export async function getHolidaysInDateRange(
  managerId: number,
  fromDate: string,
  toDate: string
): Promise<Holiday[]> {
  const db = getDB();
  const result = await db.query(
    "SELECT * FROM holidays WHERE manager_id = $1 AND date >= $2 AND date <= $3 ORDER BY date ASC",
    [managerId, fromDate, toDate]
  );
  return result.rows as Holiday[];
}
