import { REPO_URL } from "../config";

export default function UserGuide(props: {
  updateUserGuideIsOpen: (userGuideIsOpen: boolean) => void;
}) {
  return (
    <div
      className="w-full flex overflow-y-auto relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/tekken8.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/50" />

      <div className="self-center flex-1 max-h-full px-4 relative z-10">
        <div className="max-w-xl mx-auto py-8 landscape:py-4 flex flex-col items-center text-center">
          {/* Title */}
          <h1
            className="mb-10 uppercase font-black italic tracking-tighter leading-none"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              transform: "skewX(-8deg)",
              textShadow: "2px 2px 0 rgba(0,0,0,0.8), 4px 4px 8px rgba(0,0,0,0.5)",
            }}
          >
            <span className="text-white">T</span>
            <span
              className="text-accent"
              style={{ textShadow: "0 0 20px var(--t-accent-muted), 2px 2px 0 rgba(0,0,0,0.8), 4px 4px 8px rgba(0,0,0,0.5)" }}
            >
              8
            </span>
            <span className="text-white"> PRACTICE</span>
            <br />
            <span
              className="text-accent"
              style={{ textShadow: "0 0 20px var(--t-accent-muted), 2px 2px 0 rgba(0,0,0,0.8), 4px 4px 8px rgba(0,0,0,0.5)" }}
            >
              THROW
            </span>
          </h1>

          {/* Inspiration note */}
          <div className="bg-black/50 backdrop-blur-sm rounded border-l-2 border-accent px-5 py-4 mb-10 max-w-md">
            <p className="text-gray-300 text-sm leading-relaxed">
              This project is inspired by the original{" "}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover font-semibold transition-colors underline underline-offset-2"
              >
                ThrowBreak420
              </a>{" "}
              created by{" "}
              <span className="text-white font-semibold">dcep93</span>.
              All credit for the original concept goes to them.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => props.updateUserGuideIsOpen(false)}
              className="px-10 py-3 font-bold text-sm uppercase tracking-wider bg-accent hover:bg-accent-hover text-white transition-all duration-200 cursor-pointer shadow-lg active:scale-95"
              style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
            >
              Start Training
            </button>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-3 font-bold text-sm uppercase tracking-wider bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 transition-all duration-200 active:scale-95"
              style={{ clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)" }}
            >
              Original Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
