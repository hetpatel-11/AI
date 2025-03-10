export type Language = 'EN' | 'JA';

export interface TranslationRequest {
  text: string;
  sourceLang: Language;
  targetLang: Language;
}

export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
}