import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Kudos from '@/lib/models/Kudos';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  
  const { searchParams } = new URL(req.url);
  let name = searchParams.get('username');

  if (!name) {
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    name = session.user.name;
  }

  try {
    await dbConnect();

    // Fetch user details
    const user = await User.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } }).lean();
    const exactName = user?.name || name;
    
    // Compute stats
    const kudosReceivedCount = await Kudos.countDocuments({ receiver: { $regex: new RegExp(`^${exactName}$`, 'i') } });
    const kudosGivenCount = await Kudos.countDocuments({ sender: { $regex: new RegExp(`^${exactName}$`, 'i') } });

    // Aggregate likes/reactions received
    const kudosReceived = await Kudos.find({ receiver: { $regex: new RegExp(`^${exactName}$`, 'i') } }).lean();
    let totalLikesReceived = 0;
    
    kudosReceived.forEach((k: any) => {
      // Legacy likes array
      if (k.likes && Array.isArray(k.likes)) {
        totalLikesReceived += k.likes.length;
      }
      // New reactions map
      if (k.reactions) {
        Object.values(k.reactions).forEach((users: any) => {
          if (Array.isArray(users)) {
            totalLikesReceived += users.length;
          }
        });
      }
    });

    return NextResponse.json({
      name: exactName,
      streak: user?.streak || 0,
      bio: user?.bio || '',
      title: user?.title || '',
      stats: {
        kudosReceived: kudosReceivedCount,
        kudosGiven: kudosGivenCount,
        likesReceived: totalLikesReceived
      }
    });

  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const name = session.user.name;
    const body = await req.json();

    const updateData: any = {};
    if (typeof body.bio === 'string') {
      updateData.bio = body.bio.substring(0, 160);
    }
    if (typeof body.title === 'string') {
      updateData.title = body.title.substring(0, 50);
    }

    const updatedUser = await User.findOneAndUpdate(
      { name },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      bio: updatedUser.bio || '',
      title: updatedUser.title || ''
    });

  } catch (err) {
    console.error('Profile PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
