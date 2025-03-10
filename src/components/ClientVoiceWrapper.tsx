"use client";

import dynamic from 'next/dynamic';

const VoiceTranslator = dynamic(
  () => import('./VoiceTranslator'),
  { ssr: false }
);

export default function ClientVoiceWrapper() {
  return <VoiceTranslator />;
}