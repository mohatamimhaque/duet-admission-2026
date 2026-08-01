import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionAdmin } from '@/lib/admin';

export async function GET(request) {
  try {
    const isAdmin = await getSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [limit, offset];

    if (search.trim() !== '') {
      whereClause = `
        WHERE roll::TEXT ILIKE $3 
        OR name ILIKE $3 
        OR father_name ILIKE $3 
        OR department ILIKE $3 
        OR room ILIKE $3 
        OR building_name ILIKE $3
      `;
      params.push(`%${search.trim()}%`);
    }

    // Get paginated rows
    const rowsRes = await query(
      `SELECT * FROM candidates ${whereClause} ORDER BY roll ASC LIMIT $1 OFFSET $2;`,
      params
    );

    // Get total count
    let countRes;
    if (search.trim() !== '') {
      const countWhereClause = `
        WHERE roll::TEXT ILIKE $1 
        OR name ILIKE $1 
        OR father_name ILIKE $1 
        OR department ILIKE $1 
        OR room ILIKE $1 
        OR building_name ILIKE $1
      `;
      countRes = await query(
        `SELECT COUNT(*) FROM candidates ${countWhereClause};`,
        [`%${search.trim()}%`]
      );
    } else {
      countRes = await query('SELECT COUNT(*) FROM candidates;');
    }
    const totalCount = parseInt(countRes.rows[0].count, 10);

    return NextResponse.json({
      candidates: rowsRes.rows,
      totalCount
    });
  } catch (error) {
    console.error('Admin candidates GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await getSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      roll, payment_id, name, father_name, department, quota,
      date, shift_with_time, building_name, room, selected, waiting_list, comment
    } = body;

    if (!roll || !name) {
      return NextResponse.json({ error: 'Roll and Name are required.' }, { status: 400 });
    }

    // Check if roll already exists
    const checkRes = await query('SELECT roll FROM candidates WHERE roll = $1;', [roll]);
    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'A candidate with this Roll Number already exists.' }, { status: 400 });
    }

    await query(
      `INSERT INTO candidates (
        roll, payment_id, name, father_name, department, quota,
        date, shift_with_time, building_name, room, selected, waiting_list, comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
      [
        roll, payment_id || '', name, father_name || '', department || '', quota || '',
        date || '', shift_with_time || '', building_name || '', room || '',
        selected || false, waiting_list || false, comment || ''
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin candidates POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const isAdmin = await getSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      roll, payment_id, name, father_name, department, quota,
      date, shift_with_time, building_name, room, selected, waiting_list, comment
    } = body;

    if (!roll || !name) {
      return NextResponse.json({ error: 'Roll and Name are required.' }, { status: 400 });
    }

    // Check if candidate exists
    const checkRes = await query('SELECT roll FROM candidates WHERE roll = $1;', [roll]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Candidate record not found.' }, { status: 404 });
    }

    await query(
      `UPDATE candidates SET
        payment_id = $2,
        name = $3,
        father_name = $4,
        department = $5,
        quota = $6,
        date = $7,
        shift_with_time = $8,
        building_name = $9,
        room = $10,
        selected = $11,
        waiting_list = $12,
        comment = $13
      WHERE roll = $1;`,
      [
        roll, payment_id || '', name, father_name || '', department || '', quota || '',
        date || '', shift_with_time || '', building_name || '', room || '',
        selected || false, waiting_list || false, comment || ''
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin candidates PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const isAdmin = await getSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roll = searchParams.get('roll');

    if (!roll) {
      return NextResponse.json({ error: 'Roll number is required.' }, { status: 400 });
    }

    await query('DELETE FROM candidates WHERE roll = $1;', [roll]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin candidates DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
