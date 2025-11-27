'use client';

import { useState, useEffect } from 'react';
import { LatestAnnouncement } from './LatestAnnouncement';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
  owner: boolean;
}

interface SetupData {
  guild_id: string;
  category_id: string;
  channels: Array<{ name: string; id: string; type: number }>;
  link_id: number;
}

export function Dashboard() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [hackathonName, setHackathonName] = useState('demo-2025');
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'success' | 'bot_missing' | 'error'>('idle');
  const [inviteUrl, setInviteUrl] = useState('');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('discord_guilds');
    if (stored) {
      setGuilds(JSON.parse(stored));
    }
  }, []);

  const handleSetup = async () => {
    if (!selectedGuild) return;
    setSetupStatus('loading');
    setInviteUrl('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/discord/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          ownerUserId: 'demo-user',
          hackathonName: hackathonName.toLowerCase().replace(/\s+/g, '-'),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.error === 'BOT_MISSING') {
          setSetupStatus('bot_missing');
          setInviteUrl(data.inviteUrl);
        } else {
          setSetupStatus('error');
          setErrorMessage(data.error || 'Setup failed');
        }
        return;
      }

      setSetupData(data.metadata);
      setSetupStatus('success');
    } catch (err) {
      console.error(err);
      setSetupStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('discord_guilds');
    window.location.reload();
  };

  const getGuildIcon = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    }
    return null;
  };

  if (guilds.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Discord Servers</h2>
        <button 
          onClick={handleLogout} 
          className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Disconnect
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <label className="block text-sm font-medium text-purple-200 mb-3">
              Select a Server to Configure
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {guilds.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGuild(g);
                    setSetupStatus('idle');
                    setSetupData(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedGuild?.id === g.id
                      ? 'bg-indigo-500/30 border-2 border-indigo-400'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  {getGuildIcon(g) ? (
                    <img
                      src={getGuildIcon(g)!}
                      alt={g.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {g.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="text-left flex-1">
                    <div className="font-medium text-white">{g.name}</div>
                    <div className="text-xs text-purple-300/60">
                      {g.owner ? 'Owner' : 'Admin'}
                    </div>
                  </div>
                  {selectedGuild?.id === g.id && (
                    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedGuild && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configure Hackathon
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-purple-200/80 mb-2">
                    Hackathon Name
                  </label>
                  <input
                    type="text"
                    value={hackathonName}
                    onChange={(e) => setHackathonName(e.target.value)}
                    placeholder="e.g., devhacks-2025"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                  />
                  <p className="text-xs text-purple-200/50 mt-1">
                    Category will be named: <span className="text-indigo-300">hackathon-{hackathonName.toLowerCase().replace(/\s+/g, '-')}</span>
                  </p>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-xl p-4">
                  <p className="text-sm text-purple-200/80 mb-2">
                    This will create the following channels in <strong className="text-white">{selectedGuild.name}</strong>:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['announcements', 'general', 'find-a-team', 'ask-a-mentor', 'technical-support', 'judging-questions', 'submission-help'].map((ch) => (
                      <span key={ch} className="text-xs bg-white/10 px-2 py-1 rounded-md text-purple-200">
                        #{ch}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSetup}
                  disabled={setupStatus === 'loading' || !hackathonName.trim()}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25"
                >
                  {setupStatus === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting up...
                    </span>
                  ) : (
                    'Create Channels & Setup'
                  )}
                </button>
              </div>
            </div>
          )}

          {setupStatus === 'bot_missing' && (
            <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-300 mb-1">Bot Not Installed</h4>
                  <p className="text-sm text-amber-200/80 mb-4">
                    The hackathon bot needs to be added to <strong>{selectedGuild?.name}</strong> before channels can be created.
                  </p>
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Invite Bot to Server
                  </a>
                  <p className="text-xs text-amber-200/50 mt-3">
                    After adding the bot, click &quot;Create Channels&quot; again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {setupStatus === 'success' && setupData && (
            <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-300 mb-1">Setup Complete!</h4>
                  <p className="text-sm text-emerald-200/80 mb-3">
                    {setupData.channels.length} channels created in category <strong>hackathon-{hackathonName}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {setupData.channels.map((ch) => (
                      <span key={ch.id} className="text-xs bg-emerald-500/20 px-2 py-1 rounded-md text-emerald-200">
                        #{ch.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {setupStatus === 'error' && (
            <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-300 mb-1">Setup Failed</h4>
                  <p className="text-sm text-red-200/80">
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          {setupData && setupData.link_id ? (
            <div className="sticky top-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Live Announcements
              </h3>
              <LatestAnnouncement linkId={setupData.link_id} />
              <p className="text-xs text-purple-200/50 mt-4 text-center">
                Announcements sync every 10 seconds from Discord
              </p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-semibold text-white/80 mb-2">No Announcements Yet</h3>
              <p className="text-sm text-purple-200/50">
                Setup your hackathon channels to start receiving announcements here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
