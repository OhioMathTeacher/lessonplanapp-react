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
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          fileBlock,
          {
            type: 'text',
            text: `You are an instructional coach helping math teachers revise their lesson plans.

Analyze this lesson plan and provide specific, actionable suggestions in three areas. For each area, provide exactly 3 suggestions. Each suggestion needs a short bold summary (one sentence, under 15 words) and a detailed explanation (2-3 sentences with specific tools, strategies, or examples).

Respond with ONLY a JSON object — no markdown, no extra text — in this exact format:
{
  "technology": [
    {"summary": "Short one-sentence summary", "detail": "Detailed 2-3 sentence explanation with specific tools and examples"},
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"},
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"}
  ],
  "differentiation": [
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"},
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"},
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"}
  ],
  "discourse": [
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"},
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"},
    {"summary": "Short one-sentence summary", "detail": "Detailed explanation"}
  ]
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
