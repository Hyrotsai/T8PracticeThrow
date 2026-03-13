export default function Settings(props: {
  get: () => {
    isP1: boolean;
    updateIsP1: (isP1: boolean) => void;
    isStanding: boolean;
    updateIsStanding: (isStanding: boolean) => void;
    possibles: { [k: string]: boolean };
    updatePossibles: (possibles: { [k: string]: boolean }) => void;
    speed: number;
    updateSpeed: (speed: number) => void;
  };
}) {
  return (
    <div className="bg-black/80 backdrop-blur-sm border-b border-red-900/40">
      <form
        className="flex items-center justify-around gap-2 md:gap-4 px-4 py-2 md:py-3 landscape:py-1.5 text-xs sm:text-sm"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Player Side */}
        <div className="flex gap-1 md:gap-2">
          {[true, false].map((t) => (
            <label
              key={t ? "t" : "f"}
              className={`
                flex items-center gap-1 px-2.5 py-1 md:px-4 md:py-2 cursor-pointer transition-all duration-150 select-none
                ${
                  t === props.get().isP1
                    ? "bg-red-600/20 text-red-400 border-l-2 border-red-500"
                    : "text-gray-500 hover:text-gray-300 border-l-2 border-transparent"
                }
              `}
            >
              <input
                type="radio"
                name="isP1"
                className="sr-only"
                checked={t === props.get().isP1}
                onChange={() => props.get().updateIsP1(t)}
              />
              <span className="font-bold uppercase text-[11px] md:text-sm tracking-wider">
                {t ? "P1" : "P2"}
              </span>
            </label>
          ))}
        </div>

        {/* Position */}
        <div className="flex gap-1 md:gap-2">
          {[true, false].map((t) => (
            <label
              key={t ? "t" : "f"}
              className={`
                flex items-center gap-1 px-2.5 py-1 md:px-4 md:py-2 cursor-pointer transition-all duration-150 select-none
                ${
                  t === props.get().isStanding
                    ? "bg-red-600/20 text-red-400 border-l-2 border-red-500"
                    : "text-gray-500 hover:text-gray-300 border-l-2 border-transparent"
                }
              `}
            >
              <input
                type="radio"
                name="isStanding"
                className="sr-only"
                checked={t === props.get().isStanding}
                onChange={() => props.get().updateIsStanding(t)}
              />
              <span className="font-bold uppercase text-[11px] md:text-sm tracking-wider">
                {t ? "STD" : "GND"}
              </span>
            </label>
          ))}
        </div>

        {/* Break Types */}
        <div className="flex gap-1 md:gap-2">
          {Object.entries(props.get().possibles).map(([k, v]) => (
            <label
              key={k}
              className={`
                flex items-center gap-1 px-2 py-1 md:px-3.5 md:py-2 cursor-pointer transition-all duration-150 select-none
                ${
                  v
                    ? "bg-white/10 text-white border-l-2 border-white/60"
                    : "text-gray-600 hover:text-gray-400 border-l-2 border-transparent opacity-50"
                }
              `}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={v}
                onChange={() =>
                  props.get().updatePossibles(
                    Object.assign({}, props.get().possibles, {
                      [k]: !v,
                    })
                  )
                }
              />
              <span className="font-bold text-[11px] md:text-sm">{k}</span>
            </label>
          ))}
        </div>

        {/* Speed */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <span className="text-gray-500 text-[11px] md:text-sm tabular-nums hidden sm:inline">
            {props.get().speed.toFixed(2)}x
          </span>
          <button
            className="
              w-6 h-6 md:w-8 md:h-8 flex items-center justify-center
              bg-white/5 text-gray-400 border border-red-900/50
              hover:border-red-500 hover:text-red-400 hover:bg-red-600/10
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-150 cursor-pointer text-xs md:text-base font-bold
            "
            disabled={props.get().speed <= 0.1}
            onClick={() => props.get().updateSpeed(props.get().speed - 0.01)}
          >
            -
          </button>
          <span className="text-white text-[11px] md:text-sm tabular-nums font-bold sm:hidden">
            {props.get().speed.toFixed(2)}x
          </span>
          <button
            className="
              w-6 h-6 md:w-8 md:h-8 flex items-center justify-center
              bg-white/5 text-gray-400 border border-red-900/50
              hover:border-red-500 hover:text-red-400 hover:bg-red-600/10
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-150 cursor-pointer text-xs md:text-base font-bold
            "
            disabled={props.get().speed >= 4}
            onClick={() => props.get().updateSpeed(props.get().speed + 0.01)}
          >
            +
          </button>
        </div>
      </form>
    </div>
  );
}
