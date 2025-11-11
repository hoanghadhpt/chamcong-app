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

  // Check if tables exist
  const tables = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'sessions', 'workers', 'attendance')"
    )
    .all() as { name: string }[];

  if (tables.length === 4) {
    return; // Schema already exists
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

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      work_date TEXT NOT NULL,
      status TEXT,
      check_in TEXT,
      check_out TEXT,
      note TEXT,
      UNIQUE(manager_id, worker_id, work_date)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_workers_manager_id ON workers(manager_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_manager_id ON attendance(manager_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_worker_id ON attendance(worker_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_work_date ON attendance(work_date);
  `);
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
