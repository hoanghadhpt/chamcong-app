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

/**
 * Calculate total shift duration in minutes (accounting for breaks)
 * For overnight shifts, the calculation spans midnight
 */
export function calculateShiftDurationMinutes(shift: Shift): number {
  const [startHours, startMins] = shift.start_time.split(":").map(Number);
  const startTotalMins = startHours * 60 + startMins;

  const [endHours, endMins] = shift.end_time.split(":").map(Number);
  let endTotalMins = endHours * 60 + endMins;

  // For overnight shifts, add 24 hours to the end time
  if (shift.is_overnight === 1 && endTotalMins < startTotalMins) {
    endTotalMins += 24 * 60;
  }

  const durationMins = endTotalMins - startTotalMins;
  return Math.max(0, durationMins - shift.break_minutes);
}

/**
 * Get the work date for a check-in time given a shift
 * For overnight shifts, check-ins after midnight are considered part of the previous day's shift
 */
export function getWorkDateForCheckIn(
  clockDate: string,
  checkInTime: string,
  shift: Shift
): string {
  if (shift.is_overnight === 0) {
    // Regular shift: work date = clock date
    return clockDate;
  }

  // For overnight shifts:
  // If check-in time is >= shift start time, it's on the current date
  // If check-in time < shift start time, it belongs to the overnight shift from yesterday

  const [checkHours, checkMins] = checkInTime.split(":").map(Number);
  const checkTotalMins = checkHours * 60 + checkMins;

  const [startHours, startMins] = shift.start_time.split(":").map(Number);
  const startTotalMins = startHours * 60 + startMins;

  if (checkTotalMins >= startTotalMins) {
    // Check-in is after shift start time (late evening), on the current date
    return clockDate;
  } else {
    // Check-in is before shift start time (early morning), belongs to yesterday's overnight shift
    const date = new Date(clockDate);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
  }
}

/**
 * Check if a specific time falls within the overnight shift period
 */
export function isTimeInShift(timeStr: string, shift: Shift): boolean {
  const [checkHours, checkMins] = timeStr.split(":").map(Number);
  const checkTotalMins = checkHours * 60 + checkMins;

  const [startHours, startMins] = shift.start_time.split(":").map(Number);
  const startTotalMins = startHours * 60 + startMins;

  const [endHours, endMins] = shift.end_time.split(":").map(Number);
  const endTotalMins = endHours * 60 + endMins;

  if (shift.is_overnight === 0) {
    // Regular shift: start_time <= time <= end_time
    return checkTotalMins >= startTotalMins && checkTotalMins <= endTotalMins;
  } else {
    // Overnight shift: time >= start_time OR time <= end_time
    return checkTotalMins >= startTotalMins || checkTotalMins <= endTotalMins;
  }
}
