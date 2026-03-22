export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const ANTHROPIC_API_KEY = Netlify.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), { status: 400 });
    }

    // Sanitize messages - only allow user/assistant roles with string content
    const sanitized = messages
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
      .slice(-20);

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages' }), { status: 400 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a friendly English tutor helping a B1-B2 Spanish speaker improve their English. Your rules:
1. ALWAYS respond in English primarily, but include Spanish translations in parentheses for key corrections.
2. If the user makes grammar, vocabulary, or phrasing errors, GENTLY correct them at the start of your response using this format: "✏️ Small fix: [corrected version]" then explain briefly why.
3. If the sentence is correct, acknowledge it: "✅ Perfect sentence!"
4. Then continue the conversation naturally, asking follow-up questions to keep them talking.
5. Occasionally introduce a new useful word or expression relevant to the topic, marked with "💡 New expression: ..."
6. Keep responses concise (2-4 sentences max for the conversational part).
7. Be encouraging and warm. Never make the user feel bad about mistakes.
8. If the user writes in Spanish, gently encourage them to try in English and help them translate.`,
        messages: sanitized,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'API error' }), { status: 502 });
    }

    const reply = data.content?.map(c => c.text || '').join('') || '';
    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};

export const config = {
  path: '/.netlify/functions/chat',
};
