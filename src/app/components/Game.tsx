import { ReactNode, createRef, useEffect, useState } from 'react';

import Buttons from './Buttons';
import Center from './Center';
import ControllerListener from './ControllerListener';
import SettingsDrawer from './SettingsDrawer';
import UserGuide from './UserGuide';
import Video from './Video';
import firebase from './firebase';
import { GAME_CONFIG, VIDEO_BASE_URL, STORAGE_KEYS, params } from '../config';

export type Theme = 'dark' | 'light' | 'tekken';

const shortcutToInput: { [k: string]: string } = {
  1: '1',
  2: '2',
  3: '1+2',
  u: '1',
  i: '2',
  o: '1+2',
};
var shortcutToSet = '';

const videoCache: { [p: string]: string } = {};

var initialized = false;
var initialize = () => {};
var onEnded = () => {};
var speed = 1;
var nextStreak = 0;
var answer: string | null = null;
var videoTimeout: ReturnType<typeof setTimeout>;
var inputTimeout: ReturnType<typeof setTimeout>;
var keysPressed: { [k: string]: boolean } = {};

var onKeyDownHelper: (key: string, pressed: boolean) => void = () => null;

enum Correctness {
  right = 'right',
  slow = 'slow',
  wrong = 'wrong',
}

const correctnessConfig = {
  [Correctness.right]: {
    emoji: '✅',
    bg: 'bg-correct',
    label: 'CORRECT',
  },
  [Correctness.slow]: {
    emoji: '⚠️',
    bg: 'bg-slow',
    label: 'SLOW',
  },
  [Correctness.wrong]: {
    emoji: '❌',
    bg: 'bg-wrong',
    label: 'WRONG',
  },
};

export const historyLog: {
  answer: string;
  button: string;
  frame: number;
  streak: number;
  correctness: Correctness;
}[] = [];

export { Correctness, correctnessConfig };

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === 'dark' || stored === 'light' || stored === 'tekken')
    return stored;
  return 'dark';
}

