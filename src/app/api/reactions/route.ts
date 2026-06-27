import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { broadcastReaction } from '@/app/api/events/route';
import dbConnect from '@/lib/mongodb';
import Kudos from '@/lib/models/Kudos';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kudosId = searchParams.get('kudosId');
  if (!kudosId) {
    return NextResponse.json({ error: 'kudosId required' }, { status: 400 });
  }

  try {
    await dbConnect();
    const kudos = await Kudos.findById(kudosId).lean();
    if (!kudos) return NextResponse.json({});

    // Count lengths of the string arrays in reactions Map
    const counts: Record<string, number> = {};
    const reactions = kudos.reactions || {};
    Object.keys(reactions).forEach(emoji => {
      counts[emoji] = reactions[emoji]?.length || 0;
    });

    return NextResponse.json(counts);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const userName = session?.user?.name || 'Anonymous';
    const { kudosId, emoji, undo } = await req.json();

    if (!kudosId || !emoji) {
      return NextResponse.json({ error: 'kudosId and emoji required' }, { status: 400 });
    }

    const validEmojis = ['🌟', '🔥', '🫂'];
    if (!validEmojis.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    await dbConnect();
    const kudos = await Kudos.findById(kudosId);
    if (!kudos) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const currentReactions = kudos.get('reactions') || new Map();
    let users = currentReactions.get(emoji) || [];

    if (undo) {
      users = users.filter((u: string) => u !== userName);
    } else {
      if (!users.includes(userName)) {
        users.push(userName);
      }
    }

    currentReactions.set(emoji, users);
    kudos.set('reactions', currentReactions);
    await kudos.save();

    // Recompute all counts to broadcast
    const counts: Record<string, number> = {};
    for (const [key, val] of currentReactions.entries()) {
      counts[key] = (val as string[]).length;
    }

    // Still broadcast via SSE for instant live updates
    broadcastReaction(kudosId, emoji, counts);

    return NextResponse.json({ kudosId, counts });
  } catch (err) {
    console.error('POST /api/reactions error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
