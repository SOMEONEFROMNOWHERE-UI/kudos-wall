import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  memberIds: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'groups' });

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = session.user.name;

    // Return groups the user is a member of or created
    const groups = await Group.find({
      $or: [{ createdBy: userId }, { memberIds: userId }],
    }).lean();

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Groups GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { name, memberIds } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Group name required' }, { status: 400 });
    }

    const userId = session.user.name;
    const allMembers = Array.from(new Set([...(memberIds || [])])).filter(id => id !== userId);

    const group = await Group.create({
      name: name.trim(),
      createdBy: userId,
      memberIds: [userId],
    });

    // Create group requests for other members
    const GroupRequest = mongoose.models.GroupRequest;
    if (GroupRequest && allMembers.length > 0) {
      const requests = allMembers.map(receiverId => ({
        senderId: userId,
        receiverId,
        groupId: group._id,
        groupName: group.name,
        status: 'pending',
      }));
      await GroupRequest.insertMany(requests);
    }

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Groups POST error:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { groupId, addMembers, removeMembers } = await request.json();
    const userId = session.user.name;

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Only creator can modify membership
    if (group.createdBy !== userId) {
      return NextResponse.json({ error: 'Not authorized to modify this group' }, { status: 403 });
    }

    if (addMembers?.length) {
      const GroupRequest = mongoose.models.GroupRequest;
      if (GroupRequest) {
        const requests = addMembers
          .filter((id: string) => !group.memberIds.includes(id))
          .map((receiverId: string) => ({
            senderId: userId,
            receiverId,
            groupId: group._id,
            groupName: group.name,
            status: 'pending',
          }));
        if (requests.length > 0) {
          await GroupRequest.insertMany(requests);
        }
      }
    }
    if (removeMembers?.length) {
      await Group.updateOne({ _id: groupId }, { $pull: { memberIds: { $in: removeMembers } } });
    }

    const updated = await Group.findById(groupId).lean();
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Groups PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}
