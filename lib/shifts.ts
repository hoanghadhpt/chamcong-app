import { getDB } from "./db";

export interface Shift {
  id: number;
  manager_id: number;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_overnight: number;
}

export function getShiftsByManagerId(managerId: number): Shift[] {
  const db = getDB();
  return db
    .prepare("SELECT * FROM shifts WHERE manager_id = ? ORDER BY start_time ASC")
    .all(managerId) as Shift[];
}

export function getShiftById(shiftId: number): Shift | undefined {
  const db = getDB();
  return db
    .prepare("SELECT * FROM shifts WHERE id = ?")
    .get(shiftId) as Shift | undefined;
}

export function createShift(
  managerId: number,
  name: string,
  startTime: string,
  endTime: string,
  breakMinutes: number = 0,
  isOvernight: number = 0
): Shift {
  const db = getDB();
  const stmt = db.prepare(
    "INSERT INTO shifts (manager_id, name, start_time, end_time, break_minutes, is_overnight) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    managerId,
    name,
    startTime,
    endTime,
    breakMinutes,
    isOvernight
  );

  return getShiftById(result.lastInsertRowid as number)!;
}

export function updateShift(
  shiftId: number,
  managerId: number,
  name: string,
  startTime: string,
  endTime: string,
  breakMinutes: number,
  isOvernight: number
): Shift {
  const db = getDB();
  db.prepare(
    "UPDATE shifts SET name = ?, start_time = ?, end_time = ?, break_minutes = ?, is_overnight = ? WHERE id = ? AND manager_id = ?"
  ).run(name, startTime, endTime, breakMinutes, isOvernight, shiftId, managerId);

  return getShiftById(shiftId)!;
}

export function deleteShift(shiftId: number, managerId: number): void {
  const db = getDB();
  db.prepare("DELETE FROM shifts WHERE id = ? AND manager_id = ?").run(
    shiftId,
    managerId
  );
}
