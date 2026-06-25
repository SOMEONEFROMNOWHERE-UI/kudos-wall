import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

const FriendRequestSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'declined'] },
  },
  { timestamps: true, collection: 'friend_requests' }
);
FriendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
const FriendRequest =
  mongoose.models.FriendRequest || mongoose.model('FriendRequest', FriendRequestSchema);

const FriendshipSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    friendId: { type: String, required: true },
  },
  { timestamps: true, collection: 'friendships' }
);
FriendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true });
const Friendship =
  mongoose.models.Friendship || mongoose.model('Friendship', FriendshipSchema);

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true },
    fromUserId: { type: String },
    referenceId: { type: String },
    message: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'notifications' }
);
const Notification =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// GET — list pending incoming requests for current user
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const me = session.user.name;
    const requests = await FriendRequest.find({
      receiverId: me,
      status: 'pending',
    }).lean();
    return NextResponse.json(requests);
  } catch (err) {
    console.error('friend-requests GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST — send a friend request
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { receiverId } = await req.json();
    const me = session.user.name;

    if (!receiverId || receiverId === me) {
      return NextResponse.json({ error: 'Invalid receiver' }, { status: 400 });
    }

    // Check already friends
    const existing = await Friendship.findOne({
      $or: [
        { userId: me, friendId: receiverId },
        { userId: receiverId, friendId: me },
      ],
    });
    if (existing) {
      return NextResponse.json({ error: 'Already teammates' }, { status: 409 });
    }

    // Check pending request
    const pending = await FriendRequest.findOne({
      senderId: me,
      receiverId,
      status: 'pending',
    });
    if (pending) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
    }

    await FriendRequest.create({ senderId: me, receiverId, status: 'pending' });

    // Create notification for receiver
    await Notification.create({
      userId: receiverId,
      type: 'friend_request',
      fromUserId: me,
      message: `${me} sent you a friend request`,
      read: false,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
    }
    console.error('friend-requests POST error:', err);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}

// PATCH — accept or decline a request
export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { requestId, action } = await req.json(); // action: 'accepted' | 'declined'
    const me = session.user.name;

    const request = await FriendRequest.findById(requestId);
    if (!request || request.receiverId !== me) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    request.status = action;
    await request.save();

    if (action === 'accepted') {
      // Create bidirectional friendship
      await Friendship.updateOne(
        { userId: request.senderId, friendId: me },
        { $setOnInsert: { userId: request.senderId, friendId: me } },
        { upsert: true }
      );

      // Notify sender
      await Notification.create({
        userId: request.senderId,
        type: 'friend_accepted',
        fromUserId: me,
        message: `${me} accepted your friend request`,
        read: false,
      });
    }

    return NextResponse.json({ success: true, status: action });
  } catch (err) {
    console.error('friend-requests PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
