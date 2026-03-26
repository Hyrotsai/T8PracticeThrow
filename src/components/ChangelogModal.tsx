import { useRef, useCallback, useState, useEffect } from "react";
import changelogs from "../changelogs.json";
import { VERSION, STORAGE_KEYS } from "../config";

type EntryType = "new" | "improved" | "fix";

interface ChangelogEntry {
  type: EntryType;
  text: string;
}

interface ChangelogVersion {
  version: string;
  date: string;
  entries: ChangelogEntry[];
}

const LOGS = changelogs as ChangelogVersion[];

const TYPE_CONFIG: Record<EntryType, { label: string; color: string; bg: string }> = {
  new:      { label: "NEW",      color: "text-success",  bg: "bg-success/10 border-success/30" },
  improved: { label: "IMPROVED", color: "text-accent",   bg: "bg-accent/10 border-accent/30" },
  fix:      { label: "FIX",      color: "text-warning",  bg: "bg-warning/10 border-warning/30" },
};

export default function ChangelogModal({ onClose }: { onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    // Mark this version as seen
    localStorage.setItem(STORAGE_KEYS.lastSeenVersion, VERSION);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[1002] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg-overlay backdrop-blur-sm" />

      {/* Modal wrapper — relative for scroll overlay positioning */}
      <div className="relative z-10 w-80 md:w-[26rem]">

        {/* Modal */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full max-h-[88dvh] bg-bg-card border border-accent-border shadow-2xl flex flex-col overflow-y-auto"
          style={{ clipPath: "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-drawer-border sticky top-0 bg-bg-card z-10">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h2 className="text-sm font-black uppercase tracking-widest text-accent">
                What's New
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-accent transition-colors cursor-pointer"
              aria-label="Close changelog"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Versions */}
          <div className="flex flex-col divide-y divide-border-subtle">
            {LOGS.map((log, idx) => (
              <div key={log.version} className="px-6 py-5 flex flex-col gap-3">
                {/* Version header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black tabular-nums text-text-primary">
                      v{log.version}
                    </span>
                    {idx === 0 && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-accent text-bg-primary rounded-sm">
                        LATEST
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted tracking-wider ml-auto">
                    {new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Entries */}
                <div className="flex flex-col gap-2">
                  {log.entries.map((entry, i) => {
                    const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.new;
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border rounded-sm mt-0.5 ${cfg.color} ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-text-secondary leading-relaxed">
                          {entry.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-drawer-border sticky bottom-0 bg-bg-card">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-xs font-black uppercase tracking-widest text-bg-primary bg-accent hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer"
              style={{ clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}
            >
              Got it
            </button>
          </div>
        </div>

        {/* Scroll overlay — mobile only */}
        {!isAtBottom && (
          <div className="md:hidden absolute bottom-[44px] left-0 right-0 flex justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-full bg-bg-elevated/90 border border-accent-border/60 backdrop-blur-sm shadow-lg">
              <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">scroll</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-accent animate-bounce">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Returns true if the current VERSION has not been seen yet by this browser */
export function hasUnseenChangelog(): boolean {
  return localStorage.getItem(STORAGE_KEYS.lastSeenVersion) !== VERSION;
}
