import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    const sourceLang = formData.get('sourceLang') as string;
    const targetLang = formData.get('targetLang') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert audio to text using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    // Translate the text if source and target languages are different
    let translatedText = transcription.text;
    if (sourceLang !== targetLang) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Translate this text from ${sourceLang} to ${targetLang}: ${transcription.text}`
        }]
      });
      translatedText = completion.choices[0].message.content || '';
    }

    // Convert translated text back to speech
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: translatedText,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioBase64 = buffer.toString('base64');
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    return NextResponse.json({
      audioUrl,
      detectedLanguage: sourceLang,
    });
  } catch (error) {
    console.error('Voice translation error:', error);
    return NextResponse.json(
      { error: 'Voice translation failed' },
      { status: 500 }
    );
  }
}