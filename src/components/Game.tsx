import { ReactNode, useEffect, useRef, useState } from 'react';

import Buttons from './Buttons';
import Center from './Center';
import SettingsDrawer from './SettingsDrawer';
import UserGuide from './UserGuide';
import Video from './Video';
import firebase from '../services/firebase';
import { STORAGE_KEYS } from '../config';
import {
  useGame,
  applyTheme,
  getInitialTheme,
  correctnessConfig,
  historyLog,
  Correctness,
  initialized,
  prepVideoExternal,
  onEnded,
  initialize,
  speed,
  answer,
  videoTimeout,
  inputTimeout,
  setIsTrainingModule,
  setAnswer,
  setInitialized,
  onKeyDownHelper,
  saveCurrentSession,
  rankingCurrentMode,
} from '../hooks/useGame';
import type { Theme } from '../hooks/useGame';

export type { Theme };
export { Correctness, correctnessConfig, historyLog, applyTheme, getInitialTheme };

import { GAME_CONFIG } from '../config';

// ─── Frame Indicator ─────────────────────────────────────────────────────────

function FrameIndicator({
  mainRef,
  isTraining,
  correctnessState,
}: {
  mainRef: React.RefObject<HTMLVideoElement | null>;
  isTraining: boolean;
  correctnessState: string | undefined;
}) {
  const [frame, setFrame] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isTraining) {
      setFrame(null);
      return;
    }
    const tick = () => {
      const video = mainRef.current;
      if (video && !video.paused) {
        const raw = Math.ceil(video.currentTime * GAME_CONFIG.framesPerSecond);
        setFrame(raw - GAME_CONFIG.frameStart);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isTraining, mainRef]);

  if (!isTraining || frame === null) return null;

  const windowStart = 0;
  const windowEnd = GAME_CONFIG.breakWindow;
  // Clamp for display: show from -10 to breakWindow+10
  const displayMin = -10;
  const displayMax = windowEnd + 10;
  const clampedFrame = Math.max(displayMin, Math.min(displayMax, frame));
  const pct = ((clampedFrame - displayMin) / (displayMax - displayMin)) * 100;

  const isInWindow = frame >= windowStart && frame <= windowEnd;
  const isPast = frame > windowEnd;
  const isTooEarly = frame < windowStart;

  return (
    <div className='absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 w-48 md:w-64 pointer-events-none select-none'>
      {/* Frame counter */}
      <div className={`text-xs font-black tabular-nums uppercase tracking-widest px-2 py-0.5 rounded ${
        correctnessState ? 'opacity-0' :
        isInWindow ? 'text-success' :
        isPast ? 'text-danger' :
        'text-text-muted'
      }`}>
        {isTooEarly ? `${frame}` : isInWindow ? `f ${frame}` : `f ${frame}`}
      </div>
      {/* Progress bar */}
      <div className='w-full h-2 bg-bg-surface/80 rounded-full overflow-hidden border border-border-subtle/50'>
        {/* Window zone highlight */}
        <div
          className='absolute h-full bg-success/20 rounded-none'
          style={{
            left: `${((windowStart - displayMin) / (displayMax - displayMin)) * 100}%`,
            width: `${((windowEnd - windowStart) / (displayMax - displayMin)) * 100}%`,
          }}
        />
        {/* Current frame needle */}
        <div
          className={`h-full w-1 rounded-full transition-none ${
            isInWindow ? 'bg-success' : isPast ? 'bg-danger' : 'bg-text-muted'
          }`}
          style={{ marginLeft: `calc(${pct}% - 2px)` }}
        />
      </div>
      {/* Labels */}
      <div className='w-full flex justify-between text-[9px] text-text-muted/60 font-bold uppercase tracking-wider px-0.5'>
        <span>EARLY</span>
        <span>WINDOW</span>
        <span>LATE</span>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HelperProps {
  children: ReactNode;
  mainRef: React.RefObject<HTMLVideoElement | null>;
  backupRef: React.RefObject<HTMLVideoElement | null>;
  onStartTraining: () => void;
  onStopTraining: () => void;
  isTraining: boolean;
}

// ─── Helper UI component (thin shell around useGame) ─────────────────────────

function Helper({ children, mainRef, backupRef, onStartTraining, onStopTraining, isTraining }: HelperProps) {
  const game = useGame({ mainRef, backupRef, onStartTraining, isTraining });

  const {
    _shortcutToSet,
    isP1, isStanding, possibles,
    streak, highestStreak, lastAnswer, lastInput, lastFrame,
    isLoading, userGuideIsOpen, correctnessState,
    failDelay, soundEnabled, theme,
    syncState, countdown, isRankingActive,
    bgClass,
    updateIsP1, updateIsStanding, updatePossibles,
    updateSpeed, updateFailDelay, updateSoundEnabled, updateTheme,
    updateUserGuideIsOpen, updateSyncState,
    handleInput, startRanking, backToTraining, resetStats,
    prepVideo,
    updateShortcutToSet,
    onSyncCompleteRef,
  } = game;

  return (
    <div
      tabIndex={0}
      ref={(c) => {
        if (!c) return;
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        c.focus();
      }}
      onKeyDown={(e) => {
        if (['Alt', 'Control', 'Meta', 'Shift'].includes(e.key)) return;
        onKeyDownHelper(e.key, true);
      }}
      className='font-mono text-text-primary bg-bg-primary h-dvh w-dvw flex outline-none overflow-hidden'
    >
      {userGuideIsOpen ? (
        <UserGuide updateUserGuideIsOpen={updateUserGuideIsOpen} />
      ) : _shortcutToSet !== '' ? (
        <div className='flex items-center justify-center w-full'>
          <div
            className='text-2xl md:text-4xl font-black uppercase italic tracking-wider animate-pulse text-text-primary'
            style={{ transform: 'skewX(-8deg)' }}
          >
            <span>SET BUTTON </span>
            <span className='text-accent'>{_shortcutToSet}</span>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col transition-colors duration-300 ${bgClass}`}>
          <SettingsDrawer
            get={() => ({
              isP1,
              updateIsP1,
              isStanding,
              updateIsStanding,
              possibles,
              updatePossibles,
              speed,
              updateSpeed,
              failDelay,
              updateFailDelay,
              soundEnabled,
              updateSoundEnabled,
              theme,
              updateTheme,
              onEditInputs: () => {
                setInitialized(false);
                updateShortcutToSet('1');
              },
              onIntro: () => updateUserGuideIsOpen(true),
              onStartRanking: startRanking,
              isRankingActive,
              onSyncComplete: (cb: () => void) => {
                onSyncCompleteRef.current = cb;
              },
              onStatsOpen: () => {
                clearTimeout(videoTimeout);
                clearTimeout(inputTimeout);
                mainRef.current?.pause();
              },
              onStatsClose: () => {
                // Reset correctness and start a new video
                prepVideo();
                setAnswer(null);
              },
            })}
          />
          <div className='flex-1 min-h-0 relative'>
            {isLoading ? (
              <div className='absolute inset-0 flex items-center justify-center z-10'>
                <div className='flex flex-col items-center gap-3'>
                  <div className='w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin' />
                  <span className='text-text-muted text-sm uppercase tracking-widest font-bold'>Loading...</span>
                </div>
              </div>
            ) : null}
            {!isTraining && !isLoading ? (
              <div className='absolute inset-0 flex items-center justify-center z-20 bg-bg-primary/80 backdrop-blur-sm'>
                <button
                  onClick={() => { resetStats(); onStartTraining(); }}
                  className='px-10 py-5 text-xl sm:text-2xl font-black uppercase tracking-widest italic bg-accent text-bg-primary border-2 border-accent hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer select-none shadow-lg shadow-accent/30'
                  style={{ clipPath: 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)' }}
                >
                  START TRAINING
                </button>
              </div>
            ) : null}
            {syncState !== 'idle' ? (
              <div className='absolute inset-0 z-40 flex items-center justify-center bg-bg-primary/95 backdrop-blur-sm'>
                <div className='flex flex-col items-center gap-6 px-8 text-center'>
                  {syncState === 'syncing' ? (
                    <>
                      <div className='w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin' />
                      <div className='flex flex-col gap-1'>
                        <p className='text-lg font-black uppercase tracking-widest text-text-primary'>Syncing...</p>
                        <p className='text-sm text-text-muted'>Saving your score to the global ranking</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {syncState === 'error' ? (
                        <div className='w-14 h-14 flex items-center justify-center rounded-full border-2 border-danger'>
                          <span className='text-danger font-black text-2xl'>✕</span>
                        </div>
                      ) : (
                        <div className='w-14 h-14 flex items-center justify-center rounded-full border-2 border-success'>
                          <span className='text-success font-black text-2xl'>✓</span>
                        </div>
                      )}
                      <div className='flex flex-col gap-1'>
                        {syncState === 'saved' && (
                          <><p className='text-lg font-black uppercase tracking-widest text-success'>Saved!</p><p className='text-sm text-text-muted'>Your score was saved to the global ranking</p></>
                        )}
                        {syncState === 'updated' && (
                          <><p className='text-lg font-black uppercase tracking-widest text-success'>New Record!</p><p className='text-sm text-text-muted'>Your best streak was updated</p></>
                        )}
                        {syncState === 'ignored' && (
                          <><p className='text-lg font-black uppercase tracking-widest text-text-primary'>Not Updated</p><p className='text-sm text-text-muted'>Your previous score was higher</p></>
                        )}
                        {syncState === 'error' && (
                          <><p className='text-lg font-black uppercase tracking-widest text-danger'>Sync Failed</p><p className='text-sm text-text-muted'>Could not connect to the ranking server</p></>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          updateSyncState('idle');
                          const nick = localStorage.getItem(STORAGE_KEYS.rankingNick) ?? '';
                          startRanking(nick, rankingCurrentMode);
                        }}
                        className='px-8 py-3 text-sm font-black uppercase tracking-widest italic bg-accent text-bg-primary border-2 border-accent hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer select-none shadow-lg shadow-accent/30'
                        style={{ clipPath: 'polygon(6% 0, 100% 0, 94% 100%, 0 100%)' }}
                      >
                        Try Again as {localStorage.getItem(STORAGE_KEYS.rankingNick) ?? '...'}
                      </button>
                      <button
                        onClick={() => backToTraining()}
                        className='text-xs text-text-muted hover:text-text-secondary underline underline-offset-2 cursor-pointer transition-colors'
                      >
                        Back to training
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}
            {countdown !== null ? (
              <div className='absolute inset-0 z-50 flex items-center justify-center bg-bg-primary/90 backdrop-blur-sm pointer-events-auto'>
                <div
                  key={countdown}
                  className='text-[12rem] font-black tabular-nums text-accent leading-none select-none'
                  style={{ animation: 'countdown-pop 0.9s ease-out forwards', transform: 'skewX(-6deg)', textShadow: '0 0 60px var(--color-accent)' }}
                >
                  {countdown}
                </div>
              </div>
            ) : null}
            <Center
              get={() => ({
                isLoading,
                lastAnswer,
                lastInput,
                lastFrame,
                streak,
                highestStreak,
                correctnessState,
                isRankingActive,
              })}
            >
              {children}
            </Center>
            <FrameIndicator
              mainRef={mainRef}
              isTraining={isTraining}
              correctnessState={correctnessState}
            />
          </div>
          <Buttons
            get={() => ({
              possibles,
              handleInput,
              isTraining,
              onStopTraining,
            })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function ThrowBreak() {
  firebase();
  const mainRef = useRef<HTMLVideoElement>(null);
  const backupRef = useRef<HTMLVideoElement>(null);
  const [isTraining, setIsTraining] = useState(false);

  const startTraining = () => {
    setIsTrainingModule(true);
    setIsTraining(true);
    if (initialized) prepVideoExternal();
  };

  const stopTraining = () => {
    saveCurrentSession();
    setIsTrainingModule(false);
    mainRef.current?.pause();
    clearTimeout(videoTimeout);
    clearTimeout(inputTimeout);
    setAnswer(null);
    setIsTraining(false);
  };

  return (
    <Helper
      mainRef={mainRef}
      backupRef={backupRef}
      isTraining={isTraining}
      onStartTraining={startTraining}
      onStopTraining={stopTraining}
    >
      <Video
        get={() => ({
          mainRef,
          backupRef,
          onEnded,
          initialized,
          initialize,
          speed,
          isTraining,
        })}
      />
    </Helper>
  );
}
