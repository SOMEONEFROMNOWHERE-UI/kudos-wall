const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const classifyKudos = async (text) => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) return { passed: true, badge: 'GOOD_VIBES' };

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
            content: `You are a vibe classifier + moderator for a team kudos platform. Given a kudos message: 1. MODERATE: block if contains insults, negativity, harassment, hate speech, political content, or anything workplace-inappropriate. 2. CLASSIFY: if passed, assign ONE badge from: CLUTCH_MOVE, BIG_BRAIN, CARRIED_TEAM, GROWTH_MODE, ON_FIRE, ROCKET, GOOD_VIBES. Respond ONLY valid JSON, no markdown: {"passed":true/false,"reason":"if blocked","badge":"SLUG or null"}`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!res.ok) return { passed: true, badge: 'GOOD_VIBES' };
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim();
    if (!raw) return { passed: true, badge: 'GOOD_VIBES' };
    const parsed = JSON.parse(raw);
    return {
      passed: parsed.passed ?? true,
      badge: parsed.badge || 'GOOD_VIBES',
      reason: parsed.reason,
    };
  } catch {
    return { passed: true, badge: 'GOOD_VIBES' };
  }
};

export default classifyKudos;
