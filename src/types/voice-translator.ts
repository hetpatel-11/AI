export type VoiceLanguage = 'en' | 'ja';

export interface AudioTranslationResponse {
  audioUrl: string;
  detectedLanguage?: string;
}