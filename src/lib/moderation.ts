import Groq from 'groq-sdk';
import OpenAI from 'openai';

export async function moderateContent(message: string): Promise<{ verdict: 'pass' | 'fail'; reason?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // If no API key is provided, default to pass to not break local development
    return { verdict: 'pass' };
  }

  try {
    const isGroq = apiKey.startsWith('gsk_');
    const systemPrompt = `You are a content moderator for a workplace peer-recognition app. Classify the following message as 'pass' if it is positive, kind, encouraging, or neutral feedback. Classify it as 'fail' if it contains insults, sarcasm meant to demean, harassment, profanity directed at a person, or any negative/hurtful sentiment. Respond with JSON only: {"verdict": "pass"|"fail", "reason": "..."}. No other text.`;
    let content = '';

    if (isGroq) {
      const groq = new Groq({ apiKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      content = chatCompletion.choices[0]?.message?.content || '';
    } else {
      const openai = new OpenAI({ apiKey });
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'gpt-3.5-turbo',
        response_format: { type: 'json_object' }
      });
      content = chatCompletion.choices[0]?.message?.content || '';
    }

    const result = JSON.parse(content);
    return {
      verdict: result.verdict === 'fail' ? 'fail' : 'pass',
      reason: result.reason
    };
  } catch (error) {
    console.error('Moderation error:', error);
    // Fail closed on error as requested: "If the moderation API call itself fails/times out, do not silently allow... block submission"
    return { verdict: 'fail', reason: "Couldn't verify message right now, please try again." };
  }
}
