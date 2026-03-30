import { useState } from 'react';
import {
  DEFAULT_RANKING_CONFIG,
  type RankingEntry,
} from '../services/rankingService';
import { STORAGE_KEYS } from '../config';

export const NICK_KEY = STORAGE_KEYS.rankingNick;

function Medal({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-yellow-400 font-black text-base leading-none">1</span>;
  if (pos === 2) return <span className="text-slate-300 font-black text-base leading-none">2</span>;
  if (pos === 3) return <span className="text-amber-600 font-black text-base leading-none">3</span>;
  return <span className="text-text-muted font-bold text-sm leading-none">{pos}</span>;
}

function MedalIcon({ pos }: { pos: number }) {
  if (pos === 1)
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400 shrink-0">
        <path d="M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 12 4zm-1 2v4l3 2-1 1.5-3.5-2.5V6h1.5z" />
        <path d="M7.5 15.5 6 22l6-3 6 3-1.5-6.5A8.96 8.96 0 0 1 12 17a8.96 8.96 0 0 1-4.5-1.5z" />
      </svg>
    );
  if (pos === 2)
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-300 shrink-0">
        <path d="M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 12 4zm-1 2v4l3 2-1 1.5-3.5-2.5V6h1.5z" />
        <path d="M7.5 15.5 6 22l6-3 6 3-1.5-6.5A8.96 8.96 0 0 1 12 17a8.96 8.96 0 0 1-4.5-1.5z" />
      </svg>
    );
  if (pos === 3)
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-600 shrink-0">
        <path d="M12 2a7 7 0 1 0 0 14A7 7 0 0 0 12 2zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 12 4zm-1 2v4l3 2-1 1.5-3.5-2.5V6h1.5z" />
        <path d="M7.5 15.5 6 22l6-3 6 3-1.5-6.5A8.96 8.96 0 0 1 12 17a8.96 8.96 0 0 1-4.5-1.5z" />
      </svg>
    );
  return null;
}

export default function RankingModal({
  onClose,
  onStartRanking,
  entries,
  loadingRanking,
  rankingError,
}: {
  onClose: () => void;
  onStartRanking: (nick: string) => void;
  entries: RankingEntry[];
  loadingRanking: boolean;
  rankingError?: boolean;
}) {
  const [nick, setNick] = useState(localStorage.getItem(NICK_KEY) ?? '');
  const [nickError, setNickError] = useState('');

  const handleJoin = () => {
    const trimmed = nick.trim();
    if (trimmed.length === 0) { setNickError('Nick cannot be empty.'); return; }
    if (trimmed.length < 3) { setNickError('Minimum 3 characters.'); return; }
    onClose();
    onStartRanking(trimmed);
  };

  const cfg = DEFAULT_RANKING_CONFIG;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-bg-overlay backdrop-blur-sm" />
      <div
        className="relative z-10 w-[90vw] max-w-3xl h-[80vh] max-h-[600px] bg-bg-card border border-accent-border shadow-2xl flex flex-col overflow-hidden"
        style={{ clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-drawer-border shrink-0">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <h2 className="text-sm font-black uppercase tracking-widest text-accent">Global Ranking</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-accent transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0 divide-x divide-drawer-border">
          {/* LEFT — Ranking table */}
          <div className="flex-1 flex flex-col min-w-0 p-4 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-widest text-accent-muted font-bold mb-3">Top 10 — Best streak</p>
            {rankingError && entries.length > 0 && (
              <p className="text-[10px] text-warning uppercase tracking-widest font-bold mb-2">
                Offline — showing cached data
              </p>
            )}
            {loadingRanking ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-text-muted">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest">Loading...</span>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 opacity-40">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                </svg>
                <p className="text-xs">No entries yet.</p>
                <p className="text-xs opacity-60">Be the first!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {entries.map((e, i) => (
                  <div
                    key={e.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                      i === 0 ? 'bg-yellow-500/10 border-yellow-500/30'
                      : i === 1 ? 'bg-slate-400/10 border-slate-400/20'
                      : i === 2 ? 'bg-amber-700/10 border-amber-700/20'
                      : 'bg-bg-surface border-border-subtle'
                    }`}
                  >
                    <div className="w-5 flex items-center justify-center shrink-0">
                      <Medal pos={i + 1} />
                    </div>
                    {i < 3 && <MedalIcon pos={i + 1} />}
                    <span className="flex-1 text-sm font-bold text-text-primary truncate">{e.nick}</span>
                    <span className="tabular-nums font-black text-accent text-base shrink-0">{e.score}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider shrink-0">streak</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Registration */}
          <div className="flex-1 flex flex-col min-w-0 p-4 gap-4 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-widest text-accent-muted font-bold">Join</p>

            {/* Config requirements */}
            <div className="bg-bg-surface border border-border-subtle rounded-lg px-4 py-3 flex flex-col gap-2">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Required config</p>
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Speed</span>
                  <span className="font-black text-accent tabular-nums">{cfg.speed}x</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Break window</span>
                  <span className="font-black text-accent tabular-nums">{cfg.breakWindow} frames</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Frame start</span>
                  <span className="font-black text-accent tabular-nums">{cfg.frameStart}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">Throws</span>
                  <span className="font-black text-accent tabular-nums">1 · 2 · 1+2</span>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2 items-start text-xs text-text-secondary">
                <span className="text-accent shrink-0 mt-0.5">→</span>
                <span>Your streak is recorded on your <strong className="text-text-primary">first miss</strong>.</span>
              </div>
              <div className="flex gap-2 items-start text-xs text-text-secondary">
                <span className="text-accent shrink-0 mt-0.5">→</span>
                <span>Existing records only update if you beat your <strong className="text-text-primary">best streak</strong>.</span>
              </div>
              <div className="flex gap-2 items-start text-xs text-text-secondary">
                <span className="text-accent shrink-0 mt-0.5">→</span>
                <span>You must use the required config shown above.</span>
              </div>
              <div className="flex gap-2 items-start text-xs text-text-secondary">
                <span className="text-accent shrink-0 mt-0.5">→</span>
                <span>Player side <strong className="text-text-primary">(P1 / P2)</strong> changes randomly on each throw.</span>
              </div>
            </div>

            {/* Nick input */}
            <div className="flex flex-col gap-1.5 mt-auto">
              <label className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Your nick</label>
              <input
                type="text"
                value={nick}
                maxLength={20}
                placeholder="e.g. Kazuya99"
                onChange={(e) => { setNick(e.target.value); setNickError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
                className="bg-bg-surface border border-accent-border text-text-primary placeholder-text-muted px-3 py-2 text-sm font-bold focus:outline-none focus:border-accent transition-colors"
              />
              {nickError && <p className="text-[11px] text-danger font-bold">{nickError}</p>}
            </div>

            {/* Join button */}
            <button
              onClick={handleJoin}
              className="w-full py-3 text-sm font-black uppercase tracking-widest italic bg-accent text-bg-primary border-2 border-accent hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all duration-150 cursor-pointer select-none shadow-lg shadow-accent/20"
              style={{ clipPath: 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)' }}
            >
              Start as {nick.trim() || '...'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
