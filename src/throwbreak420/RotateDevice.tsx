import { ReactNode, useEffect, useState } from "react";

function isMobilePortrait(): boolean {
  if (typeof window === "undefined") return false;
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 1024;
  const isPortrait = window.innerHeight > window.innerWidth;
  return isTouchDevice && isSmallScreen && isPortrait;
}

export default function RotateDevice(props: { children: ReactNode }) {
  const [showOverlay, setShowOverlay] = useState(isMobilePortrait);

  useEffect(() => {
    function handleChange() {
      setShowOverlay(isMobilePortrait());
    }

    window.addEventListener("resize", handleChange);
    window.addEventListener("orientationchange", handleChange);

    const mql = window.matchMedia("(orientation: portrait)");
    mql.addEventListener("change", handleChange);

    return () => {
      window.removeEventListener("resize", handleChange);
      window.removeEventListener("orientationchange", handleChange);
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  if (showOverlay) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-8 text-center font-mono">
        {/* Rotate icon */}
        <div className="mb-8 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[wiggle_2s_ease-in-out_infinite]"
          >
            {/* Phone outline */}
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" />
          </svg>
        </div>

        {/* Arrow hint */}
        <div className="mb-6 text-red-500/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
        </div>

        <h2
          className="text-xl font-black text-white mb-3 uppercase italic tracking-wider"
          style={{ transform: "skewX(-8deg)" }}
        >
          Rotate your device
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          For the best experience, please hold your device in
          <span className="text-red-400 font-bold"> landscape </span>
          mode.
        </p>
      </div>
    );
  }

  return <>{props.children}</>;
}
