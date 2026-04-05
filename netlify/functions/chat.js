const SYSTEM_PROMPT = `You are ToddGPT, a math teaching coach. Be brief and conversational.

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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq chat error:', response.status, errText);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: data.choices[0].message.content }),
    };
  } catch (error) {
    console.error('chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Chat failed. Please try again.' }),
    };
  }
};
