const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const PROMPT = `You are an instructional coach helping math teachers revise their lesson plans.

Analyze this lesson plan and provide specific, actionable suggestions in three areas. For each area, provide exactly 3 suggestions. Each suggestion needs a short summary (one sentence, under 15 words) and a rich, detailed explanation (4-6 sentences) that includes: the specific strategy or tool to use, how to implement it step-by-step in this lesson, what the teacher would say or do, and the pedagogical reason it helps students.

Respond with ONLY a JSON object — no markdown, no extra text — in this exact format:
{
  "technology": [
    {"summary": "Short one-sentence summary", "detail": "Rich 4-6 sentence explanation with specific tools, implementation steps, example teacher moves, and rationale"},
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"},
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"}
  ],
  "differentiation": [
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"},
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"},
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"}
  ],
  "discourse": [
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"},
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"},
    {"summary": "Short one-sentence summary", "detail": "Rich explanation"}
  ]
}`;

async function callGroq(messages, model) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: 3000, messages }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Groq API error:', response.status, errText);
    throw new Error(`Groq API returned ${response.status}`);
  }

  return response.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fileData, mimeType } = JSON.parse(event.body);

    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || mimeType === 'application/msword';

    if (!isPdf && !isImage && !isDocx) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported file type. Please upload a PDF, image, or DOCX.' }),
      };
    }

    let data;

    if (isImage) {
      // Vision model for images
      data = await callGroq([{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${fileData}` } },
          { type: 'text', text: PROMPT },
        ],
      }], 'llama-3.2-11b-vision-preview');
    } else {
      // Extract text from PDF or DOCX, then use text model
      const buffer = Buffer.from(fileData, 'base64');
      let lessonText;

      if (isPdf) {
        const parsed = await pdfParse(buffer);
        lessonText = parsed.text;
      } else {
        const result = await mammoth.extractRawText({ buffer });
        lessonText = result.value;
      }

      data = await callGroq([{
        role: 'user',
        content: `${PROMPT}\n\nLesson plan:\n${lessonText}`,
      }], 'llama-3.3-70b-versatile');
    }

    const raw = data.choices[0].message.content.trim();
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
