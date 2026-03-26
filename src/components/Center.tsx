import { ReactNode } from "react";
import { historyLog, Correctness, correctnessConfig } from "./Game";

export default function Center(props: {
  children: ReactNode;
  get: () => {
    isLoading: boolean;
    lastAnswer: string;
    lastInput: string;
    lastFrame: number;
    streak: number;
    highestStreak: number;
    correctnessState: Correctness | undefined;
    isRankingActive: boolean;
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
      <div className="flex landscape:flex-col gap-2 px-3 py-2 landscape:py-3 landscape:px-4 landscape:w-56 shrink-0">
        {/* Stats Cards */}
        <div className="flex landscape:flex-col gap-2 flex-1 landscape:flex-initial">
          {/* Last Round Info */}
          <div className="bg-bg-surface backdrop-blur-sm rounded-lg px-4 py-2.5 border border-accent-border flex-1 landscape:flex-initial">
            <div className="flex landscape:flex-col gap-x-4 gap-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center gap-2">
                <span className="text-text-muted uppercase tracking-wider text-[10px] font-medium">ANS</span>
                <span className="text-text-primary font-bold text-sm">{props.get().lastAnswer || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-text-muted uppercase tracking-wider text-[10px] font-medium">IN</span>
                <span className="text-text-primary font-bold text-sm">{props.get().lastInput || "-"}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-text-muted uppercase tracking-wider text-[10px] font-medium">FRM</span>
                <span className="text-text-primary font-bold tabular-nums text-sm">{props.get().lastFrame || "-"}</span>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="bg-bg-surface backdrop-blur-sm rounded-lg px-4 py-2.5 border border-accent-border flex-1 landscape:flex-initial">
            <div className="flex landscape:flex-col gap-x-4 gap-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center gap-2">
                <span className="text-text-muted uppercase tracking-wider text-[10px] font-medium">STREAK</span>
                <span className="text-accent font-black text-lg tabular-nums leading-none">{props.get().streak}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-text-muted uppercase tracking-wider text-[10px] font-medium">BEST</span>
                <span className="text-text-primary font-black text-lg tabular-nums leading-none">{props.get().highestStreak}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result indicator */}
        <div className="flex items-center landscape:justify-center landscape:py-1 min-h-[28px]">
          {correctnessState && (
            <div
              className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest ${
                correctnessState === Correctness.right
                  ? "bg-green-500/20 text-success border border-green-500/30"
                  : correctnessState === Correctness.slow
                  ? "bg-yellow-500/20 text-warning border border-yellow-500/30"
                  : "bg-red-500/20 text-danger border border-red-500/30"
              }`}
            >
              {correctnessConfig[correctnessState].label}
            </div>
          )}
        </div>

        {/* History */}
        <div className="hidden landscape:flex flex-col flex-1 min-h-0 mt-2">
          <div className="text-[10px] uppercase tracking-widest text-accent-muted mb-2 font-bold">History</div>
          <div className="flex-1 overflow-y-auto rounded-lg bg-bg-surface border border-border-subtle">
            <table className="text-[11px] w-full">
              <thead className="sticky top-0 bg-bg-elevated backdrop-blur-sm">
                <tr className="text-text-muted uppercase text-[9px] tracking-wider">
                  <td className="px-2 py-1.5">ans</td>
                  <td className="px-2 py-1.5">in</td>
                  <td className="px-2 py-1.5">frm</td>
                  <td className="px-2 py-1.5">str</td>
                  <td className="px-1 py-1.5"></td>
                </tr>
              </thead>
              <tbody>
                {historyLog
                  .slice()
                  .reverse()
                  .map((o, i) => (
                    <tr key={i} className={`text-text-secondary border-t border-border-subtle ${i % 2 === 0 ? "bg-border-subtle" : ""}`}>
                      <td className="px-2 py-1 tabular-nums">{o.answer}</td>
                      <td className="px-2 py-1 tabular-nums">{o.button}</td>
                      <td className="px-2 py-1 tabular-nums">{o.frame}</td>
                      <td className="px-2 py-1 tabular-nums">{o.streak}</td>
                      <td className="px-1 py-1">
                        <span className={`inline-block w-4 text-center text-[10px] font-bold ${
                          o.correctness === Correctness.right ? "text-success"
                          : o.correctness === Correctness.slow ? "text-warning"
                          : "text-danger"
                        }`}>
                          {o.correctness === Correctness.right ? "✓" : o.correctness === Correctness.slow ? "!" : "✗"}
                        </span>
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
