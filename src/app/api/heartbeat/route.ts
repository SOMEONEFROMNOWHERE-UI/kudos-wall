import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Kudos from '@/lib/models/Kudos';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const now = new Date();
    // Start of current day (local time approx)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // We want the last 7 days including today.
    // Index 6 is today, index 0 is 6 days ago.
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const kudos = await Kudos.find({
      createdAt: { $gte: sevenDaysAgo }
    }).select('createdAt').lean();

    kudos.forEach(k => {
      const kDate = new Date(k.createdAt);
      // Diff in days relative to today
      const diffTime = today.getTime() - new Date(kDate.getFullYear(), kDate.getMonth(), kDate.getDate()).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const index = 6 - diffDays;
      if (index >= 0 && index < 7) {
        counts[index]++;
      }
    });

    return NextResponse.json({ counts });
  } catch (err) {
    console.error('heartbeat GET error:', err);
    return NextResponse.json({ counts: [0, 0, 0, 0, 0, 0, 0] }, { status: 200 });
  }
}
