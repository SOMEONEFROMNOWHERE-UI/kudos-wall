import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // We check for both since Next.js backend has access to process.env.OPENAI_API_KEY
    // The user's OPENAI_API_KEY is actually a Groq key (starts with gsk_)
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ passed: true, badge: 'GOOD_VIBES', reason: 'No API key' });
    }

    const isGroq = apiKey.startsWith('gsk_');
    const endpoint = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-3.5-turbo';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a vibe classifier + moderator for a team kudos platform. Given a kudos message: 1. MODERATE: block if contains insults, negativity, harassment, hate speech, political content, or anything workplace-inappropriate. 2. CLASSIFY: if passed, assign ONE badge from: CLUTCH_MOVE, BIG_BRAIN, CARRIED_TEAM, GROWTH_MODE, ON_FIRE, ROCKET, GOOD_VIBES. Respond ONLY valid JSON, no markdown: {"passed":true/false,"reason":"if blocked","badge":"SLUG or null"}`
          },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      console.error('Vibe AI error:', await res.text());
      return NextResponse.json({ passed: true, badge: 'GOOD_VIBES', reason: 'API error' });
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ passed: true, badge: 'GOOD_VIBES', reason: 'Empty response' });
    }
    
    const result = JSON.parse(content);
    return NextResponse.json({
      passed: result.passed ?? true,
      badge: result.badge || 'GOOD_VIBES',
      reason: result.reason,
    });
  } catch (error) {
    console.error('Vibe parsing error:', error);
    return NextResponse.json({ passed: true, badge: 'GOOD_VIBES', reason: 'Parse error' });
  }
}
