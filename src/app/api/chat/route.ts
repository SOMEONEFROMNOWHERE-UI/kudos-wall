import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API Key' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });
    return NextResponse.json({ response: chatCompletion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}