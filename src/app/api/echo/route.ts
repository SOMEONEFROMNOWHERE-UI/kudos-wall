import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// ── Schema ──────────────────────────────────────────────────────────
const EchoSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  kudosCountAtGeneration: { type: Number, default: 0 },
}, { collection: 'echo_insights' });

const Echo = mongoose.models.EchoInsight || mongoose.model('EchoInsight', EchoSchema);

// Reuse kudos model (lightweight read-only view)
const KudosSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
  category: String,
  createdAt: Date,
}, { collection: 'kudos' });

const Kudos = mongoose.models.Kudos2 || mongoose.model('Kudos2', KudosSchema);

import OpenAI from 'openai';

async function callGroq(givenKudos: {
  message: string;
  category: string;
  receiver: string;
  createdAt: Date;
}[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  const openai = new OpenAI({ apiKey });
  openai.baseURL = 'https://api.groq.com/openai/v1';

  // Split into current period (last 30 days) and prior period
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const current = givenKudos.filter(k => now - new Date(k.createdAt).getTime() < thirtyDays);
  const prior = givenKudos.filter(k => now - new Date(k.createdAt).getTime() >= thirtyDays);

  const formatKudos = (list: typeof givenKudos) =>
    list.map(k => `- Category: ${k.category} | To: ${k.receiver} | Message: "${k.message}"`).join('\n');

  const systemPrompt = `You are Echo, an AI that analyzes what a person tends to notice and appreciate in others — the giver's perspective, not the receiver's.

Your job: compare this user's recent kudos (current period) vs. older kudos (prior period) and identify ONE specific, genuine shift in what they've been recognizing.

CRITICAL RULES:
- If there is no clear, genuine, specific shift, say so plainly: "No clear pattern shift yet — keep giving kudos and I'll reflect back what I see." Do NOT invent or force a pattern.
- Never say generic things like "You're so positive!" or "You appreciate your team!" 
- Be specific: name a theme (e.g., "problem-solving", "carrying the team through ambiguity", "quiet reliability") not a vague trait.
- Keep it to 2-3 sentences max. Conversational, warm, not clinical.
- Address the user as "you" directly.
- Focus on the SHIFT: what's new or different, not a general summary.`;

  const userPrompt = `Current period (recent kudos you've given):
${current.length > 0 ? formatKudos(current) : 'No recent kudos yet.'}

Prior period (older kudos you've given):
${prior.length > 0 ? formatKudos(prior) : 'No prior period data.'}

What genuine pattern shift do you notice in what this person has been recognizing lately?`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'grok-beta',
      max_tokens: 200,
      temperature: 0.6,
    });

    return chatCompletion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Groq/OpenAI fetch error:', error);
    return null;
  }
}

// ── GET — return cached insight ──────────────────────────────────────
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = session.user.name;

    const insight = await Echo.findOne({ userId }).lean() as {
      content: string;
      generatedAt: Date;
      kudosCountAtGeneration: number;
    } | null;

    if (!insight) {
      return NextResponse.json({ insight: null });
    }

    return NextResponse.json({
      insight: {
        content: insight.content,
        generatedAt: insight.generatedAt,
      },
    });
  } catch (error) {
    console.error('Echo GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch insight' }, { status: 500 });
  }
}

// ── POST — generate or refresh insight ──────────────────────────────
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const userId = session.user.name;
    const { force } = await request.json().catch(() => ({ force: false }));

    // Fetch all kudos this user has GIVEN
    const allGiven = await Kudos.find({ sender: userId }).sort({ createdAt: -1 }).limit(30).lean() as {
      message: string;
      category: string;
      receiver: string;
      createdAt: Date;
    }[];

    // Minimum 8 kudos given — don't fabricate patterns from sparse data
    if (allGiven.length < 8) {
      return NextResponse.json({
        insight: null,
        reason: 'not_enough_kudos',
        needed: 8 - allGiven.length,
      });
    }

    // Check if we need to regenerate (cache: regenerate after 2+ new kudos given)
    const existing = await Echo.findOne({ userId }).lean() as {
      kudosCountAtGeneration: number;
    } | null;
    
    const currentCount = allGiven.length;
    const countSinceLast = existing ? currentCount - existing.kudosCountAtGeneration : currentCount;

    if (!force && existing && countSinceLast < 2) {
      // Cache hit — return existing
      const cached = await Echo.findOne({ userId }).lean() as {
        content: string;
        generatedAt: Date;
      };
      return NextResponse.json({
        insight: { content: cached.content, generatedAt: cached.generatedAt },
        cached: true,
      });
    }

    // Generate new insight
    const content = await callGroq(allGiven);

    if (!content) {
      // No API key or Grok error — return a graceful null
      return NextResponse.json({ insight: null, reason: 'ai_unavailable' });
    }

    // Store/update in echo_insights
    await Echo.findOneAndUpdate(
      { userId },
      {
        userId,
        content,
        generatedAt: new Date(),
        kudosCountAtGeneration: currentCount,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      insight: { content, generatedAt: new Date() },
      cached: false,
    });
  } catch (error) {
    console.error('Echo POST error:', error);
    return NextResponse.json({ error: 'Failed to generate insight' }, { status: 500 });
  }
}
