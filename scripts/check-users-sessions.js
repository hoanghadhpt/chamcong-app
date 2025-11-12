#!/usr/bin/env node
/**
 * Script to check users and sessions in the database
 * Run: DATABASE_URL=your_connection_string node scripts/check-users-sessions.js
 * Or: export DATABASE_URL=your_connection_string && node scripts/check-users-sessions.js
 */

const { Pool } = require('pg');

async function checkUsersAndSessions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...\n');

    // Check users
    console.log('=== USERS ===');
    const usersResult = await pool.query(`
      SELECT
        id,
        email,
        display_name,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM users
      ORDER BY id
    `);

    if (usersResult.rows.length === 0) {
      console.log('No users found.');
    } else {
      console.table(usersResult.rows);
      console.log(`Total users: ${usersResult.rows.length}\n`);
    }

    // Check sessions
    console.log('=== SESSIONS ===');
    const sessionsResult = await pool.query(`
      SELECT
        s.id,
        s.user_id,
        u.email,
        u.display_name,
        s.user_agent,
        s.ip,
        TO_CHAR(s.expires_at, 'YYYY-MM-DD HH24:MI:SS') as expires_at,
        CASE
          WHEN s.expires_at > NOW() THEN 'Active'
          ELSE 'Expired'
        END as status
      FROM sessions s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.expires_at DESC
    `);

    if (sessionsResult.rows.length === 0) {
      console.log('No sessions found.');
    } else {
      console.table(sessionsResult.rows);
      console.log(`Total sessions: ${sessionsResult.rows.length}`);

      const activeSessions = sessionsResult.rows.filter(s => s.status === 'Active').length;
      const expiredSessions = sessionsResult.rows.filter(s => s.status === 'Expired').length;
      console.log(`Active: ${activeSessions}, Expired: ${expiredSessions}\n`);
    }

    // Get session statistics
    console.log('=== SESSION STATISTICS ===');
    const statsResult = await pool.query(`
      SELECT
        u.email,
        u.display_name,
        COUNT(*) as total_sessions,
        SUM(CASE WHEN s.expires_at > NOW() THEN 1 ELSE 0 END) as active_sessions,
        MAX(s.expires_at) as latest_session
      FROM users u
      LEFT JOIN sessions s ON u.id = s.user_id
      GROUP BY u.id, u.email, u.display_name
      ORDER BY total_sessions DESC
    `);
    console.table(statsResult.rows);

  } catch (error) {
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Cannot connect to database. Please check:');
      console.error('1. PostgreSQL is running');
      console.error('2. DATABASE_URL in .env is correct');
      console.error('3. Database credentials are valid');
    }
  } finally {
    await pool.end();
  }
}

// Run the script
checkUsersAndSessions().catch(console.error);
