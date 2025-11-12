import Database from "better-sqlite3";
import path from "path";
import { execSync } from "child_process";

let db: Database.Database | null = null;

const DB_PATH = path.join(process.cwd(), "data.db");

export function getDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const database = db!;

  // Check if sessions table exists and has user_agent column
  const sessionTableExists = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
    )
    .get() as { name: string } | undefined;

  if (sessionTableExists) {
    // Check if user_agent column exists
    const sessionColumns = database
      .prepare(
        "PRAGMA table_info(sessions);"
      )
      .all() as Array<{ name: string }>;

    const hasUserAgent = sessionColumns.some((col) => col.name === "user_agent");

    if (!hasUserAgent) {
      // Migrate existing sessions table by adding missing columns
      console.log("Migrating sessions table: adding user_agent and ip columns...");
      database.exec(`
        ALTER TABLE sessions ADD COLUMN user_agent TEXT;
        ALTER TABLE sessions ADD COLUMN ip TEXT;
      `);
    }
  }

  // Check if attendance table exists and add missing columns if needed
  const attendanceTableExists = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='attendance'"
    )
    .get() as { name: string } | undefined;

  if (attendanceTableExists) {
    const attendanceColumns = database
      .prepare(
        "PRAGMA table_info(attendance);"
      )
      .all() as Array<{ name: string }>;

    const columnNames = attendanceColumns.map((col) => col.name);
    const needsLateMinutes = !columnNames.includes("late_minutes");
    const needsEarlyMinutes = !columnNames.includes("early_minutes");
    const needsOT = !columnNames.includes("ot_1_5");
    const needsShiftId = !columnNames.includes("shift_id");

    if (needsLateMinutes || needsEarlyMinutes || needsOT || needsShiftId) {
      console.log("Migrating attendance table: adding new columns...");
      const alterStmts = [];
      if (needsLateMinutes) alterStmts.push("ALTER TABLE attendance ADD COLUMN late_minutes INTEGER;");
      if (needsEarlyMinutes) alterStmts.push("ALTER TABLE attendance ADD COLUMN early_minutes INTEGER;");
      if (needsOT) {
        alterStmts.push("ALTER TABLE attendance ADD COLUMN ot_1_5 INTEGER DEFAULT 0;");
        alterStmts.push("ALTER TABLE attendance ADD COLUMN ot_2_0 INTEGER DEFAULT 0;");
        alterStmts.push("ALTER TABLE attendance ADD COLUMN ot_3_0 INTEGER DEFAULT 0;");
      }
      if (needsShiftId) alterStmts.push("ALTER TABLE attendance ADD COLUMN shift_id INTEGER REFERENCES shifts(id);");

      database.exec(alterStmts.join("\n"));
    }
  }

  // Check if all new tables exist
  const tables = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'sessions', 'workers', 'shifts', 'settings', 'holidays', 'attendance')"
    )
    .all() as { name: string }[];

  if (tables.length === 7) {
    return; // Schema fully updated
  }

  // Create tables if they don't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_agent TEXT,
      ip TEXT,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      team TEXT,
      active INTEGER DEFAULT 1,
      UNIQUE(manager_id, code)
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      break_minutes INTEGER DEFAULT 0,
      is_overnight INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      manager_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      workday_minutes INTEGER DEFAULT 480,
      round_step_minutes INTEGER DEFAULT 15,
      late_grace INTEGER DEFAULT 5,
      early_grace INTEGER DEFAULT 5,
      default_shift_id INTEGER REFERENCES shifts(id),
      locale TEXT DEFAULT 'vi-VN',
      tz TEXT DEFAULT 'Asia/Ho_Chi_Minh',
      enable_gps INTEGER DEFAULT 0,
      enable_selfie INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS holidays (
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      PRIMARY KEY (manager_id, date)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      work_date TEXT NOT NULL,
      status TEXT,
      check_in TEXT,
      check_out TEXT,
      late_minutes INTEGER,
      early_minutes INTEGER,
      ot_1_5 INTEGER DEFAULT 0,
      ot_2_0 INTEGER DEFAULT 0,
      ot_3_0 INTEGER DEFAULT 0,
      note TEXT,
      shift_id INTEGER REFERENCES shifts(id),
      UNIQUE(manager_id, worker_id, work_date)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_workers_manager_id ON workers(manager_id);
    CREATE INDEX IF NOT EXISTS idx_shifts_manager_id ON shifts(manager_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_manager_id ON attendance(manager_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON attendance(worker_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance(work_date);
    CREATE INDEX IF NOT EXISTS idx_holidays_manager_id ON holidays(manager_id);
  `);
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
