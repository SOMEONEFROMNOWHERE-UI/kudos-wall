import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Lightweight schema — just what we need for trending
const KudosSchema = new mongoose.Schema({
  receiver: String,
  sender: String,
  category: String,
  createdAt: Date,
}, { collection: 'kudos' });

const KudosModel = mongoose.models.Kudos || mongoose.model('Kudos', KudosSchema);

const ReactionsSchema = new mongoose.Schema({
  kudosId: String,
  emoji: String,
  count: { type: Number, default: 0 },
}, { collection: 'reactions' });

const ReactionsModel = mongoose.models.Reactions || mongoose.model('Reactions', ReactionsSchema);

export async function GET() {
  try {
    await dbConnect();

    // Look back 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Aggregate kudos received per person in the window
    const kudosByPerson = await KudosModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$receiver',
          count: { $sum: 1 },
          // Recency: average time since createdAt (lower = more recent)
          avgAge: {
            $avg: { $subtract: [new Date(), '$createdAt'] }
          },
          latestAt: { $max: '$createdAt' },
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }, // fetch 8, we'll trim to 5 after scoring
    ]);

    if (kudosByPerson.length === 0) {
      return NextResponse.json([]);
    }

    // Normalize scores 0–1
    const maxCount = kudosByPerson[0]?.count || 1;
    const maxAge = Math.max(...kudosByPerson.map((p: { avgAge: number }) => p.avgAge), 1);

    const scored = kudosByPerson.map((person: {
      _id: string;
      count: number;
      avgAge: number;
      latestAt: Date;
    }) => {
      // Recency score: more recent = higher score (inverse of age)
      const recencyScore = 1 - (person.avgAge / maxAge);
      // Volume score
      const volumeScore = person.count / maxCount;
      // Combined glow: 60% volume + 40% recency
      const glowScore = volumeScore * 0.6 + recencyScore * 0.4;

      return {
        name: person._id,
        kudosCount: person.count,
        glowScore: Math.max(0, Math.min(1, glowScore)),
        latestAt: person.latestAt,
      };
    });

    // Sort by glow score, take top 5
    const top5 = scored
      .sort((a: { glowScore: number }, b: { glowScore: number }) => b.glowScore - a.glowScore)
      .slice(0, 5);

    return NextResponse.json(top5);
  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
