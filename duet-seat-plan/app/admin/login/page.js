import { getSessionAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import AdminLoginClient from './AdminLoginClient';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  const isAdmin = await getSessionAdmin();
  if (isAdmin) {
    redirect('/admin');
  }

  return <AdminLoginClient />;
}
