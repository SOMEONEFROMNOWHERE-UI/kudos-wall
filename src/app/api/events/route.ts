/**
 * SSE endpoint — broadcasts presence, reactions, and workspace pulse
 * to all connected clients via Server-Sent Events.
 *
 * Usage: GET /api/events?user=<name>
 * Clients subscribe on mount, server sends events as they happen.
 */
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory store (shared across serverless invocations within one process)
declare global {
  var sseClients: Map<string, { name: string; controller: ReadableStreamDefaultController }> | undefined;
  var sseReactions: Map<string, Record<string, number>> | undefined;
  var ssePulseToday: { count: number; date: string } | undefined;
}

if (!global.sseClients) {
  global.sseClients = new Map();
}
if (!global.sseReactions) {
  global.sseReactions = new Map();
}
if (!global.ssePulseToday) {
  const today = new Date().toISOString().split('T')[0];
  global.ssePulseToday = { count: 0, date: today };
}

export const sseClients = global.sseClients;
export const sseReactions = global.sseReactions;
export const ssePulseToday = global.ssePulseToday!;

function broadcast(event: string, data: unknown, excludeId?: string) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, client] of sseClients) {
    if (id === excludeId) continue;
    try {
      client.controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      sseClients.delete(id);
    }
  }
}

export function broadcastReaction(kudosId: string, emoji: string, counts: Record<string, number>) {
  broadcast('reaction', { kudosId, emoji, counts });
}

export function broadcastKudos(kudos: unknown) {
  broadcast('new_kudos', kudos);
  // bump today's pulse
  const today = new Date().toISOString().split('T')[0];
  if (ssePulseToday.date !== today) {
    ssePulseToday.count = 0;
    ssePulseToday.date = today;
  }
  ssePulseToday.count += 1;
  broadcast('pulse', { todayCount: ssePulseToday.count });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userName = searchParams.get('user') || 'anonymous';
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let streamController: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;

      // Register this client
      sseClients.set(clientId, { name: userName, controller });

      // Send initial state
      const presence = Array.from(sseClients.values()).map(c => c.name);
      const today = new Date().toISOString().split('T')[0];
      if (ssePulseToday.date !== today) { ssePulseToday.count = 0; ssePulseToday.date = today; }

      const init = `event: init\ndata: ${JSON.stringify({
        presence,
        todayCount: ssePulseToday.count,
        reactions: Object.fromEntries(sseReactions),
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(init));

      // Broadcast updated presence to everyone
      broadcast('presence', { users: presence });

      // Heartbeat every 25s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        sseClients.delete(clientId);
        const remaining = Array.from(sseClients.values()).map(c => c.name);
        broadcast('presence', { users: remaining });
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
