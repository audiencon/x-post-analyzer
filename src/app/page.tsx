import ClientHome from './ui/ClientHome';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostRoast - AI-Powered X (Twitter) Post Analysis & Roasting',
  description:
    'Get your X (Twitter) posts roasted by AI! PostRoast analyzes your content for engagement, clarity, and provides actionable feedback to improve.',
};

export default async function Home() {
  return (
    <main className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-8">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(40,minmax(0,1fr))] opacity-[0.15]">
        {Array.from({ length: 1600 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-gray-100/20" />
        ))}
      </div>
      <ClientHome />
    </main>
  );
}
