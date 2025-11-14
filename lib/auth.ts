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
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  user_agent: string | null;
  ip: string | null;
  expires_at: string;
}

export async function createUser(
  email: string,
  passwordHash: string,
  displayName: string
): Promise<User> {
  const db = getDB();
  const result = await db.query(
    "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *",
    [email, passwordHash, displayName]
  );

  return result.rows[0] as User;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = getDB();
  const result = await db.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] as User | undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = getDB();
  const result = await db.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] as User | undefined;
}

export async function createSession(
  userId: number,
  expiresAt: string,
  userAgent: string | null = null,
  ip: string | null = null
): Promise<Session> {
  const db = getDB();
  const sessionId = generateSessionId();
  await db.query(
    "INSERT INTO sessions (id, user_id, user_agent, ip, expires_at) VALUES ($1, $2, $3, $4, $5)",
    [sessionId, userId, userAgent, ip, expiresAt]
  );
  return { id: sessionId, user_id: userId, user_agent: userAgent, ip: ip, expires_at: expiresAt };
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
  const db = getDB();
  const result = await db.query(
    "SELECT * FROM sessions WHERE id = $1",
    [sessionId]
  );

  const session = result.rows[0] as Session | undefined;

  if (!session) return undefined;

  // Check if session has expired
  if (new Date(session.expires_at) < new Date()) {
    await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    return undefined;
  }

  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDB();
  await db.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

/**
 * Get user ID from a valid session ID.
 * Returns null if session is invalid or expired.
 */
export async function getUserIdFromSession(sessionId: string): Promise<number | null> {
  const session = await getSession(sessionId);
  return session ? session.user_id : null;
}
