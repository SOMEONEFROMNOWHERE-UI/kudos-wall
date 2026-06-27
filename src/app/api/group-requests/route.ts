import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

const GroupRequestSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    groupId: { type: String, required: true },
    groupName: { type: String, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'declined'] },
  },
  { timestamps: true, collection: 'group_requests' }
);
GroupRequestSchema.index({ receiverId: 1, groupId: 1 }, { unique: true });
const GroupRequest =
  mongoose.models.GroupRequest || mongoose.model('GroupRequest', GroupRequestSchema);

// We need the Group schema to add members
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  memberIds: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'groups' });
const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

// GET — list pending incoming group requests for current user
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const me = session.user.name;
    const requests = await GroupRequest.find({
      receiverId: me,
      status: 'pending',
    }).lean();
    return NextResponse.json(requests);
  } catch (err) {
    console.error('group-requests GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST — send a group request
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { receiverId, groupId } = await req.json();
    const me = session.user.name;

    if (!receiverId || receiverId === me || !groupId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    if (group.createdBy !== me) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    if (group.memberIds.includes(receiverId)) {
       return NextResponse.json({ error: 'Already a member' }, { status: 409 });
    }

    const pending = await GroupRequest.findOne({ receiverId, groupId, status: 'pending' });
    if (pending) return NextResponse.json({ error: 'Invite already sent' }, { status: 409 });

    await GroupRequest.create({
      senderId: me,
      receiverId,
      groupId,
      groupName: group.name,
      status: 'pending',
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'Invite already sent' }, { status: 409 });
    }
    console.error('group-requests POST error:', err);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}

// PATCH — accept or decline a group request
export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { requestId, action } = await req.json(); // action: 'accepted' | 'declined'
    const me = session.user.name;

    const request = await GroupRequest.findById(requestId);
    if (!request || request.receiverId !== me) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    request.status = action;
    await request.save();

    if (action === 'accepted') {
      await Group.updateOne(
        { _id: request.groupId },
        { $addToSet: { memberIds: me } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('group-requests PATCH error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
