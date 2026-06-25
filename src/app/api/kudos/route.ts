import { NextResponse } from 'next/server';
import dbConnect, { memoryDb } from '@/lib/mongodb';
import Kudos from '@/lib/models/Kudos';
import User from '@/lib/models/User';
import { v4 as uuidv4 } from 'uuid';
import { broadcastKudos } from '@/app/api/events/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const db = await dbConnect();

    const { searchParams } = new URL(request.url);
    const receiver = searchParams.get('receiver');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
    const countOnly = searchParams.get('count');

    if (!db) {
      let kudos = memoryDb.kudos.filter(k => !k.expiresAt || new Date(k.expiresAt) > new Date());
      if (countOnly === 'true') {
        return NextResponse.json({ count: kudos.length });
      }

      if (receiver) {
        kudos = kudos.filter(k => k.receiver.toLowerCase() === receiver.toLowerCase());
      }
      // Sort by descending createdAt
      kudos = kudos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      kudos = kudos.slice(0, limit);
      
      return NextResponse.json(kudos);
    }

    if (countOnly === 'true') {
      const total = await Kudos.countDocuments({
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      });
      return NextResponse.json({ count: total });
    }

    const query = {
      ...(receiver ? { receiver: { $regex: new RegExp(`^${receiver}$`, 'i') } } : {}),
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    
    const kudos = await Kudos.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(kudos);
  } catch (error) {
    console.error('GET /api/kudos error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kudos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await dbConnect();

    const body = await request.json();
    const { sender, receiver, message, category, isAnonymous, duration, badge } = body;

    // Validation
    if (!sender || !receiver || !message || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: sender, receiver, message, category' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    const validCategories = ['🔥', '💎', '🚀', '🧠', '🫂'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const expiresAtVal = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

    if (!db) {
      const newKudos = {
        _id: uuidv4(),
        sender: sender.trim(),
        receiver: receiver.trim(),
        message: message.trim(),
        category,
        isAnonymous: !!isAnonymous,
        expiresAt: expiresAtVal ? expiresAtVal.toISOString() : null,
        createdAt: new Date().toISOString(),
      };
      
      memoryDb.kudos.push(newKudos);

      const senderUser = memoryDb.users.find(u => u.name.toLowerCase() === sender.trim().toLowerCase());
      if (senderUser) {
        senderUser.streak += 1;
        senderUser.lastKudosGiven = new Date().toISOString();
      } else {
        memoryDb.users.push({
          _id: uuidv4(),
          name: sender.trim(),
          streak: 1,
          lastKudosGiven: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      try { broadcastKudos(newKudos); } catch { /* non-critical */ }
      return NextResponse.json(newKudos, { status: 201 });
    }

    // Create the kudos
    const kudos = await Kudos.create({
      sender: sender.trim(),
      receiver: receiver.trim(),
      message: message.trim(),
      category,
      isAnonymous: !!isAnonymous,
      expiresAt: expiresAtVal,
      badge: badge || 'GOOD_VIBES',
    });

    // Update sender's streak
    await User.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${sender.trim()}$`, 'i') } },
      {
        $inc: { streak: 1 },
        $set: { lastKudosGiven: new Date() },
      },
      { upsert: false }
    );

    try { broadcastKudos(kudos); } catch { /* non-critical */ }
    return NextResponse.json(kudos, { status: 201 });
  } catch (error) {
    console.error('POST /api/kudos error:', error);
    return NextResponse.json(
      { error: 'Failed to create kudos' },
      { status: 500 }
    );
  }
}
