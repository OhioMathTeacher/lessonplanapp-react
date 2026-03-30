const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are TomGPT, a math teaching coach. Be brief and conversational.

RULES YOU MUST FOLLOW:
1. Maximum 4 sentences per response. Never more.
2. No markdown. No asterisks, no ## headers, no dashes, no bold. Plain sentences only.
3. End every response with exactly one short question.

Help the user think through their lesson idea practically and concisely.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
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
