import { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG, VIDEO_BASE_URL, STORAGE_KEYS, params, MAX_SAVED_SESSIONS, type SessionSummary } from '../config';
import { playCorrect, playSlow, playWrong } from '../utils/soundFeedback';
import { submitScore, DEFAULT_RANKING_CONFIG, type RankingMode } from '../services/rankingService';
import ControllerListener from '../utils/controllerListener';
import { NICK_KEY } from '../components/RankingModal';

export type Theme = 'dark' | 'light' | 'tekken';

export const shortcutToInput: { [k: string]: string } = {
  1: '1',
  2: '2',
  3: '1+2',
  u: '1',
  i: '2',
  o: '1+2',
};

export const videoCache: { [p: string]: string } = {};

// ─── Module-level mutable state (shared across renders via closures) ──────────
export let initialized = false;
export let initialize = () => {};
export let onEnded = () => {};
export let prepVideoExternal = () => {};
export let isTrainingModule = false;
export let speed = 1;
export let nextStreak = 0;
export let answer: string | null = null;
export let videoTimeout: ReturnType<typeof setTimeout>;
export let inputTimeout: ReturnType<typeof setTimeout>;
export let keysPressed: { [k: string]: boolean } = {};
export let controllerCleanup: (() => void) | null = null;
export let rankingMode = false;
// null = use isP1 state normally; true/false = per-round random side override (ranking only)
export let rankingSide: boolean | null = null;
// active ranking mode ('p1' | 'p2' | 'mixed'), set when ranking starts
export let rankingCurrentMode: RankingMode = 'mixed';
export let onKeyDownHelper: (key: string, pressed: boolean) => void = () => null;

// Snapshot of user config saved just before entering ranking mode
let preRankingConfig: {
  isP1: boolean;
  isStanding: boolean;
  possibles: { [k: string]: boolean };
  speed: number;
  failDelay: number;
} | null = null;

// Setters for module vars that need external mutation
export function setInitialized(v: boolean) { initialized = v; }
export function setIsTrainingModule(v: boolean) { isTrainingModule = v; }
export function setAnswer(v: string | null) { answer = v; }
export function setSpeed(v: number) { speed = v; }
export function setNextStreak(v: number) { nextStreak = v; }
export function setRankingMode(v: boolean) { rankingMode = v; }
export function setVideoTimeout(v: ReturnType<typeof setTimeout>) { videoTimeout = v; }
export function setControllerCleanup(v: (() => void) | null) { controllerCleanup = v; }

export enum Correctness {
  right = 'right',
  slow = 'slow',
  wrong = 'wrong',
}

export const correctnessConfig = {
  [Correctness.right]: { emoji: '✅', bg: 'bg-correct', label: 'CORRECT' },
  [Correctness.slow]:  { emoji: '⚠️', bg: 'bg-slow',  label: 'SLOW' },
  [Correctness.wrong]: { emoji: '❌', bg: 'bg-wrong',  label: 'WRONG' },
};

export const historyLog: {
  answer: string;
  button: string;
  frame: number;
  streak: number;
  correctness: Correctness;
}[] = [];

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === 'dark' || stored === 'light' || stored === 'tekken') return stored;
  return 'dark';
}

