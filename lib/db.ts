import { Pool, PoolClient, QueryResult } from "pg";

let pool: Pool | null = null;

// Get DATABASE_URL from environment variables
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return databaseUrl;
}

export function getDB(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Initialize schema on first connection
    initializeSchema().catch((err) => {
      console.error("Failed to initialize database schema:", err);
      throw err;
    });
  }
  return pool;
}

async function initializeSchema() {
  const database = getDB();

  // Check if sessions table exists and has user_agent column
  const sessionTableResult = await database.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'sessions'`
  );

  if (sessionTableResult.rows.length > 0) {
    // Check if user_agent column exists
    const sessionColumnsResult = await database.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'sessions'`
    );

    const columnNames = sessionColumnsResult.rows.map((row) => row.column_name);
    const hasUserAgent = columnNames.includes("user_agent");

    if (!hasUserAgent) {
      // Migrate existing sessions table by adding missing columns
      console.log("Migrating sessions table: adding user_agent and ip columns...");
      await database.query(`
        ALTER TABLE sessions ADD COLUMN user_agent TEXT;
        ALTER TABLE sessions ADD COLUMN ip TEXT;
      `);
    }
  }

  // Check if attendance table exists and add missing columns if needed
  const attendanceTableResult = await database.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'attendance'`
  );

  if (attendanceTableResult.rows.length > 0) {
    const attendanceColumnsResult = await database.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'attendance'`
    );

    const columnNames = attendanceColumnsResult.rows.map((row) => row.column_name);
    const needsLateMinutes = !columnNames.includes("late_minutes");
    const needsEarlyMinutes = !columnNames.includes("early_minutes");
    const needsOT = !columnNames.includes("ot_1_5");
    const needsShiftId = !columnNames.includes("shift_id");
    const needsShiftAmount = !columnNames.includes("shift_amount");

    if (needsLateMinutes || needsEarlyMinutes || needsOT || needsShiftId || needsShiftAmount) {
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
      if (needsShiftAmount) alterStmts.push("ALTER TABLE attendance ADD COLUMN shift_amount REAL DEFAULT 1.0;");

      await database.query(alterStmts.join("\n"));
    }
  }

  // Check if all tables exist
  const tablesResult = await database.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN ('users', 'sessions', 'workers', 'shifts', 'settings', 'holidays', 'attendance')`
  );

  if (tablesResult.rows.length === 7) {
    return; // Schema fully updated
  }

  // Create tables if they don't exist
  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_agent TEXT,
      ip TEXT,
      expires_at TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id SERIAL PRIMARY KEY,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR(255) NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      team TEXT,
      active INTEGER DEFAULT 1,
      UNIQUE(manager_id, code)
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id SERIAL PRIMARY KEY,
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
      locale VARCHAR(20) DEFAULT 'vi-VN',
      tz VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
      enable_gps INTEGER DEFAULT 0,
      enable_selfie INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS holidays (
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      name TEXT NOT NULL,
      PRIMARY KEY (manager_id, date)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
      work_date DATE NOT NULL,
      status TEXT,
      check_in TIMESTAMP,
      check_out TIMESTAMP,
      late_minutes INTEGER,
      early_minutes INTEGER,
      ot_1_5 INTEGER DEFAULT 0,
      ot_2_0 INTEGER DEFAULT 0,
      ot_3_0 INTEGER DEFAULT 0,
      note TEXT,
      shift_id INTEGER REFERENCES shifts(id),
      shift_amount REAL DEFAULT 1.0,
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

export async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
