import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';


let genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

  
    const gen = getGenAI();
    if (!gen) {
      if (process.env.MOCK_CAPTION === 'true') {

        const mocked = `Playful vibes: Sun-kissed moments and good energy. \n\nSmile caption: "Living for these golden hour feels!" \n\nShort & sweet: "Sun. Smiles. Repeat."`;
        return NextResponse.json({ caption: mocked });
      }

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