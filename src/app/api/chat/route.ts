import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });
    return NextResponse.json({ response: chatCompletion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}