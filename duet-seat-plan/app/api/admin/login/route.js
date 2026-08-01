import { NextResponse } from 'next/server';
import { setAdminSession, initSettingsTable } from '@/lib/admin';

export async function POST(request) {
  try {
    // Run DB settings initialization query on login to self-heal schema
    await initSettingsTable();

    const { email, password } = await request.json();

    if (
      email === 'mohatamimhaque@outlook.com' &&
      password === 'xybn-+1!@#$'
    ) {
      await setAdminSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid email or password.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
