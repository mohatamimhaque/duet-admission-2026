import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionAdmin, initSettingsTable } from '@/lib/admin';

export async function GET() {
  try {
    await initSettingsTable();
    const tabsRes = await query("SELECT value FROM settings WHERE key = 'active_tabs';");
    const pubRes = await query("SELECT value FROM settings WHERE key = 'results_published';");
    
    let activeTabs = ['seatPlan', 'selection'];
    let resultsPublished = true;

    if (tabsRes.rows.length > 0) {
      activeTabs = JSON.parse(tabsRes.rows[0].value);
    }
    if (pubRes.rows.length > 0) {
      resultsPublished = pubRes.rows[0].value === 'true';
    }

    return NextResponse.json({ activeTabs, resultsPublished });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ activeTabs: ['seatPlan', 'selection'], resultsPublished: true });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await getSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activeTabs, resultsPublished } = await request.json();
    
    await initSettingsTable();

    if (Array.isArray(activeTabs)) {
      await query(
        "INSERT INTO settings (key, value) VALUES ('active_tabs', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;",
        [JSON.stringify(activeTabs)]
      );
    }

    if (typeof resultsPublished === 'boolean') {
      await query(
        "INSERT INTO settings (key, value) VALUES ('results_published', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;",
        [resultsPublished ? 'true' : 'false']
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
