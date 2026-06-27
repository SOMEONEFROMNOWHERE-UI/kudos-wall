import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert hype writer and professional peer-recognition coach. 
Your job is to rewrite the user's raw kudos message into something extremely positive, punchy, warm, and specific. 
Even if the original message sounds negative, critical, or poorly worded, transform it into a supportive and constructive compliment. 
Keep it under 3 sentences. 
Return ONLY the rewritten message, no quotes, no explanation.`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      })
    });

    if (!res.ok) {
      console.error('Enhance API error:', await res.text());
      return NextResponse.json({ error: 'API error' }, { status: 500 });
    }

    const data = await res.json();
    let content = data.choices[0]?.message?.content?.trim() || '';
    
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
    } else if (content.startsWith("'") && content.endsWith("'")) {
      content = content.slice(1, -1);
    }
    
    return NextResponse.json({ enhanced: content });
  } catch (error) {
    console.error('Enhancement error:', error);
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 });
  }
}
