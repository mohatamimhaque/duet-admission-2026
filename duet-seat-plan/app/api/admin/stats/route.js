import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const isAdmin = await getSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Department distribution
    const deptRes = await query(
      "SELECT COALESCE(NULLIF(department, ''), 'Unknown') as name, COUNT(*)::int as count FROM candidates GROUP BY department ORDER BY count DESC;"
    );

    // 2. Selection status distribution
    const selectedRes = await query("SELECT COUNT(*)::int FROM candidates WHERE selected = true;");
    const waitingRes = await query("SELECT COUNT(*)::int FROM candidates WHERE waiting_list = true;");
    const totalRes = await query("SELECT COUNT(*)::int FROM candidates;");

    const total = totalRes.rows[0].count;
    const selected = selectedRes.rows[0].count;
    const waiting = waitingRes.rows[0].count;
    const notSelected = total - selected - waiting;

    const selectionStats = [
      { name: 'Selected', count: selected },
      { name: 'Waiting List', count: waiting },
      { name: 'Not Selected', count: notSelected }
    ];

    // 3. Quota category distribution
    const quotaRes = await query(
      "SELECT COALESCE(NULLIF(quota, ''), 'Non-Quota') as name, COUNT(*)::int as count FROM candidates GROUP BY quota ORDER BY count DESC;"
    );

    // 4. Daily visit trends (past 7 days)
    const trafficRes = await query(`
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD') as date, 
        COUNT(*)::int as count 
      FROM site_visits 
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
      ORDER BY date ASC;
    `);

    // Fallback if traffic is empty
    let trafficStats = trafficRes.rows;
    if (trafficStats.length === 0) {
      // Return mock or placeholder dates if db has no logs
      trafficStats = [
        { date: new Date().toISOString().split('T')[0], count: 0 }
      ];
    }

    return NextResponse.json({
      departments: deptRes.rows,
      selection: selectionStats,
      quotas: quotaRes.rows,
      traffic: trafficStats
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
