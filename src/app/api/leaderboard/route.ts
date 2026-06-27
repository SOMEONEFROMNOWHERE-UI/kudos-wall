import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Kudos from '@/lib/models/Kudos';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    // 1. Top Users by Kudos Received
    const receivedAgg = await Kudos.aggregate([
      { $group: { _id: '$receiver', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const topReceived = receivedAgg.map(r => ({ name: r._id, score: r.count }));

    // 2. Top Users by Kudos Given
    const givenAgg = await Kudos.aggregate([
      { $match: { isAnonymous: false } },
      { $group: { _id: '$sender', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const topGiven = givenAgg.map(r => ({ name: r._id, score: r.count }));

    // 3. Top Posts by Reactions
    // Because reactions is a Map of String[], we have to pull all and sort in JS
    // (Or we can write a complex aggregation if needed, but in JS is safer for this scale)
    const allKudos = await Kudos.find().lean();
    
    const postsWithScores = allKudos.map((k: any) => {
      let score = 0;
      if (k.likes && Array.isArray(k.likes)) {
        score = k.likes.length;
      }
      return { ...k, score };
    });

    const topPosts = postsWithScores
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Fallback to most recent first if scores are equal
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);

    return NextResponse.json({
      topReceived,
      topGiven,
      topPosts
    });
  } catch (err) {
    console.error('GET /api/leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
