import { NextResponse } from 'next/server';
import dbConnect, { memoryDb } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = await dbConnect();

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      );
    }

    if (!db) {
      const user = memoryDb.users.find((u) => u.name.toLowerCase() === name.trim().toLowerCase());
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }

    const user = await User.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    }).lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await dbConnect();

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: 'Name too long (max 50 characters)' },
        { status: 400 }
      );
    }

    if (!db) {
      let user = memoryDb.users.find((u) => u.name.toLowerCase() === name.trim().toLowerCase());
      if (!user) {
        user = {
          _id: uuidv4(),
          name: name.trim(),
          streak: 0,
          lastKudosGiven: null,
          createdAt: new Date().toISOString(),
        };
        memoryDb.users.push(user);
      }
      return NextResponse.json(user, { status: 200 });
    }

    // Upsert — create if not exists, return existing if found
    const user = await User.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
      {
        $setOnInsert: {
          name: name.trim(),
          streak: 0,
          lastKudosGiven: null,
        },
      },
      {
        upsert: true,
        new: true,
        lean: true,
      }
    );

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to create/login user' },
      { status: 500 }
    );
  }
}
