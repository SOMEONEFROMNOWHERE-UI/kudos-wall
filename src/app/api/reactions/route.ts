import { NextRequest, NextResponse } from 'next/server';
import { sseReactions, broadcastReaction } from '@/app/api/events/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kudosId = searchParams.get('kudosId');
  if (!kudosId) {
    return NextResponse.json({ error: 'kudosId required' }, { status: 400 });
  }
  return NextResponse.json(sseReactions.get(kudosId) || {});
}

export async function POST(req: NextRequest) {
  try {
    const { kudosId, emoji, undo } = await req.json();
    if (!kudosId || !emoji) {
      return NextResponse.json({ error: 'kudosId and emoji required' }, { status: 400 });
    }

    const validEmojis = ['🌟', '🔥', '🫂'];
    if (!validEmojis.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });
    }

    const current = sseReactions.get(kudosId) || {};
    const next = {
      ...current,
      [emoji]: Math.max(0, (current[emoji] || 0) + (undo ? -1 : 1)),
    };
    sseReactions.set(kudosId, next);

    broadcastReaction(kudosId, emoji, next);

    return NextResponse.json({ kudosId, counts: next });
  } catch (err) {
    console.error('POST /api/reactions error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
