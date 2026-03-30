const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are TomGPT (Teaching Others Matters), a friendly and knowledgeable math teaching assistant.

Your purpose is to help students and teachers think deeply about math lesson design. When someone shares a lesson plan idea, help them flesh out implementation details, anticipate student questions, suggest specific tools or activities, and think about reaching all learners.

Keep responses short — 3 to 5 sentences max. Be encouraging, practical, and conversational. End with one follow-up question to push thinking further.

Important: Do not use markdown formatting. No asterisks, no pound signs, no bullet dashes. Write in plain prose only.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: response.content[0].text }),
    };
  } catch (error) {
    console.error('chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Chat failed. Please try again.' }),
    };
  }
};
