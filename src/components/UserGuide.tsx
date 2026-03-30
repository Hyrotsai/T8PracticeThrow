import { REPO_URL } from "../config";

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 bg-white/10 border border-white/25 rounded text-white font-black text-xs tracking-wider">
      {children}
    </kbd>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 text-left">
      <span
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded font-black text-sm text-bg-primary"
        style={{ background: "var(--color-accent)" }}
      >
        {n}
      </span>
      <div>
        <p className="text-white font-black text-sm uppercase tracking-wide leading-tight">{title}</p>
        <p className="text-gray-400 text-xs leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function UserGuide(props: {
  updateUserGuideIsOpen: (userGuideIsOpen: boolean) => void;
}) {
  return (
    <div
      className="w-full flex overflow-y-auto relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/tekken8.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/60" />

      <div className="self-center flex-1 max-h-full px-4 relative z-10">
        <div className="max-w-2xl mx-auto py-8 landscape:py-4 flex flex-col items-center">

          {/* Title */}
          <h1
            className="mb-2 uppercase font-black italic tracking-tighter leading-none text-center"
            style={{
              fontSize: "clamp(2.2rem, 7vw, 4.5rem)",
              transform: "skewX(-8deg)",
              textShadow: "2px 2px 0 rgba(0,0,0,0.8), 4px 4px 8px rgba(0,0,0,0.5)",
            }}
          >
            <span className="text-white">T</span>
            <span
              className="text-accent"
              style={{ textShadow: "0 0 20px var(--t-accent-muted), 2px 2px 0 rgba(0,0,0,0.8)" }}
            >
              8
            </span>
            <span className="text-white"> PRACTICE </span>
            <span
              className="text-accent"
              style={{ textShadow: "0 0 20px var(--t-accent-muted), 2px 2px 0 rgba(0,0,0,0.8)" }}
            >
              THROW
            </span>
          </h1>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-8 text-center">
            Throw break trainer for Tekken 8
          </p>

          {/* How to play */}
          <div className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-accent font-black mb-3">How to play</p>
            <div className="flex flex-col gap-3">
              <Step
                n={1}
                title="Watch the throw"
                desc="A video plays showing a Tekken 8 throw animation. Read the opponent's arm."
              />
              <Step
                n={2}
                title="Press the right button in time"
                desc="Hit 1, 2, or 1+2 within the break window (20 frames after the throw activates)."
              />
              <Step
                n={3}
                title="Read the result"
                desc="Correct = on time and right button. Slow = right button but too late. Wrong = wrong button."
              />
            </div>
          </div>

          {/* Controls */}
          <div className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-accent font-black mb-3">Controls</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Keyboard */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Keyboard</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <KeyBadge>1</KeyBadge>
                    <span className="text-white font-bold">= 1</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <KeyBadge>2</KeyBadge>
                    <span className="text-white font-bold">= 2</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <KeyBadge>3</KeyBadge>
                    <span className="text-white font-bold">= 1+2</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Rebindable from Settings</p>
                </div>
              </div>
              {/* Gamepad */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Gamepad</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <KeyBadge>□/X</KeyBadge>
                    <span className="text-white font-bold">= 1</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <KeyBadge>△/Y</KeyBadge>
                    <span className="text-white font-bold">= 2</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <KeyBadge>□+△</KeyBadge>
                    <span className="text-white font-bold">= 1+2</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Xbox / PS4 / PS5 supported</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-accent font-black mb-2">Global Ranking</p>
            <p className="text-gray-300 text-xs leading-relaxed">
              Choose <span className="text-white font-bold">P1</span>, <span className="text-white font-bold">P2</span> or <span className="text-white font-bold">P1+P2</span> mode and submit your best consecutive streak to the global leaderboard.
              Each mode has its own Top 10. Your score is saved on your <span className="text-white font-bold">first miss</span>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => props.updateUserGuideIsOpen(false)}
              className="px-10 py-3 font-black text-sm uppercase tracking-widest italic bg-accent hover:brightness-110 text-bg-primary transition-all duration-200 cursor-pointer shadow-lg active:scale-95"
              style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
            >
              Start Training
            </button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-3 font-bold text-sm uppercase tracking-wider text-center bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 transition-all duration-200 active:scale-95"
              style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
            >
              Original Repo
            </a>
          </div>

          {/* Credit */}
          <p className="text-gray-600 text-[10px] mt-4 text-center">
            Inspired by{" "}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">
              ThrowBreak420
            </a>{" "}
            by dcep93
          </p>
        </div>
      </div>
    </div>
  );
}
