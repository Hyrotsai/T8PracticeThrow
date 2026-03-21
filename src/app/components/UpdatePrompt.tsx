import { useRegisterSW } from "virtual:pwa-register/react";
import { SW_UPDATE_INTERVAL_MS } from "../config";

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, SW_UPDATE_INTERVAL_MS);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className="
        fixed top-4 left-1/2 -translate-x-1/2 z-[1000]
        flex items-center gap-3
        px-4 py-3
        bg-bg-elevated border border-accent-border
        shadow-lg rounded-lg
        animate-slide-down
      "
    >
      <span className="text-text-primary text-xs md:text-sm font-bold tracking-wide">
        New version available
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="
          px-3 py-1.5
          bg-accent text-bg-primary
          text-xs font-bold uppercase tracking-wider
          hover:opacity-90
          transition-opacity duration-150 cursor-pointer
          rounded
        "
      >
        Update
      </button>
    </div>
  );
}
