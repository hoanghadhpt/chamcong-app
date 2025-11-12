import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromSession } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const body = await request.json();
    const { teamName, status, workDate, excludeWorkerIds = [], shiftAmount = 1.0 } = body;

    if (!teamName || !status || !workDate) {
      return NextResponse.json(
        { error: "Missing required fields: teamName, status, workDate" },
        { status: 400 }
      );
    }

    const db = getDB();

    // Get all active workers in this team (excluding specified workers)
    let workerQuery = `
      SELECT id FROM workers
      WHERE manager_id = $1 AND team = $2 AND active = 1
    `;
    const workerParams: (string | number)[] = [userId, teamName];

    if (excludeWorkerIds.length > 0) {
      const placeholders = excludeWorkerIds.map((_id: number, i: number) => `$${i + 3}`).join(",");
      workerQuery += ` AND id NOT IN (${placeholders})`;
      workerParams.push(...excludeWorkerIds);
    }

    const workersResult = await db.query(workerQuery, workerParams);
    const workers = workersResult.rows as Array<{ id: number }>;

    if (workers.length === 0) {
      return NextResponse.json(
        { updated: 0, message: "No workers found in this team" },
        { status: 200 }
      );
    }

    let updated = 0;

    // Upsert attendance records for each worker
    for (const worker of workers) {
      const existingResult = await db.query(
        `
        SELECT id FROM attendance
        WHERE manager_id = $1 AND worker_id = $2 AND work_date = $3
      `,
        [userId, worker.id, workDate]
      );
      const existing = existingResult.rows[0] as { id: number } | undefined;

      if (existing) {
        await db.query(
          `
          UPDATE attendance
          SET status = $1, shift_amount = $2
          WHERE id = $3
        `,
          [status, shiftAmount, existing.id]
        );
      } else {
        await db.query(
          `
          INSERT INTO attendance (manager_id, worker_id, work_date, status, shift_amount)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [userId, worker.id, workDate, status, shiftAmount]
        );
      }

      updated++;
    }

    return NextResponse.json({
      updated,
      teamName,
      status,
      workDate,
      message: `Successfully marked ${updated} workers as ${status}`,
    });
  } catch (error) {
    console.error("Error in batch mark attendance:", error);
    return NextResponse.json(
      { error: "Failed to batch mark attendance" },
      { status: 500 }
    );
  }
}
