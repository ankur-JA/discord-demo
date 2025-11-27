'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Connecting to Discord...');

  useEffect(() => {
    if (!code) {
      setError('No authorization code received');
      return;
    }

    const fetchGuilds = async () => {
      try {
        setStatus('Exchanging authorization code...');
        const res = await fetch(`/api/discord/oauth-callback?code=${code}`);
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Authentication failed');
        }
        
        const { guilds } = await res.json();
        
        setStatus('Loading your servers...');
        localStorage.setItem('discord_guilds', JSON.stringify(guilds));
        
        setTimeout(() => {
          router.push('/');
        }, 500);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to authenticate with Discord');
      }
    };

    fetchGuilds();
  }, [code, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
          <p className="text-red-300/80 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-6 rounded-xl transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-xl text-white font-medium">{status}</p>
        <p className="text-purple-200/60 mt-2 text-sm">Please wait while we set things up...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
