import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // We check for both since Next.js backend has access to process.env.OPENAI_API_KEY
    // The user's OPENAI_API_KEY is actually a Groq key (starts with gsk_)
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ sentiment: 'positive', score: 100, reason: 'No API key' });
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
            content: 'You are a sentiment analyzer. Analyze the following kudos message and respond ONLY with a JSON object: { "sentiment": "positive" | "negative" | "neutral", "score": 0-100, "reason": "brief reason" }. No other text.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      console.error('Sentiment API error:', await res.text());
      return NextResponse.json({ sentiment: 'positive', score: 100, reason: 'API error' });
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ sentiment: 'positive', score: 100, reason: 'Empty response' });
    }
    
    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sentiment parsing error:', error);
    return NextResponse.json({ sentiment: 'positive', score: 100, reason: 'Parse error' });
  }
}
