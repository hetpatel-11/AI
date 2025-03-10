import { NextResponse } from 'next/server';
import * as deepl from 'deepl-node';
import { TranslationRequest } from '@/types/translator';

const translator = new deepl.Translator(process.env.DEEPL_API_KEY!);

export async function POST(request: Request) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, targetLang } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const result = await translator.translateText(
      text,
      null,
      targetLang.toLowerCase() as deepl.TargetLanguageCode
    );

    return NextResponse.json({
      translatedText: result.text,
      detectedLanguage: result.detectedSourceLang,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}