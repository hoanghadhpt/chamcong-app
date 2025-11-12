import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getDB } from "./db";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionId(): string {
  return nanoid(32);
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
}

export function createUser(
  email: string,
  passwordHash: string,
  displayName: string
): User {
  const db = getDB();
  const stmt = db.prepare(
    "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)"
  );
  const result = stmt.run(email, passwordHash, displayName);

  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(result.lastInsertRowid) as User;
  return user;
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDB();
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  const db = getDB();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function createSession(
  userId: number,
  expiresAt: string
): Session {
  const db = getDB();
  const sessionId = generateSessionId();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    sessionId,
    userId,
    expiresAt
  );
  return { id: sessionId, user_id: userId, expires_at: expiresAt };
}

export function getSession(sessionId: string): Session | undefined {
  const db = getDB();
  const session = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId) as Session | undefined;

  if (!session) return undefined;

  // Check if session has expired
  if (new Date(session.expires_at) < new Date()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return undefined;
  }

  return session;
}

export function deleteSession(sessionId: string): void {
  const db = getDB();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

/**
 * Get user ID from a valid session ID.
 * Returns null if session is invalid or expired.
 */
export function getUserIdFromSession(sessionId: string): number | null {
  const session = getSession(sessionId);
  return session ? session.user_id : null;
}
