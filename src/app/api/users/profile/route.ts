import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Kudos from '@/lib/models/Kudos';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const name = session.user.name;

    // Fetch user details
    const user = await User.findOne({ name }).lean();
    
    // Compute stats
    const kudosReceivedCount = await Kudos.countDocuments({ receiverName: name });
    const kudosGivenCount = await Kudos.countDocuments({ senderName: name });

    // Aggregate likes received
    const likesAggregation = await Kudos.aggregate([
      { $match: { receiverName: name } },
      { $project: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
      { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } }
    ]);
    
    const totalLikesReceived = likesAggregation.length > 0 ? likesAggregation[0].totalLikes : 0;

    return NextResponse.json({
      name: user?.name || name,
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
