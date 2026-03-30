const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fileData, mimeType } = JSON.parse(event.body);

    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    if (!isPdf && !isImage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported file type. Please upload a PDF or image.' }),
      };
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const fileBlock = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType, data: fileData } };

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          fileBlock,
          {
            type: 'text',
            text: `You are an instructional coach helping math teachers revise their lesson plans.

Analyze this lesson plan and provide specific, actionable suggestions in three areas.

Respond with ONLY a JSON object — no markdown, no extra text — in this exact format:
{
  "technology": "2-3 specific suggestions for integrating technology tools such as Desmos, GeoGebra, Nearpod, or Pear Deck",
  "differentiation": "2-3 specific suggestions for meeting diverse learner needs, including both struggling and advanced students",
  "discourse": "2-3 specific suggestions for increasing mathematical discussion and student talk"
}`,
          },
        ],
      }],
    });

    const raw = message.content[0].text.trim();
    // Strip markdown code fences if Claude wraps the response
    const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    const ideas = JSON.parse(cleaned);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ideas),
    };
  } catch (error) {
    console.error('generate error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate ideas. Please try again.' }),
    };
  }
};
