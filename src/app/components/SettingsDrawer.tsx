import { useState } from "react";
import type { Theme } from "./Game";
import { VERSION, SPEED_LIMITS, FAIL_DELAY_LIMITS } from "../config";

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
    theme: Theme;
    updateTheme: (theme: Theme) => void;
    onEditInputs: () => void;
    onIntro: () => void;
  };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Gear Icon Button - Fixed top right, no layout space */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed top-3 right-3 z-50
          w-10 h-10 md:w-12 md:h-12
          flex items-center justify-center
          bg-bg-elevated backdrop-blur-sm
          border border-accent-border
          hover:border-accent-border-hover hover:bg-accent-subtle
          text-text-secondary hover:text-accent
          transition-all duration-200 cursor-pointer
          rounded-lg
        "
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
              {Object.entries(props.get().possibles).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() =>
                    props.get().updatePossibles(
                      Object.assign({}, props.get().possibles, {
                        [k]: !v,
                      })
                    )
                  }
                  className={`
                    flex-1 px-3 py-2.5 text-center font-bold text-xs md:text-sm
                    transition-all duration-150 cursor-pointer select-none border
                    ${
                      v
                        ? "bg-selected-bg text-text-primary border-selected-border"
                        : "text-text-muted hover:text-text-secondary border-unselected-border opacity-50"
                    }
                  `}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
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
            <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
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

          {/* Edit Inputs - desktop only */}
          <div className="hidden lg:block">
            <button
              onClick={() => {
                props.get().onEditInputs();
                setIsOpen(false);
              }}
              className="
                w-full px-4 py-2.5 text-center font-bold uppercase text-xs md:text-sm tracking-wider
                transition-all duration-150 cursor-pointer select-none border
                text-btn-text border-unselected-border hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
              "
            >
              Edit Inputs
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-border-subtle" />

          {/* Intro */}
          <div>
            <button
              onClick={() => {
                props.get().onIntro();
                setIsOpen(false);
              }}
              className="
                w-full px-4 py-2.5 text-center font-bold uppercase text-xs md:text-sm tracking-wider
                transition-all duration-150 cursor-pointer select-none border
                text-btn-text border-unselected-border hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
              "
            >
              Intro
            </button>
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
