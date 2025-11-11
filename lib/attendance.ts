import { getDB } from "./db";

export interface AttendanceRecord {
  id: number;
  manager_id: number;
  worker_id: number;
  work_date: string;
  status: string | null;
  check_in: string | null;
  check_out: string | null;
  note: string | null;
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
  checkIn: string | null,
  checkOut: string | null,
  note: string | null
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
       SET status = ?, check_in = ?, check_out = ?, note = ?
       WHERE id = ?`
    ).run(status, checkIn, checkOut, note, existing.id);

    return db
      .prepare("SELECT * FROM attendance WHERE id = ?")
      .get(existing.id) as AttendanceRecord;
  } else {
    const result = db
      .prepare(
        `INSERT INTO attendance (manager_id, worker_id, work_date, status, check_in, check_out, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(managerId, workerId, workDate, status, checkIn, checkOut, note);

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
