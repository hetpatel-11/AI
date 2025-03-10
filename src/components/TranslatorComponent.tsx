"use client";

import { useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Language, TranslationResponse } from '@/types/translator';

export default function TranslatorComponent() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('EN');
  const [targetLang, setTargetLang] = useState<Language>('JA');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const translateText = async () => {
      if (!inputText.trim()) {
        setOutputText('');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: inputText,
            sourceLang,
            targetLang,
          }),
        });

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const data: TranslationResponse = await response.json();
        setOutputText(data.translatedText);
      } catch (err) {
        setError('Translation failed. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(translateText, 500);
    return () => clearTimeout(debounceTimeout);
  }, [inputText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Select value={sourceLang} onValueChange={(value: Language) => setSourceLang(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Source Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="JA">Japanese</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleSwapLanguages}
          variant="outline"
          className="px-4 py-2"
        >
          ⇄
        </Button>

        <Select value={targetLang} onValueChange={(value: Language) => setTargetLang(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Target Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EN">English</SelectItem>
            <SelectItem value="JA">Japanese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <TextareaAutosize
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to translate..."
            className="w-full resize-none border-none focus:outline-none bg-transparent"
            minRows={5}
          />
        </Card>

        <Card className="p-4">
          <TextareaAutosize
            value={outputText}
            readOnly
            placeholder="Translation will appear here..."
            className="w-full resize-none border-none focus:outline-none bg-transparent"
            minRows={5}
          />
        </Card>
      </div>

      {isLoading && (
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
  );
}