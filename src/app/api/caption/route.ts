import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    // Extract base64 data and mime type
    const [header, base64Data] = image.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
  } catch (error: any) {
    console.error('Caption API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
}