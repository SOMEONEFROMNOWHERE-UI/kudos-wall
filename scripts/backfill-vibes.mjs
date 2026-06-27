import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const GROQ_API_KEY = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

if (!MONGODB_URI || !GROQ_API_KEY) {
  console.error("Missing DB or API key");
  process.exit(1);
}

const isGroq = GROQ_API_KEY.startsWith('gsk_');
const GROQ_API_URL = isGroq 
  ? 'https://api.groq.com/openai/v1/chat/completions'
  : 'https://api.openai.com/v1/chat/completions';
const MODEL = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-3.5-turbo';

async function classify(text) {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a vibe classifier + moderator for a team kudos platform. Given a kudos message: 1. MODERATE: block if contains insults, negativity, harassment, hate speech, political content, or anything workplace-inappropriate. 2. CLASSIFY: if passed, assign ONE badge from: CLUTCH_MOVE, BIG_BRAIN, CARRIED_TEAM, GROWTH_MODE, ON_FIRE, ROCKET, GOOD_VIBES. Respond ONLY valid JSON, no markdown: {"passed":true/false,"reason":"if blocked","badge":"SLUG or null"}'
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });
  if (!res.ok) {
    console.error("Failed to fetch from Groq", await res.text());
    return 'GOOD_VIBES';
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content?.trim();
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed.badge || 'GOOD_VIBES';
  } catch (e) {
    return 'GOOD_VIBES';
  }
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const kudos = db.collection('kudos');
  
  const docs = await kudos.find({ badge: 'GOOD_VIBES' }).toArray();
  console.log(`Found ${docs.length} cards with GOOD_VIBES to backfill...`);
  
  for (const doc of docs) {
    if (!doc.message) continue;
    const newBadge = await classify(doc.message);
    if (newBadge !== 'GOOD_VIBES') {
      await kudos.updateOne({ _id: doc._id }, { $set: { badge: newBadge } });
      console.log(`Updated ${doc._id} -> ${newBadge}`);
    } else {
      console.log(`Kept ${doc._id} as GOOD_VIBES`);
    }
    // Rate limiting delay for groq
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await client.close();
  console.log("Backfill complete!");
}

run().catch(console.error);
