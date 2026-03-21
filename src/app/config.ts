// ─── App Identity ────────────────────────────────────────────
export const VERSION = "1.0.0";

// ─── Game Timing / Logic ─────────────────────────────────────
export const GAME_CONFIG = {
  frameStart: 42,
  breakWindow: 20,
  correctSleepMs: 250,
  incorrectSleepMs: 2000,
  framesPerSecond: 60,
};

// Allow URL query params to override GAME_CONFIG values
const params = new URLSearchParams(window.location.search);
params.forEach((value, key) => {
  if (key in GAME_CONFIG) {
    GAME_CONFIG[key as keyof typeof GAME_CONFIG] = Number(value);
  }
});
export { params };

// ─── Speed Control Limits ────────────────────────────────────
export const SPEED_LIMITS = {
  min: 0.1,
  max: 4,
  step: 0.01,
} as const;

// ─── Fail Delay Limits ──────────────────────────────────────
export const FAIL_DELAY_LIMITS = {
  min: 250,
  max: 5000,
  step: 250,
} as const;

// ─── URLs ────────────────────────────────────────────────────
export const VIDEO_BASE_URL =
  "https://dcep93.github.io/throwbreak420/throwbreak420/public/video/4_2_2024";

export const REPO_URL = "https://github.com/dcep93/throwbreak420/";

// ─── Service Worker ──────────────────────────────────────────
export const SW_UPDATE_INTERVAL_MS = 60_000; // 60 seconds

// ─── Input History ───────────────────────────────────────────
export const HISTORY_BUFFER_SIZE = 1000;

// ─── localStorage Keys ──────────────────────────────────────
export const STORAGE_KEYS = {
  theme: "theme",
  streak: "streak",
  hasStarted: "hasStarted",
} as const;
