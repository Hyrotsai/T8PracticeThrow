// Standard W3C Gamepad API button layout (works for Xbox, PS4/PS5, and most generics)
// https://w3c.github.io/gamepad/#remapping
//
// Index  Xbox        PlayStation   → Game input
//   2    X           Square (□)    → '1'  (or '1+2' if combined with △/Y)
//   3    Y           Triangle (△)  → '2'  (or '1+2' if combined with □/X)
//   4    LB          L1            → '1'
//   5    RB          R1            → '2'
//   6    LT          L2            → '1+2'
//   7    RT          R2            → '1+2'
//  14    D-pad Left  D-pad Left    → '1'
//  15    D-pad Right D-pad Right   → '2'
//
// Pressing □+△ (X+Y) simultaneously registers as '1+2'.

// Buttons that act as '1' or '2' and can combine to form '1+2'
const COMBO_BUTTONS: Record<number, '1' | '2'> = {
  2: '1',  // X / Square
  3: '2',  // Y / Triangle
};

// Buttons that always emit a fixed input with no combo logic
const DIRECT_BUTTONS: Record<number, '1' | '2' | '1+2'> = {
  4:  '1',    // LB / L1
  5:  '2',    // RB / R1
  6:  '1+2',  // LT / L2
  7:  '1+2',  // RT / R2
  14: '1',    // D-pad Left
  15: '2',    // D-pad Right
};

// How long to wait for a second combo button before firing (half a frame at 60fps)
const COMBO_WINDOW_MS = 1000 / 60 / 2; // ~8ms
const POLL_INTERVAL_MS = 8;

let controllerInitialized = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

export default function ControllerListener(
  helper: (input: string, pressed: boolean) => void
): () => void {
  if (controllerInitialized) return () => {};
  controllerInitialized = true;

  // Track raw button state per gamepad+button key
  const allPressed: { [key: string]: boolean } = {};

  // Track which combo buttons are currently held (per gamepad index)
  const comboHeld: { [gamepadIndex: number]: Set<'1' | '2'> } = {};
  let comboTimeout: ReturnType<typeof setTimeout> | null = null;

  const fireCombo = (gamepadIndex: number) => {
    if (comboTimeout !== null) {
      clearTimeout(comboTimeout);
      comboTimeout = null;
    }
    const held = comboHeld[gamepadIndex];
    if (!held || held.size === 0) return;

    if (held.has('1') && held.has('2')) {
      helper('1+2', true);
    } else if (held.has('1')) {
      helper('1', true);
    } else if (held.has('2')) {
      helper('2', true);
    }
  };

  const startPolling = () => {
    if (pollInterval !== null) clearInterval(pollInterval);

    pollInterval = setInterval(() => {
      navigator.getGamepads().forEach((gamepad, i) => {
        if (!gamepad) return;

        if (!comboHeld[i]) comboHeld[i] = new Set();

        gamepad.buttons.forEach((button, j) => {
          const key = `controller_${i}_${j}`;
          const pressed = typeof button === 'object' ? button.pressed : button === 1.0;

          if (pressed === allPressed[key]) return; // no change
          allPressed[key] = pressed;

          // --- Combo buttons (□/X and △/Y) ---
          if (j in COMBO_BUTTONS) {
            const input = COMBO_BUTTONS[j];
            if (pressed) {
              comboHeld[i].add(input);
              // Wait briefly for a potential second button before firing
              if (comboTimeout !== null) clearTimeout(comboTimeout);
              comboTimeout = setTimeout(() => fireCombo(i), COMBO_WINDOW_MS);
            } else {
              comboHeld[i].delete(input);
            }
            return;
          }

          // --- Direct buttons (no combo logic) ---
          if (j in DIRECT_BUTTONS && pressed) {
            helper(DIRECT_BUTTONS[j], true);
          }
        });
      });
    }, POLL_INTERVAL_MS);
  };

  const onGamepadConnected = () => startPolling();
  const onGamepadDisconnected = () => startPolling();

  window.addEventListener('gamepadconnected', onGamepadConnected);
  window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

  // If a gamepad is already connected on init (e.g. page reload with controller plugged in)
  if (navigator.getGamepads().some(g => g !== null)) startPolling();

  return () => {
    window.removeEventListener('gamepadconnected', onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
    if (pollInterval !== null) { clearInterval(pollInterval); pollInterval = null; }
    if (comboTimeout !== null) { clearTimeout(comboTimeout); comboTimeout = null; }
    controllerInitialized = false;
  };
}
