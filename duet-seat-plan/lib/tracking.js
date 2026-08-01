import { query } from './db';

export async function logVisit(path, headersList) {
  try {
    const userAgent = headersList.get('user-agent') || 'Unknown';
    const xForwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = xForwardedFor ? xForwardedFor.split(',')[0] : '127.0.0.1';
    
    await query(
      `INSERT INTO site_visits (path, user_agent, ip_address) VALUES ($1, $2, $3);`,
      [path, userAgent, ipAddress]
    );
  } catch (error) {
    console.error('Error logging visit:', error);
  }
}
