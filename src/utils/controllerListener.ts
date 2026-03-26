let controllerInitialized = false;
let pollInterval: ReturnType<typeof setInterval> | null = null;

export default function ControllerListener(
  helper: (key: string, pressed: boolean) => void
): () => void {
  // Guard against multiple initializations
  if (controllerInitialized) return () => {};
  controllerInitialized = true;

  const allPressed: { [key: string]: boolean } = {};

  const onGamepadConnected = () => {
    // Clear any existing poll before starting a new one
    if (pollInterval !== null) clearInterval(pollInterval);

    pollInterval = setInterval(() =>
      navigator.getGamepads().forEach((gamepad, i) =>
        Array.from(gamepad?.buttons || []).forEach((button, j) => {
          const key = `controller_${i}_${j}`;
          const pressed =
            typeof button === "object" ? button.pressed : button === 1.0;
          if (pressed !== allPressed[key]) {
            allPressed[key] = pressed;
            helper(key, pressed);
          }
        })
      )
    );
  };

  window.addEventListener("gamepadconnected", onGamepadConnected);

  // Return cleanup function
  return () => {
    window.removeEventListener("gamepadconnected", onGamepadConnected);
    if (pollInterval !== null) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    controllerInitialized = false;
  };
}
