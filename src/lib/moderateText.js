const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const moderateText = async (text) => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) return { passed: true };

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a content moderator for a professional team platform. Check if the text contains: hate speech, insults, harassment, slurs, sexual content, threats, political attacks, or anything inappropriate for a workplace. Respond ONLY with valid JSON, no markdown: {"passed": true/false, "reason": "short reason if blocked"}`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 80,
      }),
    });

    if (!res.ok) return { passed: true };
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return { passed: true };
    return JSON.parse(raw);
  } catch {
    return { passed: true };
  }
};

export default moderateText;
