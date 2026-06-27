import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Kudos from '@/lib/models/Kudos';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = params;
    const userName = session.user.name;

    // Find the kudos document
    const kudos = await Kudos.findById(id);
    
    if (!kudos) {
      return NextResponse.json({ error: 'Kudos not found' }, { status: 404 });
    }

    // Toggle the like
    const hasLiked = kudos.likes?.includes(userName);
    
    if (hasLiked) {
      // Remove like
      kudos.likes = kudos.likes.filter((name: string) => name !== userName);
    } else {
      // Add like
      if (!kudos.likes) {
        kudos.likes = [];
      }
      kudos.likes.push(userName);
    }

    await kudos.save();

    return NextResponse.json({ 
      success: true, 
      likes: kudos.likes,
      likesCount: kudos.likes.length,
      hasLiked: !hasLiked
    });

  } catch (err) {
    console.error('Like toggle error:', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
