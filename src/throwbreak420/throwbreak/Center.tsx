import { ReactNode } from "react";
import { historyLog, Correctness, correctnessConfig } from "./ThrowBreak";

export default function Center(props: {
  children: ReactNode;
  get: () => {
    isLoading: boolean;
    lastAnswer: string;
    lastInput: string;
    lastFrame: number;
    streak: number;
    highestStreak: number;
    updateUserGuideIsOpen: (userGuideIsOpen: boolean) => void;
    correctnessState: Correctness | undefined;
  };
}) {
  const { correctnessState } = props.get();

  return (
    <div
      className={`h-full w-full flex flex-col landscape:flex-row transition-opacity duration-200 ${
        props.get().isLoading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Stats Panel */}
      <div className="flex landscape:flex-col gap-2 px-3 py-2 landscape:py-4 landscape:px-4 landscape:w-52 shrink-0">
        {/* Stats Grid */}
        <div className="flex landscape:flex-col gap-2 flex-1 landscape:flex-initial">
          <div className="bg-black/40 backdrop-blur-sm px-3 py-2 border-l-2 border-red-900/60 flex-1 landscape:flex-initial">
            <div className="flex landscape:flex-col gap-x-4 gap-y-1 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 uppercase tracking-wider text-[10px]">ANS</span>
                <span className="text-white font-bold">
                  {props.get().lastAnswer || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 uppercase tracking-wider text-[10px]">IN</span>
                <span className="text-white font-bold">
                  {props.get().lastInput || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 uppercase tracking-wider text-[10px]">FRM</span>
                <span className="text-white font-bold tabular-nums">
                  {props.get().lastFrame || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm px-3 py-2 border-l-2 border-red-600/60 flex-1 landscape:flex-initial">
            <div className="flex landscape:flex-col gap-x-4 gap-y-1 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 uppercase tracking-wider text-[10px]">STREAK</span>
                <span className="text-red-400 font-black text-base tabular-nums">
                  {props.get().streak}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-600 uppercase tracking-wider text-[10px]">BEST</span>
                <span className="text-white font-black tabular-nums">
                  {props.get().highestStreak}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Result indicator */}
        {correctnessState && (
          <div className="flex items-center landscape:justify-center">
            <span className="text-lg landscape:text-2xl">
              {correctnessConfig[correctnessState].emoji}
            </span>
          </div>
        )}

        {/* User Guide Button */}
        <div className="flex items-center landscape:mt-2">
          <button
            className="
              text-xs text-gray-600
              hover:text-red-400 transition-colors
              cursor-pointer uppercase tracking-wider font-bold
            "
            onClick={() => props.get().updateUserGuideIsOpen(true)}
          >
            Info
          </button>
        </div>

        {/* History (hidden on portrait/small screens) */}
        <div className="hidden landscape:flex flex-col flex-1 min-h-0 mt-3">
          <div className="text-[10px] uppercase tracking-widest text-red-600/60 mb-1 font-bold">
            History
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="text-[11px] w-full">
              <thead>
                <tr className="text-gray-600 uppercase">
                  <td className="pr-2">ans</td>
                  <td className="pr-2">in</td>
                  <td className="pr-2">frm</td>
                  <td className="pr-2">str</td>
                  <td></td>
                </tr>
              </thead>
              <tbody>
                {historyLog
                  .slice()
                  .reverse()
                  .map((o, i) => (
                    <tr key={i} className="text-gray-400">
                      <td className="pr-2 tabular-nums">{o.answer}</td>
                      <td className="pr-2 tabular-nums">{o.button}</td>
                      <td className="pr-2 tabular-nums">{o.frame}</td>
                      <td className="pr-2 tabular-nums">{o.streak}</td>
                      <td>
                        {correctnessConfig[o.correctness]?.emoji}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative min-h-0">{props.children}</div>
    </div>
  );
}
