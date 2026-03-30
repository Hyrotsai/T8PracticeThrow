import { useState, useEffect, useRef, useCallback } from "react";
import type { Theme } from "./Game";
import { historyLog, Correctness } from "./Game";
import { VERSION, SPEED_LIMITS, FAIL_DELAY_LIMITS, STORAGE_KEYS } from "../config";
import RankingModal from "./RankingModal";
import { getTopTen, type RankingEntry, type RankingMode } from "../services/rankingService";
import { loadSessionHistory } from "../hooks/useGame";
import type { SessionSummary } from "../config";
import ChangelogModal, { hasUnseenChangelog } from "./ChangelogModal";

const RANKING_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const RANKING_CACHE_KEYS: Record<RankingMode, string> = {
  p1: STORAGE_KEYS.rankingCache + '_p1',
  p2: STORAGE_KEYS.rankingCache + '_p2',
  mixed: STORAGE_KEYS.rankingCache + '_mixed',
};

function loadCachedRanking(mode: RankingMode): { entries: RankingEntry[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(RANKING_CACHE_KEYS[mode]);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCachedRanking(entries: RankingEntry[], mode: RankingMode) {
  try {
    localStorage.setItem(RANKING_CACHE_KEYS[mode], JSON.stringify({ entries, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

const THEMES: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "tekken", label: "Tekken" },
];

export default function SettingsDrawer(props: {
  get: () => {
    isP1: boolean;
    updateIsP1: (isP1: boolean) => void;
    isStanding: boolean;
    updateIsStanding: (isStanding: boolean) => void;
    possibles: { [k: string]: boolean };
    updatePossibles: (possibles: { [k: string]: boolean }) => void;
    speed: number;
    updateSpeed: (speed: number) => void;
    failDelay: number;
    updateFailDelay: (failDelay: number) => void;
    soundEnabled: boolean;
    updateSoundEnabled: (v: boolean) => void;
    theme: Theme;
    updateTheme: (theme: Theme) => void;
    onEditInputs: () => void;
    onIntro: () => void;
    onStartRanking: (nick: string, mode: RankingMode) => void;
    isRankingActive: boolean;
    onSyncComplete: (cb: () => void) => void;
    onStatsOpen: () => void;
    onStatsClose: () => void;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [circleOpen, setCircleOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([]);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const statsScrollRef = useRef<HTMLDivElement>(null);
  const [changelogOpen, setChangelogOpen] = useState(() => hasUnseenChangelog());
  const isRankingActive = props.get().isRankingActive;

  const handleStatsScroll = useCallback(() => {
    const el = statsScrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
  }, []);

  const closeStats = () => {
    setStatsOpen(false);
    props.get().onStatsClose();
  };

  // Load session history when stats open; reset scroll indicator
  useEffect(() => {
    if (statsOpen) {
      setSessionHistory(loadSessionHistory());
      setIsAtBottom(false);
    }
  }, [statsOpen]);

  // Close drawers/modals on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (changelogOpen) { setChangelogOpen(false); return; }
      if (statsOpen) { closeStats(); return; }
      if (circleOpen) { closeCircle(); return; }
      if (isOpen) { setIsOpen(false); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, statsOpen, circleOpen, changelogOpen]);

  const closeCircle = () => {
    setCircleOpen(false);
    props.get().onStatsClose();
  };

  // Pre-load ranking data on mount, and register refresh callback
  const [rankingEntriesByMode, setRankingEntriesByMode] = useState<Record<RankingMode, RankingEntry[]>>(() => ({
    p1: loadCachedRanking('p1')?.entries ?? [],
    p2: loadCachedRanking('p2')?.entries ?? [],
    mixed: loadCachedRanking('mixed')?.entries ?? [],
  }));
  const [rankingLoadingByMode, setRankingLoadingByMode] = useState<Record<RankingMode, boolean>>(() => {
    const isFresh = (m: RankingMode) => {
      const cached = loadCachedRanking(m);
      return cached ? Date.now() - cached.ts < RANKING_CACHE_TTL_MS : false;
    };
    return { p1: !isFresh('p1'), p2: !isFresh('p2'), mixed: !isFresh('mixed') };
  });
  const [rankingError, setRankingError] = useState(false);

  const refreshRanking = (force = false) => {
    const modes: RankingMode[] = ['p1', 'p2', 'mixed'];
    setRankingError(false);
    modes.forEach((mode) => {
      const cached = loadCachedRanking(mode);
      if (!force && cached && Date.now() - cached.ts < RANKING_CACHE_TTL_MS) {
        setRankingEntriesByMode((prev) => ({ ...prev, [mode]: cached.entries }));
        setRankingLoadingByMode((prev) => ({ ...prev, [mode]: false }));
        return;
      }
      setRankingLoadingByMode((prev) => ({ ...prev, [mode]: true }));
      getTopTen(mode)
        .then((entries) => {
          setRankingEntriesByMode((prev) => ({ ...prev, [mode]: entries }));
          saveCachedRanking(entries, mode);
          setRankingLoadingByMode((prev) => ({ ...prev, [mode]: false }));
        })
        .catch(() => {
          const fallback = loadCachedRanking(mode);
          if (fallback) setRankingEntriesByMode((prev) => ({ ...prev, [mode]: fallback.entries }));
          setRankingLoadingByMode((prev) => ({ ...prev, [mode]: false }));
          setRankingError(true);
        });
    });
  };

  useEffect(() => {
    refreshRanking();
    props.get().onSyncComplete(() => refreshRanking(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Circle Button - Fixed top, left of stats button */}
      <button
        onClick={() => { if (!isRankingActive) { props.get().onStatsOpen(); setCircleOpen(true); } }}
        disabled={isRankingActive}
        className={`
          fixed top-3 right-[7.25rem] md:right-[8.25rem] z-50
          w-10 h-10 md:w-12 md:h-12
          flex items-center justify-center
          bg-bg-elevated backdrop-blur-sm
          border border-accent-border
          transition-all duration-200
          rounded-full
          ${isRankingActive
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:border-accent-border-hover hover:bg-accent-subtle text-text-secondary hover:text-accent cursor-pointer'
          }
        `}
        aria-label="Global Ranking"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 md:w-6 md:h-6"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </button>

      {/* Global Ranking Modal */}
      {circleOpen && (
        <RankingModal
          onClose={() => closeCircle()}
          onStartRanking={(nick, mode) => { closeCircle(); props.get().onStartRanking(nick, mode); }}
          entriesByMode={rankingEntriesByMode}
          loadingByMode={rankingLoadingByMode}
          rankingError={rankingError}
        />
      )}

      {/* Stats Button - Fixed top, left of gear button */}
      <button
        onClick={() => { if (!isRankingActive) { props.get().onStatsOpen(); setStatsOpen(true); } }}
        disabled={isRankingActive}
        className={`
          fixed top-3 right-16 md:right-18 z-50
          w-10 h-10 md:w-12 md:h-12
          flex items-center justify-center
          bg-bg-elevated backdrop-blur-sm
          border border-accent-border
          transition-all duration-200
          rounded-lg
          ${isRankingActive
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:border-accent-border-hover hover:bg-accent-subtle text-text-secondary hover:text-accent cursor-pointer'
          }
        `}
        aria-label="Session stats"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 md:w-6 md:h-6"
        >
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      </button>

      {/* Session Stats Modal */}
      {statsOpen && (() => {
        const total = historyLog.length;
        const correct = historyLog.filter(o => o.correctness === Correctness.right).length;
        const slow    = historyLog.filter(o => o.correctness === Correctness.slow).length;
        const wrong   = historyLog.filter(o => o.correctness === Correctness.wrong).length;
        const pct = (n: number, of: number) => of === 0 ? "—" : Math.round((n / of) * 100) + "%";
        const bestStreak = total === 0 ? 0 : Math.max(...historyLog.map(o => o.streak));
        const validFrames = historyLog.filter(o => o.correctness !== Correctness.wrong && o.frame > 0);
        const avgFrame = validFrames.length === 0
          ? "—"
          : (validFrames.reduce((s, o) => s + o.frame, 0) / validFrames.length).toFixed(1);

        // Per-throw-type breakdown
        const throwTypes = ['1', '2', '1+2'] as const;
        const throwStats = throwTypes.map(type => {
          const entries = historyLog.filter(o => o.answer === type);
          const t = entries.length;
          const c = entries.filter(o => o.correctness === Correctness.right).length;
          const s = entries.filter(o => o.correctness === Correctness.slow).length;
          const w = entries.filter(o => o.correctness === Correctness.wrong).length;
          const vf = entries.filter(o => o.correctness !== Correctness.wrong && o.frame > 0);
          const af = vf.length === 0 ? "—" : (vf.reduce((acc, o) => acc + o.frame, 0) / vf.length).toFixed(1);
          return { type, t, c, s, w, af };
        }).filter(x => x.t > 0);

        return (
          <div
            className="fixed inset-0 z-[1001] flex items-center justify-center"
            onClick={closeStats}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-bg-overlay backdrop-blur-sm" />

            {/* Modal wrapper — relative so the scroll overlay can be positioned inside */}
            <div className="relative z-10 w-80 md:w-96">
            {/* Modal */}
            <div
              ref={statsScrollRef}
              onScroll={handleStatsScroll}
              className="
                w-full
                max-h-[90dvh]
                bg-bg-card border border-accent-border
                shadow-2xl flex flex-col gap-0
                overflow-y-auto
              "
              style={{ clipPath: "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-drawer-border sticky top-0 bg-bg-card z-10">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent">
                    <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                  </svg>
                  <h2 className="text-sm font-black uppercase tracking-widest text-accent">
                    Session Stats
                  </h2>
                </div>
                <button
                  onClick={closeStats}
                  className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-accent transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {total === 0 ? (
                <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-text-muted">
                    <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
                  </svg>
                  <p className="text-text-muted text-sm">No attempts yet this session.</p>
                  <p className="text-text-muted text-xs">Start training to see your stats.</p>
                </div>
              ) : (
                <div className="px-6 py-5 flex flex-col gap-5">

                  {/* Total + best streak */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-4 py-3 flex flex-col items-center gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Attempts</span>
                      <span className="text-3xl font-black tabular-nums text-text-primary leading-none">{total}</span>
                    </div>
                    <div className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-4 py-3 flex flex-col items-center gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Best Streak</span>
                      <span className="text-3xl font-black tabular-nums text-accent leading-none">{bestStreak}</span>
                    </div>
                    <div className="flex-1 bg-bg-surface border border-border-subtle rounded-lg px-4 py-3 flex flex-col items-center gap-1">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Avg Frame</span>
                      <span className="text-3xl font-black tabular-nums text-text-primary leading-none">{avgFrame}</span>
                    </div>
                  </div>

                  {/* Breakdown bars */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-1">Overall Breakdown</span>

                    {/* Correct */}
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-[11px] font-bold text-success uppercase tracking-wider">Correct</span>
                      <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full transition-all duration-500"
                          style={{ width: total === 0 ? "0%" : `${(correct / total) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums font-bold text-success">{pct(correct, total)}</span>
                      <span className="w-6 text-right text-xs tabular-nums text-text-muted">{correct}</span>
                    </div>

                    {/* Slow */}
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-[11px] font-bold text-warning uppercase tracking-wider">Slow</span>
                      <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warning rounded-full transition-all duration-500"
                          style={{ width: total === 0 ? "0%" : `${(slow / total) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums font-bold text-warning">{pct(slow, total)}</span>
                      <span className="w-6 text-right text-xs tabular-nums text-text-muted">{slow}</span>
                    </div>

                    {/* Wrong */}
                    <div className="flex items-center gap-3">
                      <span className="w-16 text-[11px] font-bold text-danger uppercase tracking-wider">Wrong</span>
                      <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-danger rounded-full transition-all duration-500"
                          style={{ width: total === 0 ? "0%" : `${(wrong / total) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums font-bold text-danger">{pct(wrong, total)}</span>
                      <span className="w-6 text-right text-xs tabular-nums text-text-muted">{wrong}</span>
                    </div>
                  </div>

                  {/* Stacked visual bar */}
                  <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
                    {correct > 0 && (
                      <div className="bg-success transition-all duration-500" style={{ width: `${(correct / total) * 100}%` }} />
                    )}
                    {slow > 0 && (
                      <div className="bg-warning transition-all duration-500" style={{ width: `${(slow / total) * 100}%` }} />
                    )}
                    {wrong > 0 && (
                      <div className="bg-danger transition-all duration-500" style={{ width: `${(wrong / total) * 100}%` }} />
                    )}
                  </div>

                  {/* Per-throw-type breakdown */}
                  {throwStats.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">By Throw Type</span>
                      {throwStats.map(({ type, t, c, s, w, af }) => (
                        <div key={type} className="bg-bg-surface border border-border-subtle rounded-lg px-4 py-3 flex flex-col gap-2">
                          {/* Type header */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-accent">{type}</span>
                            <span className="text-[10px] text-text-muted tabular-nums">{t} attempts · avg frame {af}</span>
                          </div>
                          {/* Mini bars */}
                          <div className="flex flex-col gap-1">
                            {[
                              { label: 'OK', count: c, color: 'bg-success', textColor: 'text-success' },
                              { label: 'SLW', count: s, color: 'bg-warning', textColor: 'text-warning' },
                              { label: 'ERR', count: w, color: 'bg-danger', textColor: 'text-danger' },
                            ].map(({ label, count, color, textColor }) => (
                              <div key={label} className="flex items-center gap-2">
                                <span className={`w-8 text-[10px] font-bold uppercase ${textColor}`}>{label}</span>
                                <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${color} rounded-full transition-all duration-500`}
                                    style={{ width: t === 0 ? "0%" : `${(count / t) * 100}%` }}
                                  />
                                </div>
                                <span className={`w-8 text-right text-[10px] tabular-nums font-bold ${textColor}`}>{pct(count, t)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-3 border-t border-drawer-border sticky bottom-0 bg-bg-card">
                <p className="text-[10px] text-text-muted tracking-widest">
                  Stats reset on page reload · Last {sessionHistory.length} sessions saved
                </p>
              </div>
            </div>

            {/* Scroll overlay — mobile only, shown when not yet at the bottom */}
            {!isAtBottom && (
              <div className="md:hidden absolute bottom-[44px] left-0 right-0 flex justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-full bg-bg-elevated/90 border border-accent-border/60 backdrop-blur-sm shadow-lg">
                  <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">scroll</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 text-accent animate-bounce"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            )}
            </div>
          </div>
        );
      })()}

      {/* Session History Modal (past sessions) */}
      {statsOpen && sessionHistory.length > 0 && (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center pointer-events-none">
          <div
            className="
              pointer-events-auto
              w-full md:w-[28rem]
              max-h-[40dvh] md:max-h-[50dvh]
              overflow-y-auto
              bg-bg-card border border-accent-border border-t-0 md:border-t
              md:shadow-2xl flex flex-col
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-drawer-border flex items-center justify-between sticky top-0 bg-bg-card z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent-muted">Past Sessions</span>
              <span className="text-[10px] text-text-muted">Last {sessionHistory.length}</span>
            </div>
            <div className="flex flex-col divide-y divide-border-subtle">
              {sessionHistory.map((s, i) => {
                const d = new Date(s.date);
                const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                const acc = s.attempts === 0 ? 0 : Math.round((s.correct / s.attempts) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                    <div className="flex flex-col w-16 shrink-0">
                      <span className="text-text-secondary font-bold">{dateStr}</span>
                      <span className="text-text-muted text-[10px]">{timeStr}</span>
                    </div>
                    <div className="flex-1 flex gap-2 flex-wrap">
                      <span className="tabular-nums text-text-muted">{s.attempts} attempts</span>
                      <span className="tabular-nums text-success font-bold">{acc}% acc</span>
                      {s.avgFrame !== null && (
                        <span className="tabular-nums text-text-muted">f̄={s.avgFrame}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-black text-accent tabular-nums text-sm leading-none">{s.bestStreak}</span>
                      <span className="text-[9px] text-text-muted uppercase tracking-wider">streak</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Changelog Modal */}
      {changelogOpen && (
        <ChangelogModal onClose={() => setChangelogOpen(false)} />
      )}

      {/* Gear Icon Button - Fixed top right, no layout space */}
      <button
        onClick={() => !isRankingActive && setIsOpen(true)}
        disabled={isRankingActive}
        className={`
          fixed top-3 right-3 z-50
          w-10 h-10 md:w-12 md:h-12
          flex items-center justify-center
          bg-bg-elevated backdrop-blur-sm
          border border-accent-border
          transition-all duration-200
          rounded-lg
          ${isRankingActive
            ? 'opacity-30 cursor-not-allowed'
            : 'hover:border-accent-border-hover hover:bg-accent-subtle text-text-secondary hover:text-accent cursor-pointer'
          }
        `}
        aria-label="Open settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 md:w-6 md:h-6"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-bg-overlay z-[998] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full z-[999]
          w-72 md:w-80
          bg-bg-card
          border-l border-drawer-border
          shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          flex flex-col
          overflow-y-auto
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-drawer-border">
          <h2 className="text-sm md:text-base font-bold uppercase tracking-widest text-accent">
            Settings
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="
              w-8 h-8 flex items-center justify-center
              text-text-muted hover:text-accent
              transition-colors duration-150 cursor-pointer
            "
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 px-5 py-4 space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Theme
            </label>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => props.get().updateTheme(t.value)}
                  className={`
                    flex-1 px-3 py-2.5 text-center font-bold uppercase text-xs md:text-sm tracking-wider
                    transition-all duration-150 cursor-pointer select-none border
                    ${
                      t.value === props.get().theme
                        ? "bg-selected-bg text-selected-text border-selected-border"
                        : "text-unselected-text hover:text-text-secondary border-unselected-border hover:border-accent-border"
                    }
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Player Side */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Player Side
            </label>
            <div className="flex gap-2">
              {[true, false].map((t) => (
                <button
                  key={t ? "p1" : "p2"}
                  onClick={() => props.get().updateIsP1(t)}
                  className={`
                    flex-1 px-4 py-2.5 text-center font-bold uppercase text-xs md:text-sm tracking-wider
                    transition-all duration-150 cursor-pointer select-none border
                    ${
                      t === props.get().isP1
                        ? "bg-selected-bg text-selected-text border-selected-border"
                        : "text-unselected-text hover:text-text-secondary border-unselected-border hover:border-accent-border"
                    }
                  `}
                >
                  {t ? "P1" : "P2"}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Position
            </label>
            <div className="flex gap-2">
              {[true, false].map((t) => (
                <button
                  key={t ? "std" : "gnd"}
                  onClick={() => props.get().updateIsStanding(t)}
                  className={`
                    flex-1 px-4 py-2.5 text-center font-bold uppercase text-xs md:text-sm tracking-wider
                    transition-all duration-150 cursor-pointer select-none border
                    ${
                      t === props.get().isStanding
                        ? "bg-selected-bg text-selected-text border-selected-border"
                        : "text-unselected-text hover:text-text-secondary border-unselected-border hover:border-accent-border"
                    }
                  `}
                >
                  {t ? "STD" : "GND"}
                </button>
              ))}
            </div>
          </div>

          {/* Break Types */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              Break Types
            </label>
            <div className="flex gap-2">
              {Object.entries(props.get().possibles).map(([k, v]) => {
                const activeCount = Object.values(props.get().possibles).filter(Boolean).length;
                const isLastActive = v && activeCount <= 1;
                return (
                  <button
                    key={k}
                    disabled={isLastActive}
                    onClick={() =>
                      props.get().updatePossibles(
                        Object.assign({}, props.get().possibles, {
                          [k]: !v,
                        })
                      )
                    }
                    className={`
                      flex-1 px-3 py-2.5 text-center font-bold text-xs md:text-sm
                      transition-all duration-150 select-none border
                      ${isLastActive ? 'cursor-not-allowed' : 'cursor-pointer'}
                      ${
                        v
                          ? "bg-selected-bg text-text-primary border-selected-border"
                          : "text-text-muted hover:text-text-secondary border-unselected-border opacity-50"
                      }
                    `}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M12 12m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0" />
                <path d="M16.24 7.76l-4.24 4.24" />
              </svg>
              Speed
            </label>
            <div className="flex items-center gap-3">
              <button
                className="
                  w-10 h-10 flex items-center justify-center
                  bg-btn-bg text-btn-text border border-btn-border
                  hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-150 cursor-pointer text-base font-bold
                "
                disabled={props.get().speed <= SPEED_LIMITS.min}
                onClick={() =>
                  props.get().updateSpeed(props.get().speed - SPEED_LIMITS.step)
                }
              >
                -
              </button>
              <span className="flex-1 text-center text-text-primary text-sm md:text-base tabular-nums font-bold">
                {props.get().speed.toFixed(2)}x
              </span>
              <button
                className="
                  w-10 h-10 flex items-center justify-center
                  bg-btn-bg text-btn-text border border-btn-border
                  hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-150 cursor-pointer text-base font-bold
                "
                disabled={props.get().speed >= SPEED_LIMITS.max}
                onClick={() =>
                  props.get().updateSpeed(props.get().speed + SPEED_LIMITS.step)
                }
              >
                +
              </button>
            </div>
          </div>

          {/* Fail Delay */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Fail Delay
            </label>
            <div className="flex items-center gap-3">
              <button
                className="
                  w-10 h-10 flex items-center justify-center
                  bg-btn-bg text-btn-text border border-btn-border
                  hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-150 cursor-pointer text-base font-bold
                "
                disabled={props.get().failDelay <= FAIL_DELAY_LIMITS.min}
                onClick={() =>
                  props.get().updateFailDelay(props.get().failDelay - FAIL_DELAY_LIMITS.step)
                }
              >
                -
              </button>
              <span className="flex-1 text-center text-text-primary text-sm md:text-base tabular-nums font-bold">
                {(props.get().failDelay / 1000).toFixed(2)}s
              </span>
              <button
                className="
                  w-10 h-10 flex items-center justify-center
                  bg-btn-bg text-btn-text border border-btn-border
                  hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-150 cursor-pointer text-base font-bold
                "
                disabled={props.get().failDelay >= FAIL_DELAY_LIMITS.max}
                onClick={() =>
                  props.get().updateFailDelay(props.get().failDelay + FAIL_DELAY_LIMITS.step)
                }
              >
                +
              </button>
            </div>
          </div>

          {/* Sound */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              Sound
            </label>
            <button
              onClick={() => props.get().updateSoundEnabled(!props.get().soundEnabled)}
              className={`
                flex items-center gap-3 w-full px-4 py-2.5
                font-bold uppercase text-xs md:text-sm tracking-wider
                transition-all duration-150 cursor-pointer select-none border
                ${props.get().soundEnabled
                  ? "bg-selected-bg text-selected-text border-selected-border"
                  : "text-unselected-text border-unselected-border opacity-60"
                }
              `}
            >
              <span className={`
                relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 shrink-0
                ${props.get().soundEnabled ? "bg-accent" : "bg-text-muted/30"}
              `}>
                <span className={`
                  absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
                  transition-transform duration-200
                  ${props.get().soundEnabled ? "translate-x-4" : "translate-x-0"}
                `} />
              </span>
              {props.get().soundEnabled ? "On" : "Off"}
            </button>
          </div>

          {/* Edit Inputs - desktop only */}
          <div className="hidden lg:block">
            <button
              onClick={() => {
                props.get().onEditInputs();
                setIsOpen(false);
              }}
              className="
                flex items-center justify-center gap-2
                w-full px-4 py-2.5 font-bold uppercase text-xs md:text-sm tracking-wider
                transition-all duration-150 cursor-pointer select-none border
                text-btn-text border-unselected-border hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h4" />
                <path d="M8 10v4" />
                <circle cx="15" cy="11" r="1" />
                <circle cx="18" cy="13" r="1" />
              </svg>
              Edit Inputs
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* What's New */}
          <div>
            <button
              onClick={() => {
                setChangelogOpen(true);
                setIsOpen(false);
              }}
              className="
                relative flex items-center justify-center gap-2
                w-full px-4 py-2.5 font-bold uppercase text-xs md:text-sm tracking-wider
                transition-all duration-150 cursor-pointer select-none border
                text-btn-text border-unselected-border hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              What's New
              {hasUnseenChangelog() && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-danger" />
              )}
            </button>
          </div>

          {/* Intro */}
          <div>
            <button
              onClick={() => {
                props.get().onIntro();
                setIsOpen(false);
              }}
              className="
                flex items-center justify-center gap-2
                w-full px-4 py-2.5 font-bold uppercase text-xs md:text-sm tracking-wider
                transition-all duration-150 cursor-pointer select-none border
                text-btn-text border-unselected-border hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              Intro
            </button>
          </div>

          {/* Support Me */}
          <div>
            <a
              href="https://ko-fi.com/hyrotsai"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-center gap-2
                w-full px-4 py-3 font-black uppercase text-xs md:text-sm tracking-widest
                transition-all duration-200 cursor-pointer select-none
                bg-accent text-bg-primary border-2 border-accent
                hover:brightness-110 hover:scale-[1.02]
                active:scale-95
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 md:w-5 md:h-5"
              >
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
              </svg>
              Support Me
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
                className="w-4 h-4 md:w-5 md:h-5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Version footer */}
        <div className="px-5 py-3 border-t border-drawer-border">
          <span className="text-[10px] text-text-muted tracking-widest">
            v{VERSION}
          </span>
        </div>
      </div>
    </>
  );
}