export function loadSessionHistory(): SessionSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sessionHistory);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCurrentSession() {
  if (historyLog.length === 0) return;
  const throwTypes = ['1', '2', '1+2'];
  const byType: SessionSummary['byType'] = {};
  throwTypes.forEach((t) => {
    const entries = historyLog.filter((o) => o.answer === t);
    if (entries.length === 0) return;
    byType[t] = {
      attempts: entries.length,
      correct: entries.filter((o) => o.correctness === Correctness.right).length,
      slow: entries.filter((o) => o.correctness === Correctness.slow).length,
      wrong: entries.filter((o) => o.correctness === Correctness.wrong).length,
    };
  });
  const validFrames = historyLog.filter((o) => o.correctness !== Correctness.wrong && o.frame > 0);
  const summary: SessionSummary = {
    date: Date.now(),
    attempts: historyLog.length,
    correct: historyLog.filter((o) => o.correctness === Correctness.right).length,
    slow: historyLog.filter((o) => o.correctness === Correctness.slow).length,
    wrong: historyLog.filter((o) => o.correctness === Correctness.wrong).length,
    bestStreak: Math.max(...historyLog.map((o) => o.streak), 0),
    avgFrame: validFrames.length > 0
      ? parseFloat((validFrames.reduce((s, o) => s + o.frame, 0) / validFrames.length).toFixed(1))
      : null,
    byType,
  };
  try {
    const existing = loadSessionHistory();
    const updated = [summary, ...existing].slice(0, MAX_SAVED_SESSIONS);
    localStorage.setItem(STORAGE_KEYS.sessionHistory, JSON.stringify(updated));
  } catch { /* ignore quota errors */ }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseGameProps {
  mainRef: React.RefObject<HTMLVideoElement | null>;
  backupRef: React.RefObject<HTMLVideoElement | null>;
  onStartTraining: () => void;
  isTraining: boolean;
}

export function useGame({ mainRef, backupRef, onStartTraining, isTraining }: UseGameProps) {
  const [_shortcutToSet, _updateShortcutToSet] = useState('');
  const updateShortcutToSet = (v: string) => {
    shortcutToInput[3] = shortcutToInput[3]; // keep ref
    // reassign module var via direct mutation — shortcutToSet is used in closure
    (shortcutToSetRef as { current: string }).current = v;
    _updateShortcutToSet(v);
  };
  // Use a ref so closures always see latest value
  const shortcutToSetRef = useRef('');
  shortcutToSetRef.current = _shortcutToSet;

  const [isP1, updateIsP1Raw] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.isP1);
    return stored !== null ? stored === 'true' : true;
  });
  const updateIsP1 = (v: boolean) => {
    localStorage.setItem(STORAGE_KEYS.isP1, String(v));
    updateIsP1Raw(v);
  };

  const [isStanding, updateIsStandingRaw] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.isStanding);
    return stored !== null ? stored === 'true' : true;
  });
  const updateIsStanding = (v: boolean) => {
    localStorage.setItem(STORAGE_KEYS.isStanding, String(v));
    updateIsStandingRaw(v);
  };

  const [possibles, updatePossiblesRaw] = useState<{ [k: string]: boolean }>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.possibles);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { '1': true, '2': true, '1+2': true };
  });
  const updatePossibles = (v: { [k: string]: boolean }) => {
    localStorage.setItem(STORAGE_KEYS.possibles, JSON.stringify(v));
    updatePossiblesRaw(v);
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, _updateSpeed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.speed);
    const v = stored !== null ? parseFloat(stored) : 1;
    speed = v;
    return v;
  });
  const updateSpeed = (newSpeed: number) => {
    const video = mainRef.current;
    if (!video) return;
    newSpeed = parseFloat(newSpeed.toFixed(2));
    video.playbackRate = newSpeed;
    speed = newSpeed;
    localStorage.setItem(STORAGE_KEYS.speed, String(newSpeed));
    _updateSpeed(newSpeed);
  };
  const [streak, updateStreak] = useState(0);
  const [highestStreak, updateHighestStreak] = useState(
    parseInt(localStorage.getItem(STORAGE_KEYS.streak) || '0'),
  );
  const [lastAnswer, updateLastAnswer] = useState('');
  const [lastInput, updateLastInput] = useState('');
  const [lastFrame, updateLastFrame] = useState(0);
  const [isLoading, updateIsLoading] = useState(false);
  const [userGuideIsOpen, _updateUserGuideIsOpen] = useState(
    localStorage.getItem(STORAGE_KEYS.hasStarted) !== 'true',
  );
  const updateUserGuideIsOpen = (_open: boolean) => {
    localStorage.setItem(STORAGE_KEYS.hasStarted, _open ? 'false' : 'true');
    _updateUserGuideIsOpen(_open);
    if (initialized) window.location.reload();
  };
  const [correctnessState, updateCorrectnessState] = useState<Correctness | undefined>(undefined);
  const [failDelay, updateFailDelayRaw] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.failDelay);
    return stored !== null ? parseInt(stored) : GAME_CONFIG.incorrectSleepMs;
  });
  const updateFailDelay = (v: number) => {
    localStorage.setItem(STORAGE_KEYS.failDelay, String(v));
    updateFailDelayRaw(v);
  };
  const [soundEnabled, _updateSoundEnabled] = useState(
    localStorage.getItem(STORAGE_KEYS.soundEnabled) !== 'false',
  );
  const updateSoundEnabled = (v: boolean) => {
    _updateSoundEnabled(v);
    localStorage.setItem(STORAGE_KEYS.soundEnabled, v.toString());
  };
  const [theme, _updateTheme] = useState<Theme>(getInitialTheme);
  const updateTheme = (t: Theme) => {
    _updateTheme(t);
    applyTheme(t);
  };
  type SyncState = 'idle' | 'syncing' | 'saved' | 'updated' | 'ignored' | 'error';
  const [syncState, updateSyncState] = useState<SyncState>('idle');
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [countdown, updateCountdown] = useState<3 | 2 | 1 | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownValueRef = useRef<3 | 2 | 1 | null>(null);
  countdownValueRef.current = countdown;
  const [isRankingActive, setIsRankingActive] = useState(false);
  const onSyncCompleteRef = useRef<() => void>(() => {});
  const userGuideIsOpenRef = useRef(false);
  userGuideIsOpenRef.current = userGuideIsOpen;

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPath = (choice: string, sideOverride?: boolean) => {
    const side = sideOverride !== undefined ? sideOverride : (rankingSide !== null ? rankingSide : isP1);
    return `${VIDEO_BASE_URL}/${side ? 'p1' : 'p2'}/${isStanding ? 'standing' : 'grounded'}/${choice.replace('+', '')}.mp4`;
  };

  const prepVideo = () => {
    if (!initialized) return;
    clearTimeout(videoTimeout);
    const choices = Object.entries(possibles)
      .map(([k, v]) => ({ k, v }))
      .filter(({ v }) => v)
      .map(({ k }) => k);

    // In mixed ranking mode, pre-cache both P1 and P2 paths so no loading mid-run.
    // For p1/p2 modes, only cache the fixed side.
    const pathsToCache = (rankingMode && rankingCurrentMode === 'mixed')
      ? [true, false].flatMap((side) => choices.map((c) => getPath(c, side)))
      : choices.map((c) => getPath(c));

    const missing = pathsToCache.filter((p) => videoCache[p] === undefined);
    if (missing.length > 0) {
      updateIsLoading(true);
      Promise.all(
        missing.map((p) =>
          fetch(p, { cache: 'force-cache' })
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status} for ${p}`);
              return r.blob();
            })
            .then((blob) => window.URL.createObjectURL(blob))
            .then((src) => (videoCache[p] = src)),
        ),
      )
        .then(() => updateIsLoading(false))
        .then(() => prepVideo())
        .catch((err) => {
          console.error('Failed to load video:', err);
          updateIsLoading(false);
          videoTimeout = setTimeout(() => prepVideo(), 3000);
        });
      return;
    }

    // Only randomize side in mixed mode; p1/p2 modes use the fixed isP1 value
    if (rankingMode && rankingCurrentMode === 'mixed') {
      rankingSide = Math.random() < 0.5;
    }

    const nextChoice = choices[Math.floor(Math.random() * choices.length)];
    if (nextChoice === undefined) return;
    updateStreak(nextStreak);
    answer = nextChoice;
    backupRef.current!.src = videoCache[getPath(nextChoice)];
  };

  prepVideoExternal = prepVideo;

  initialize = () => {
    initialized = true;
    prepVideo();
    if (controllerCleanup) controllerCleanup();
    // Gamepad inputs ('1', '2', '1+2') go straight to handleInput —
    // no shortcut lookup, no set-button flow, no keysPressed debounce needed.
    controllerCleanup = ControllerListener((input, pressed) => {
      if (!pressed) return;
      if (countdownValueRef.current !== null) return;
      if (userGuideIsOpenRef.current) return;
      if (!isTrainingModule) return;
      handleInput(input);
    });
  };

  useEffect(() => {
    nextStreak = 0;
    prepVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isP1, isStanding, possibles]);

  const handleInput = (button: string) => {
    const video = mainRef.current;
    if (!video) return;
    if (!isTrainingModule) return;
    if (answer === null) return;
    const rawFrame = Math.ceil(video.currentTime * GAME_CONFIG.framesPerSecond);
    const frame = rawFrame - GAME_CONFIG.frameStart;
    if (frame < 0) return;
    video.pause();
    const incorrect = frame > GAME_CONFIG.breakWindow || button !== answer;
    const correctness = !incorrect
      ? Correctness.right
      : button === answer
        ? Correctness.slow
        : Correctness.wrong;
    updateCorrectnessState(correctness);
    if (soundEnabled) {
      if (correctness === Correctness.right) playCorrect();
      else if (correctness === Correctness.slow) playSlow();
      else playWrong();
    }
    nextStreak = incorrect ? 0 : streak + 1;
    if (!incorrect) {
      updateStreak(nextStreak);
      if (nextStreak > highestStreak) {
        updateHighestStreak(nextStreak);
        localStorage.setItem(STORAGE_KEYS.streak, nextStreak.toString());
      }
    }

    // --- Ranking sync on first fail ---
    if (incorrect && rankingMode) {
      rankingMode = false;
      setIsRankingActive(false);
      const savedAnswer = answer;
      answer = null;
      historyLog.push({ answer: savedAnswer ?? '', button, frame, streak: nextStreak, correctness });
      updateLastAnswer(savedAnswer ?? '');
      updateLastInput(button);
      updateLastFrame(frame);
      const nick = localStorage.getItem(NICK_KEY);
      const isDefaultConfig =
        speed === DEFAULT_RANKING_CONFIG.speed &&
        GAME_CONFIG.breakWindow === DEFAULT_RANKING_CONFIG.breakWindow &&
        GAME_CONFIG.frameStart === DEFAULT_RANKING_CONFIG.frameStart;
      if (nick && isDefaultConfig) {
        updateSyncState('syncing');
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        submitScore(nick, streak, rankingCurrentMode)
          .then((result) => {
            updateSyncState(result === 'updated' ? 'updated' : result === 'ignored' ? 'ignored' : 'saved');
            onSyncCompleteRef.current();
          })
          .catch(() => {
            updateSyncState('error');
          });
      } else {
        updateSyncState('ignored');
        onSyncCompleteRef.current();
      }
      return;
    }

    historyLog.push({ answer, button, frame, streak: nextStreak, correctness });
    updateLastAnswer(answer);
    updateLastInput(button);
    updateLastFrame(frame);
    answer = null;
    videoTimeout = setTimeout(
      () => {
        updateCorrectnessState(undefined);
        prepVideo();
      },
      incorrect ? failDelay : GAME_CONFIG.correctSleepMs,
    );
  };

  onEnded = () => handleInput('-');

  onKeyDownHelper = (key: string, pressed: boolean) => {
    if (!pressed) return;
    clearTimeout(inputTimeout);
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
    if (countdown !== null) return;
    if (params.has('debug')) {
      alert(JSON.stringify({ debug: 193, key }));
    }
    if (userGuideIsOpen) return;
    const currentShortcutToSet = shortcutToSetRef.current;
    if (currentShortcutToSet !== '') {
      shortcutToInput[key] = currentShortcutToSet;
      updateShortcutToSet(
        { '1': '2', '2': '1+2', '1+2': '' }[currentShortcutToSet]!,
      );
      return;
    }
    const btn = shortcutToInput[key];
    if (btn === undefined) {
      initialized = false;
      updateShortcutToSet('1');
      return;
    }
    keysPressed[btn] = true;
    inputTimeout = setTimeout(
      () => {
        const allButtons =
          Object.keys(keysPressed).length === 1 ? btn : shortcutToInput[3];
        keysPressed = {};
        handleInput(allButtons);
      },
      1000 / GAME_CONFIG.framesPerSecond / 2,
    );
  };

  const startRanking = (nick: string, mode: RankingMode = 'mixed') => {
    localStorage.setItem(NICK_KEY, nick);
    historyLog.length = 0;
    nextStreak = 0;
    updateStreak(0);
    updateLastAnswer('');
    updateLastInput('');
    updateLastFrame(0);
    updateCorrectnessState(undefined);
    updateSyncState('idle');
    // Save user config snapshot before overwriting with ranking defaults
    preRankingConfig = {
      isP1,
      isStanding,
      possibles: { ...possibles },
      speed,
      failDelay,
    };
    // Reset to default config — ranking must always use the same settings
    // For P1 mode: fix to P1. For P2 mode: fix to P2. For mixed: random per throw.
    if (mode === 'p1') {
      updateIsP1(true);
    } else if (mode === 'p2') {
      updateIsP1(false);
    } else {
      // mixed — isP1 value doesn't matter, rankingSide will override per round
      updateIsP1(true);
    }
    updateIsStanding(true);
    updatePossibles({ '1': true, '2': true, '1+2': true });
    // updateSpeed needs mainRef; force the module var and localStorage directly as well
    const defaultSpeed = DEFAULT_RANKING_CONFIG.speed;
    speed = defaultSpeed;
    localStorage.setItem(STORAGE_KEYS.speed, String(defaultSpeed));
    _updateSpeed(defaultSpeed);
    if (mainRef.current) mainRef.current.playbackRate = defaultSpeed;
    updateFailDelay(GAME_CONFIG.incorrectSleepMs);  // 2000
    setIsRankingActive(true);
    rankingSide = null;
    rankingCurrentMode = mode;
    updateCountdown(3);
    let count: 3 | 2 | 1 = 3;
    const tick = () => {
      count = (count - 1) as 3 | 2 | 1;
      if (count > 0) {
        updateCountdown(count as 3 | 2 | 1);
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        updateCountdown(null);
        rankingMode = true;
        onStartTraining();
      }
    };
    countdownRef.current = setTimeout(tick, 1000);
  };

  const resetStats = () => {
    historyLog.length = 0;
    nextStreak = 0;
    updateStreak(0);
    updateHighestStreak(0);
    localStorage.setItem(STORAGE_KEYS.streak, '0');
    updateLastAnswer('');
    updateLastInput('');
    updateLastFrame(0);
    updateCorrectnessState(undefined);
  };

  const backToTraining = () => {
    // Restore user config that was active before ranking
    if (preRankingConfig) {
      updateIsP1(preRankingConfig.isP1);
      updateIsStanding(preRankingConfig.isStanding);
      updatePossibles(preRankingConfig.possibles);
      // Restore speed: set module var + localStorage + video element
      const s = preRankingConfig.speed;
      speed = s;
      localStorage.setItem(STORAGE_KEYS.speed, String(s));
      _updateSpeed(s);
      if (mainRef.current) mainRef.current.playbackRate = s;
      updateFailDelay(preRankingConfig.failDelay);
      preRankingConfig = null;
    }
    // Clean up game state
    rankingSide = null;
    updateCorrectnessState(undefined);
    updateLastAnswer('');
    updateLastInput('');
    updateLastFrame(0);
    updateSyncState('idle');
    // Prepare next video so training is ready to go
    prepVideo();
  };

  const bgClass = correctnessState ? correctnessConfig[correctnessState].bg : '';

  return {
    // State
    _shortcutToSet,
    isP1,
    isStanding,
    possibles,
    streak,
    highestStreak,
    lastAnswer,
    lastInput,
    lastFrame,
    isLoading,
    userGuideIsOpen,
    correctnessState,
    failDelay,
    soundEnabled,
    theme,
    syncState,
    countdown,
    isRankingActive,
    bgClass,
    // Updaters
    updateIsP1,
    updateIsStanding,
    updatePossibles,
    updateSpeed,
    updateFailDelay,
    updateSoundEnabled,
    updateTheme,
    updateUserGuideIsOpen,
    updateSyncState,
    // Actions
    handleInput,
    startRanking,
    backToTraining,
    resetStats,
    prepVideo,
    updateShortcutToSet,
    onSyncCompleteRef,
    // Refs
    mainRef,
  };
}