export default function ThrowBreak() {
  firebase();
  const mainRef = createRef<HTMLVideoElement>();
  const backupRef = createRef<HTMLVideoElement>();

  function Helper(props: { children: ReactNode }) {
    const [_shortcutToSet, _updateShortcutToSet] = useState('');
    const updateShortcutToSet = (v: string) => {
      shortcutToSet = v;
      _updateShortcutToSet(v);
    };
    const [isP1, updateIsP1] = useState(true);
    const [isStanding, updateIsStanding] = useState(true);
    const [possibles, updatePossibles] = useState<{ [k: string]: boolean }>({
      '1': true,
      '2': true,
      '1+2': true,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, _updateSpeed] = useState(1);
    const updateSpeed = (newSpeed: number) => {
      const video = mainRef.current;
      if (!video) return;
      newSpeed = parseFloat(newSpeed.toFixed(2));
      video.playbackRate = newSpeed;
      speed = newSpeed;
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
    const updateUserGuideIsOpen = (_userGuideIsOpen: boolean) => {
      if (_userGuideIsOpen) {
        localStorage.setItem(STORAGE_KEYS.hasStarted, 'false');
      } else {
        localStorage.setItem(STORAGE_KEYS.hasStarted, 'true');
      }
      _updateUserGuideIsOpen(_userGuideIsOpen);
      if (initialized) {
        // @ts-ignore
        window.location.reload(true);
      }
    };
    const [correctnessState, updateCorrectnessState] = useState<
      Correctness | undefined
    >(undefined);
    const [failDelay, updateFailDelay] = useState(GAME_CONFIG.incorrectSleepMs);
    const [theme, _updateTheme] = useState<Theme>(getInitialTheme);
    const updateTheme = (t: Theme) => {
      _updateTheme(t);
      applyTheme(t);
    };

    // Apply theme on mount
    useEffect(() => {
      applyTheme(theme);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getPath = (choice: string) =>
      `${VIDEO_BASE_URL}/${
        isP1 ? 'p1' : 'p2'
      }/${isStanding ? 'standing' : 'grounded'}/${choice.replace('+', '')}.mp4`;

    const prepVideo = () => {
      if (!initialized) return;
      clearTimeout(videoTimeout);
      const choices = Object.entries(possibles)
        .map(([k, v]) => ({ k, v }))
        .filter(({ v }) => v)
        .map(({ k }) => k);
      const missing = choices
        .map((choice) => getPath(choice))
        .filter((p) => videoCache[p] === undefined);
      if (missing.length > 0) {
        updateIsLoading(true);
        Promise.all(
          missing.map((p) =>
            fetch(p, { cache: 'force-cache' })
              .then((r) => r.blob())
              .then((blob) => window.URL.createObjectURL(blob))
              .then((src) => (videoCache[p] = src)),
          ),
        )
          .then(() => updateIsLoading(false))
          .then(() => prepVideo());
        return;
      }
      const nextChoice = choices[Math.floor(Math.random() * choices.length)];
      if (nextChoice === undefined) {
        return;
      }
      updateStreak(nextStreak);
      answer = nextChoice;
      backupRef.current!.src = videoCache[getPath(nextChoice)];
    };

    initialize = () => {
      initialized = true;
      prepVideo();
      ControllerListener((key, pressed) => onKeyDownHelper(key, pressed));
    };

    useEffect(() => {
      nextStreak = 0;
      prepVideo();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isP1, isStanding, possibles]);

    const handleInput = (button: string) => {
      const video = mainRef.current;
      if (!video) return;
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
      nextStreak = incorrect ? 0 : streak + 1;
      if (!incorrect) {
        updateStreak(nextStreak);
        if (nextStreak > highestStreak) {
          updateHighestStreak(nextStreak);
          localStorage.setItem(STORAGE_KEYS.streak, nextStreak.toString());
        }
      }
      historyLog.push({
        answer,
        button,
        frame,
        streak: nextStreak,
        correctness,
      });
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
      if (params.has('debug')) {
        alert(
          JSON.stringify({
            debug: 193,
            key,
          }),
        );
      }
      if (userGuideIsOpen) {
        return;
      }
      if (shortcutToSet !== '') {
        shortcutToInput[key] = shortcutToSet;
        updateShortcutToSet(
          { '1': '2', '2': '1+2', '1+2': '' }[shortcutToSet]!,
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

    const bgClass = correctnessState
      ? correctnessConfig[correctnessState].bg
      : '';

    return (
      <div
        tabIndex={1}
        ref={(c) => c?.focus()}
        onKeyDown={(e) => {
          if (['Alt', 'Control', 'Meta', 'Shift'].includes(e.key)) {
            return;
          }
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
              style={{
                transform: 'skewX(-8deg)',
              }}
            >
              <span>SET BUTTON </span>
              <span className='text-accent'>{_shortcutToSet}</span>
            </div>
          </div>
        ) : (
          <div
            className={`flex-1 flex flex-col transition-colors duration-300 ${bgClass}`}
          >
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
                theme,
                updateTheme,
                onEditInputs: () => {
                  initialized = false;
                  updateShortcutToSet('1');
                },
                onIntro: () => {
                  updateUserGuideIsOpen(true);
                },
              })}
            />
            <div className='flex-1 min-h-0 relative'>
              {isLoading ? (
                <div className='absolute inset-0 flex items-center justify-center z-10'>
                  <div className='flex flex-col items-center gap-3'>
                    <div className='w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin' />
                    <span className='text-text-muted text-sm uppercase tracking-widest font-bold'>
                      Loading...
                    </span>
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
                })}
              >
                {props.children}
              </Center>
            </div>
            <Buttons
              get={() => ({
                possibles,
                handleInput,
              })}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Helper>
      <Video
        get={() => ({
          mainRef,
          backupRef,
          onEnded,
          initialized,
          initialize,
          speed,
        })}
      />
    </Helper>
  );
}
