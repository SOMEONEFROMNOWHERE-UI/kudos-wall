import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

const FriendshipSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  friendId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'friendships' });

// Compound unique index — prevent duplicates
FriendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true });

const Friendship = mongoose.models.Friendship || mongoose.model('Friendship', FriendshipSchema);

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = session.user.name;

    // Get all friendships for this user (bidirectional)
    const friendships = await Friendship.find({
      $or: [{ userId }, { friendId: userId }],
    });

    const friendNames = friendships.map((f: { userId: string; friendId: string }) =>
      f.userId === userId ? f.friendId : f.userId
    );

    return NextResponse.json({ friends: friendNames });
  } catch (error) {
    console.error('Friends GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { friendName } = await request.json();
    if (!friendName || typeof friendName !== 'string') {
      return NextResponse.json({ error: 'friendName required' }, { status: 400 });
    }

    const userId = session.user.name;
    const friendId = friendName.trim();

    if (userId === friendId) {
      return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });
    }

    // Upsert both directions (bidirectional friendship)
    await Friendship.updateOne(
      { userId, friendId },
      { $setOnInsert: { userId, friendId } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, friendId });
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'Already friends' }, { status: 409 });
    }
    console.error('Friends POST error:', error);
    return NextResponse.json({ error: 'Failed to add friend' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');
    if (!friendId) {
      return NextResponse.json({ error: 'friendId required' }, { status: 400 });
    }

    const userId = session.user.name;

    // Delete both directions
    await Friendship.deleteMany({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Friends DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove friend' }, { status: 500 });
  }
}
