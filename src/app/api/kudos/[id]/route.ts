import { NextResponse } from 'next/server';
import dbConnect, { memoryDb } from '@/lib/mongodb';
import Kudos from '@/lib/models/Kudos';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await dbConnect();
    const id = params.id;
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (!db) {
      const idx = memoryDb.kudos.findIndex(k => k._id === id);
      if (idx === -1) {
        return NextResponse.json({ error: 'Kudos not found' }, { status: 404 });
      }
      memoryDb.kudos[idx].message = message.trim();
      return NextResponse.json(memoryDb.kudos[idx]);
    }

    const updated = await Kudos.findByIdAndUpdate(
      id,
      { message: message.trim() },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Kudos not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/kudos/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update kudos' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await dbConnect();
    const id = params.id;

    if (!db) {
      const idx = memoryDb.kudos.findIndex(k => k._id === id);
      if (idx === -1) {
        return NextResponse.json({ error: 'Kudos not found' }, { status: 404 });
      }
      memoryDb.kudos.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    const deleted = await Kudos.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Kudos not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/kudos/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete kudos' }, { status: 500 });
  }
}
