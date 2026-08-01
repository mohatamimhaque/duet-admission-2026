import { query } from './db';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session';
const SECURE_SESSION_VAL = 'xybn_admin_sec_session_hash_2026';

export async function getSessionAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session && session.value === SECURE_SESSION_VAL;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, SECURE_SESSION_VAL, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 2, // 2 hours
    path: '/'
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Self-healing database setups
export async function initSettingsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);
    
    // Insert default active tabs settings if not exists
    await query(`
      INSERT INTO settings (key, value)
      VALUES ('active_tabs', '["seatPlan", "selection"]')
      ON CONFLICT (key) DO NOTHING;
    `);

    // Insert default results_published setting if not exists
    await query(`
      INSERT INTO settings (key, value)
      VALUES ('results_published', 'true')
      ON CONFLICT (key) DO NOTHING;
    `);
  } catch (err) {
    console.error('Failed to initialize settings table:', err);
  }
}
