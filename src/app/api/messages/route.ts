import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import { broadcastMessage } from '@/app/api/events/route';

export const dynamic = 'force-dynamic';

const ChatMessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  isGroup: { type: Boolean, default: false },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'chat_messages' });

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

// In-memory messages storage fallback
declare global {
  var memoryMessages: any[] | undefined;
}
if (!global.memoryMessages) {
  global.memoryMessages = [];
}
const memoryMessages = global.memoryMessages;

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get('receiverId');
    const isGroup = searchParams.get('isGroup') === 'true';

    if (!receiverId) {
      return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
    }

    const userId = session.user.name;
    const db = await dbConnect();

    if (!db) {
      // In-memory fallback query
      let filtered = [];
      if (isGroup) {
        filtered = memoryMessages.filter(m => m.isGroup && m.receiverId === receiverId);
      } else {
        filtered = memoryMessages.filter(m => 
          !m.isGroup && 
          ((m.senderId === userId && m.receiverId === receiverId) ||
           (m.senderId === receiverId && m.receiverId === userId))
        );
      }
      // Sort by oldest first for chat timeline
      const sorted = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return NextResponse.json(sorted);
    }

    let query = {};
    if (isGroup) {
      query = { isGroup: true, receiverId };
    } else {
      query = {
        isGroup: false,
        $or: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      };
    }

    const messages = await ChatMessage.find(query).sort({ createdAt: 1 }).lean();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { receiverId, isGroup, content } = await request.json();
    if (!receiverId || !content || typeof content !== 'string') {
      return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 });
    }

    const senderId = session.user.name;
    const db = await dbConnect();

    const messageData = {
      _id: new mongoose.Types.ObjectId().toString(),
      senderId,
      receiverId,
      isGroup: !!isGroup,
      content: content.trim(),
      createdAt: new Date()
    };

    if (!db) {
      memoryMessages.push(messageData);
      broadcastMessage(messageData);
      return NextResponse.json(messageData, { status: 201 });
    }

    const newMessage = await ChatMessage.create({
      senderId,
      receiverId,
      isGroup: !!isGroup,
      content: content.trim()
    });

    const leanMessage = newMessage.toJSON();
    broadcastMessage(leanMessage);

    return NextResponse.json(leanMessage, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
