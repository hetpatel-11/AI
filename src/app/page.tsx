import ClientVoiceWrapper from '@/components/ClientVoiceWrapper';

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-4xl font-bold text-center">
        Voice Translation Hub
      </h1>

      <div className="w-full max-w-4xl space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Real-time Voice Translation
          </h2>
          <ClientVoiceWrapper />
        </section>
      </div>
    </main>
  );
}