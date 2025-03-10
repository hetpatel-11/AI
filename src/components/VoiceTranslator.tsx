"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceLanguage } from '@/types/voice-translator';

export default function VoiceTranslator() {
  const [sourceLang, setSourceLang] = useState<VoiceLanguage>('en');
  const [targetLang, setTargetLang] = useState<VoiceLanguage>('ja');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedAudioUrl, setTranslatedAudioUrl] = useState<string>('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const detectSilence = (stream: MediaStream) => {
    const audioContext = audioContextRef.current!;
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 2048;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkVolume = () => {
      if (!isRecording) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      if (average < 10) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
          }
        }, 1500);
      } else {
        clearTimeout(silenceTimeoutRef.current);
      }

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        await handleTranslation(audioBlob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      detectSilence(stream);
    } catch (err) {
      setError('Failed to access microphone');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearTimeout(silenceTimeoutRef.current);
      setIsRecording(false);
    }
  };

  const handleTranslation = async (audioBlob: Blob) => {
    try {
      setIsTranslating(true);
      setError('');

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sourceLang', sourceLang);
      formData.append('targetLang', targetLang);

      const response = await fetch('/api/voice-translate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslatedAudioUrl(data.audioUrl);

      const audio = new Audio(data.audioUrl);
      await audio.play();
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <Card className="p-6 w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Select value={sourceLang} onValueChange={(value: VoiceLanguage) => setSourceLang(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleSwapLanguages}
          variant="outline"
          className="px-4 py-2"
        >
          ⇄
        </Button>

        <Select value={targetLang} onValueChange={(value: VoiceLanguage) => setTargetLang(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Target Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <Button
            onClick={() => isRecording ? stopRecording() : startRecording()}
            variant={isRecording ? 'destructive' : 'default'}
            className="w-40"
            disabled={isTranslating}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>

        {isTranslating && (
          <div className="text-center text-sm text-muted-foreground">
            Translating...
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-500">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}