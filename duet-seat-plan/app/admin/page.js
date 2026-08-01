import { getSessionAdmin, initSettingsTable } from '@/lib/admin';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await getSessionAdmin();
  if (!isAdmin) {
    redirect('/admin/login');
  }

  // Load current settings from database
  await initSettingsTable();
  const settingsRes = await query("SELECT value FROM settings WHERE key = 'active_tabs';");
  const pubRes = await query("SELECT value FROM settings WHERE key = 'results_published';");
  
  let initialActiveTabs = ['seatPlan', 'selection'];
  let initialResultsPublished = true;

  if (settingsRes.rows.length > 0) {
    initialActiveTabs = JSON.parse(settingsRes.rows[0].value);
  }
  if (pubRes.rows.length > 0) {
    initialResultsPublished = pubRes.rows[0].value === 'true';
  }

  return <AdminClient initialActiveTabs={initialActiveTabs} initialResultsPublished={initialResultsPublished} />;
}
