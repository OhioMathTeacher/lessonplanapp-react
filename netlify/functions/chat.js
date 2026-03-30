const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are ToddGPT, a friendly and knowledgeable math teaching assistant created by Mr. Todd for his students.

Your purpose is to help students and teachers think deeply about math lesson design. When someone shares a lesson plan idea, you help them:
- Flesh out implementation details and step-by-step strategies
- Anticipate student questions and misconceptions
- Connect ideas to broader math concepts and pedagogy
- Suggest specific tools, activities, or discussion prompts
- Think about how to reach all learners in the room

You are encouraging, practical, and focused on making math accessible and engaging. Keep responses clear and conversational — you're a coach, not a textbook. When appropriate, ask a follow-up question to push thinking further.`;

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
