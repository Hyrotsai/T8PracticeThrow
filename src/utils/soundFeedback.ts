let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  durationMs: number,
  gain: number,
) {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Fade out smoothly to avoid clicks
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + durationMs / 1000,
  );

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + durationMs / 1000);
}

export function playCorrect() {
  // Two ascending tones — clean and satisfying
  playTone(660, 'sine', 100, 0.15);
  setTimeout(() => playTone(880, 'sine', 150, 0.12), 80);
}

export function playSlow() {
  // Single neutral mid tone
  playTone(440, 'triangle', 180, 0.13);
}

export function playWrong() {
  // Low sawtooth — slightly harsh but not annoying
  playTone(180, 'sawtooth', 220, 0.1);
}
