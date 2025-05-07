import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('Vintellitour');
    const provincesCollection = db.collection('provinces');

    const provinces = await provincesCollection
      .find({}, { projection: { _id: 1, name: 1 } }) // chỉ lấy _id và name
      .toArray();

    return NextResponse.json({ success: true, provinces });
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
