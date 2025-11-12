import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromSession } from "@/lib/auth";
import { getDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const body = await request.json();
    const { teamName, status, workDate, excludeWorkerIds = [] } = body;

    if (!teamName || !status || !workDate) {
      return NextResponse.json(
        { error: "Missing required fields: teamName, status, workDate" },
        { status: 400 }
      );
    }

    const db = getDB();

    // Get all active workers in this team (excluding specified workers)
    const workers = db
      .prepare(
        `
      SELECT id FROM workers
      WHERE manager_id = ? AND team = ? AND active = 1
      AND id NOT IN (${excludeWorkerIds.length > 0 ? excludeWorkerIds.map(() => "?").join(",") : "NULL"})
    `
      )
      .all(userId, teamName, ...excludeWorkerIds) as Array<{ id: number }>;

    if (workers.length === 0) {
      return NextResponse.json(
        { updated: 0, message: "No workers found in this team" },
        { status: 200 }
      );
    }

    let updated = 0;

    // Upsert attendance records for each worker
    for (const worker of workers) {
      const existing = db
        .prepare(
          `
        SELECT id FROM attendance
        WHERE manager_id = ? AND worker_id = ? AND work_date = ?
      `
        )
        .get(userId, worker.id, workDate) as { id: number } | undefined;

      if (existing) {
        db.prepare(
          `
          UPDATE attendance
          SET status = ?
          WHERE id = ?
        `
        ).run(status, existing.id);
      } else {
        db.prepare(
          `
          INSERT INTO attendance (manager_id, worker_id, work_date, status)
          VALUES (?, ?, ?, ?)
        `
        ).run(userId, worker.id, workDate, status);
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
