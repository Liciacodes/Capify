import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Lazy initialization: do NOT create a client at module load time so the
// app can build/deploy even when secrets are not configured. The POST
// handler will initialize the client when needed and return a 503 if it's
// not configured.
let genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI;
  }
  // If you want to support service-account JSON via GOOGLE_SERVICE_ACCOUNT_BASE64,
  // implement that initialization here according to the SDK docs.
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    const gen = getGenAI();
    if (!gen) {
      return NextResponse.json(
        { error: 'Server not configured: missing GEMINI_API_KEY' },
        { status: 503 }
      );
    }

    const [header, base64Data] = image.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';

    const model = gen.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const caption = response.text();

    return NextResponse.json({ caption });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Caption API error:', error.message, error.stack);
    } else {
      console.error('Caption API error:', error);
    }

    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
}