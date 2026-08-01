import { query } from '@/lib/db';
import { logVisit } from '@/lib/tracking';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rollParam = searchParams.get('roll');
  
  const headersList = await headers();
  // Log the visit to this API endpoint
  await logVisit(`/api/search?roll=${rollParam || ''}`, headersList);

  if (!rollParam) {
    return NextResponse.json({ error: 'Roll parameter is required' }, { status: 400 });
  }

  const roll = parseInt(rollParam, 10);
  if (isNaN(roll)) {
    return NextResponse.json({ error: 'Invalid Roll number' }, { status: 400 });
  }

  try {
    const result = await query('SELECT * FROM candidates WHERE roll = $1;', [roll]);
    if (result.rows.length === 0) {
      return NextResponse.json({ found: false });
    }
    return NextResponse.json({ found: true, candidate: result.rows[0] });
  } catch (error) {
    console.error('Database query error in /api/search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
