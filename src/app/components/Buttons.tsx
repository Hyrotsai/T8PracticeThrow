import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Buttons(props: {
  get: () => {
    possibles: { [k: string]: boolean };
    handleInput: (k: string) => void;
  };
}) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  return (
    <div className="bg-bg-elevated backdrop-blur-sm border-t border-drawer-border">
      <div className="flex items-center py-3 px-4 landscape:py-2">
        {/* Install App button - left side, mobile only, hidden if installed */}
        {installPrompt && !isInstalled && (
          <button
            className="
              block lg:hidden
              text-[10px] text-btn-text
              px-2 py-1.5
              bg-btn-bg border border-btn-border
              hover:border-accent-border-hover hover:text-btn-hover-text hover:bg-btn-hover-bg
              active:scale-95
              transition-all duration-150
              cursor-pointer select-none
              whitespace-nowrap uppercase tracking-wider font-bold
            "
            onClick={handleInstallClick}
          >
            Install App
          </button>
        )}

        {/* Throw break buttons - centered */}
        <div className="flex-1 flex justify-center items-center gap-4 sm:gap-8">
          {Object.keys(props.get().possibles).map((k) => (
            <button
              key={k}
              className="
                w-14 h-14 sm:w-18 sm:h-18 landscape:w-12 landscape:h-12
                flex items-center justify-center
                text-lg sm:text-2xl landscape:text-lg font-black
                bg-bg-tertiary text-text-primary
                border-2 border-accent
                hover:border-accent-hover hover:bg-accent-subtle hover:text-accent hover:scale-110
                active:scale-95 active:bg-accent-subtle
                transition-all duration-150
                cursor-pointer select-none
                shadow-lg
              "
              style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }}
              onClick={() => props.get().handleInput(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
