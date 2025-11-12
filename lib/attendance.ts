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

export async function getAttendanceByDateRange(
  managerId: number,
  fromDate: string,
  toDate: string
): Promise<Array<
  AttendanceRecord & {
    workerCode: string;
    workerName: string;
    team: string | null;
  }
>> {
  const db = getDB();
  const result = await db.query(
    `
      SELECT
        a.*,
        w.code as "workerCode",
        w.name as "workerName",
        w.team as team
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.manager_id = $1 AND a.work_date >= $2 AND a.work_date <= $3
      ORDER BY a.work_date DESC, w.code ASC
    `,
    [managerId, fromDate, toDate]
  );
  return result.rows as Array<
    AttendanceRecord & {
      workerCode: string;
      workerName: string;
      team: string | null;
    }
  >;
}

export async function getAttendanceByDate(
  managerId: number,
  workDate: string
): Promise<Array<
  AttendanceRecord & {
    workerCode: string;
    workerName: string;
    team: string | null;
  }
>> {
  const db = getDB();
  const result = await db.query(
    `
      SELECT
        a.*,
        w.code as "workerCode",
        w.name as "workerName",
        w.team as team
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.manager_id = $1 AND a.work_date = $2
      ORDER BY w.code ASC
    `,
    [managerId, workDate]
  );
  return result.rows as Array<
    AttendanceRecord & {
      workerCode: string;
      workerName: string;
      team: string | null;
    }
  >;
}

export async function getAttendanceById(
  attendanceId: number
): Promise<(AttendanceRecord & { workerCode: string; workerName: string; team: string | null }) | undefined> {
  const db = getDB();
  const result = await db.query(
    `
      SELECT
        a.*,
        w.code as "workerCode",
        w.name as "workerName",
        w.team as team
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      WHERE a.id = $1
    `,
    [attendanceId]
  );
  return result.rows[0] as
    | (AttendanceRecord & { workerCode: string; workerName: string; team: string | null })
    | undefined;
}

export async function upsertAttendance(
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
): Promise<AttendanceRecord> {
  const db = getDB();

  const existingResult = await db.query(
    "SELECT id FROM attendance WHERE manager_id = $1 AND worker_id = $2 AND work_date = $3",
    [managerId, workerId, workDate]
  );

  const existing = existingResult.rows[0] as { id: number } | undefined;

  if (existing) {
    await db.query(
      `UPDATE attendance
       SET status = $1, check_in = $2, check_out = $3, late_minutes = $4, early_minutes = $5,
           ot_1_5 = $6, ot_2_0 = $7, ot_3_0 = $8, note = $9, shift_id = $10, shift_amount = $11
       WHERE id = $12`,
      [
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
      ]
    );

    const updatedResult = await db.query(
      "SELECT * FROM attendance WHERE id = $1",
      [existing.id]
    );
    return updatedResult.rows[0] as AttendanceRecord;
  } else {
    const result = await db.query(
      `INSERT INTO attendance (manager_id, worker_id, work_date, status, check_in, check_out, late_minutes, early_minutes, ot_1_5, ot_2_0, ot_3_0, note, shift_id, shift_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
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
      ]
    );

    return result.rows[0] as AttendanceRecord;
  }
}

export async function deleteAttendance(attendanceId: number, managerId: number): Promise<void> {
  const db = getDB();
  await db.query(
    "DELETE FROM attendance WHERE id = $1 AND manager_id = $2",
    [attendanceId, managerId]
  );
}
