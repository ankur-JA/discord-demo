'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: number;
  content: string;
  author_username: string;
  author_id: string;
  timestamp: string;
  messageUrl: string;
}

// Sanitize content to prevent XSS
function sanitizeContent(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Truncate content with ellipsis
function truncateContent(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + '...';
}

export function LatestAnnouncement({ linkId }: { linkId: number }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`/api/announcements?linkId=${linkId}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, [fetchLatest]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="h-3 bg-white/10 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-purple-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-purple-200/60 text-sm">
          No announcements yet. Post a message in the #announcements channel to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement, index) => (
        <div
          key={announcement.id}
          className={`bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 transition-all hover:bg-white/10 ${
            index === 0 ? 'ring-2 ring-indigo-400/50' : ''
          }`}
        >
          {index === 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
              Latest
            </div>
          )}
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {announcement.author_username?.[0]?.toUpperCase() || '?'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white">
                  {announcement.author_username || 'Unknown'}
                </span>
                <span className="text-xs text-purple-200/50">
                  {announcement.timestamp
                    ? formatDistanceToNow(new Date(announcement.timestamp), { addSuffix: true })
                    : 'Just now'}
                </span>
              </div>
              
              <p className="text-purple-100/90 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {truncateContent(sanitizeContent(announcement.content || ''))}
              </p>
              
              {announcement.messageUrl && (
                <a
                  href={announcement.messageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  <span>View in Discord</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
