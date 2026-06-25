import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Kudos from '@/lib/models/Kudos';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const ReactionSchema = new mongoose.Schema(
  {
    kudosId: { type: String, required: true },
    emoji: { type: String, required: true },
    userId: { type: String },
    count: { type: Number, default: 1 },
  },
  { collection: 'reactions' }
);
const Reaction = mongoose.models.Reaction || mongoose.model('Reaction', ReactionSchema);

export async function GET() {
  try {
    await dbConnect();

    // Get all kudos sorted by creation date
    const kudosList = await Kudos.find({
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get reaction counts per kudos
    const allReactions = await Reaction.find({}).lean();

    const reactionMap: Record<string, Record<string, number>> = {};
    for (const r of allReactions) {
      if (!reactionMap[r.kudosId]) reactionMap[r.kudosId] = {};
      reactionMap[r.kudosId][r.emoji] = (reactionMap[r.kudosId][r.emoji] || 0) + (r.count || 1);
    }

    // Attach reaction counts and filter >= 10
    const withCounts = kudosList
      .map((k) => {
        const id = String(k._id);
        const breakdown = reactionMap[id] || {};
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        return { ...k, reactionCount: total, reactionBreakdown: breakdown };
      })
      .filter((k) => k.reactionCount >= 10)
      .sort((a, b) => b.reactionCount - a.reactionCount)
      .slice(0, 3);

    return NextResponse.json(withCounts);
  } catch (err) {
    console.error('hall-of-fame GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
