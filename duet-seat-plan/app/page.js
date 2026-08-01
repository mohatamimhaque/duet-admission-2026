import SearchClient from '@/components/SearchClient';
import { logVisit } from '@/lib/tracking';
import { headers } from 'next/headers';

// Keep page rendering dynamic so we track visits on every single page load
export const dynamic = 'force-dynamic';

export default async function Home() {
  const headersList = await headers();
  await logVisit('/', headersList);

  return <SearchClient />;
}
