import { getDB } from "./db";

export interface AttendanceRecord {
  id: number;
  manager_id: number;
  worker_id: number;
  work_date: string;
  status: string | null;
  check_in: string | null;
  check_out: string | null;
  late_minutes: number | null;
  early_minutes: number | null;
  ot_1_5: number;
  ot_2_0: number;
  ot_3_0: number;
  note: string | null;
  shift_id: number | null;
  shift_amount: number;
}

export function getAttendanceByDateRange(
  managerId: number,
  fromDate: string,
  toDate: string
): Array<
  AttendanceRecord & {
    workerCode: string;
    workerName: string;
    team: string | null;
  }
> {
  const db = getDB();
  return db
    .prepare(
      `
      SELECT
        a.*,
        w.code as workerCode,
        w.name as workerName,
        w.team as team
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.manager_id = ? AND a.work_date >= ? AND a.work_date <= ?
      ORDER BY a.work_date DESC, w.code ASC
    `
    )
    .all(managerId, fromDate, toDate) as Array<
    AttendanceRecord & {
      workerCode: string;
      workerName: string;
      team: string | null;
    }
  >;
}

export function getAttendanceByDate(
  managerId: number,
  workDate: string
): Array<
  AttendanceRecord & {
    workerCode: string;
    workerName: string;
    team: string | null;
  }
> {
  const db = getDB();
  return db
    .prepare(
      `
      SELECT
        a.*,
        w.code as workerCode,
        w.name as workerName,
        w.team as team
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.manager_id = ? AND a.work_date = ?
      ORDER BY w.code ASC
    `
    )
    .all(managerId, workDate) as Array<
    AttendanceRecord & {
      workerCode: string;
      workerName: string;
      team: string | null;
    }
  >;
}

export function getAttendanceById(
  attendanceId: number
): (AttendanceRecord & { workerCode: string; workerName: string; team: string | null }) | undefined {
  const db = getDB();
  return db
    .prepare(
      `
      SELECT
        a.*,
        w.code as workerCode,
        w.name as workerName,
        w.team as team
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.id = ?
    `
    )
    .get(attendanceId) as
    | (AttendanceRecord & { workerCode: string; workerName: string; team: string | null })
    | undefined;
}

export function upsertAttendance(
  managerId: number,
  workerId: number,
  workDate: string,
  status: string,
  checkIn: string | null = null,
  checkOut: string | null = null,
  lateMinutes: number | null = null,
  earlyMinutes: number | null = null,
  ot_1_5: number = 0,
  ot_2_0: number = 0,
  ot_3_0: number = 0,
  note: string | null = null,
  shiftId: number | null = null,
  shiftAmount: number = 1.0
): AttendanceRecord {
  const db = getDB();

  const existing = db
    .prepare(
      "SELECT id FROM attendance WHERE manager_id = ? AND worker_id = ? AND work_date = ?"
    )
    .get(managerId, workerId, workDate) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE attendance
       SET status = ?, check_in = ?, check_out = ?, late_minutes = ?, early_minutes = ?,
           ot_1_5 = ?, ot_2_0 = ?, ot_3_0 = ?, note = ?, shift_id = ?, shift_amount = ?
       WHERE id = ?`
    ).run(
      status,
      checkIn,
      checkOut,
      lateMinutes,
      earlyMinutes,
      ot_1_5,
      ot_2_0,
      ot_3_0,
      note,
      shiftId,
      shiftAmount,
      existing.id
    );

    return db
      .prepare("SELECT * FROM attendance WHERE id = ?")
      .get(existing.id) as AttendanceRecord;
  } else {
    const result = db
      .prepare(
        `INSERT INTO attendance (manager_id, worker_id, work_date, status, check_in, check_out, late_minutes, early_minutes, ot_1_5, ot_2_0, ot_3_0, note, shift_id, shift_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        managerId,
        workerId,
        workDate,
        status,
        checkIn,
        checkOut,
        lateMinutes,
        earlyMinutes,
        ot_1_5,
        ot_2_0,
        ot_3_0,
        note,
        shiftId,
        shiftAmount
      );

    return db
      .prepare("SELECT * FROM attendance WHERE id = ?")
      .get(result.lastInsertRowid) as AttendanceRecord;
  }
}

export function deleteAttendance(attendanceId: number, managerId: number): void {
  const db = getDB();
  db.prepare("DELETE FROM attendance WHERE id = ? AND manager_id = ?").run(
    attendanceId,
    managerId
  );
}
