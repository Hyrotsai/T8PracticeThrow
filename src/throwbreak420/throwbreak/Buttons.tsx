export default function Buttons(props: {
  get: () => {
    possibles: { [k: string]: boolean };
    handleInput: (k: string) => void;
    onEditInputs: () => void;
    onIntro: () => void;
  };
}) {
  return (
    <div className="bg-black/80 backdrop-blur-sm border-t border-red-900/40">
      <div className="flex items-center py-3 px-4 landscape:py-2">
        {/* Edit Inputs button - left side, hidden on mobile */}
        <button
          className="
            hidden md:block
            text-[10px] sm:text-xs text-gray-400
            px-2 py-1.5
            bg-white/5 border border-red-900/40
            hover:border-red-500/50 hover:text-red-400 hover:bg-red-600/10
            active:scale-95
            transition-all duration-150
            cursor-pointer select-none
            whitespace-nowrap uppercase tracking-wider font-bold
          "
          onClick={() => props.get().onEditInputs()}
        >
          Edit Inputs
        </button>

        {/* Throw break buttons - centered */}
        <div className="flex-1 flex justify-center items-center gap-4 sm:gap-8">
          {Object.keys(props.get().possibles).map((k) => (
            <button
              key={k}
              className="
                w-14 h-14 sm:w-18 sm:h-18 landscape:w-12 landscape:h-12
                flex items-center justify-center
                text-lg sm:text-2xl landscape:text-lg font-black
                bg-black/60 text-white
                border-2 border-red-600
                hover:border-red-400 hover:bg-red-600/20 hover:text-red-400 hover:scale-110
                active:scale-95 active:bg-red-600/30
                transition-all duration-150
                cursor-pointer select-none
                shadow-lg shadow-red-900/30
              "
              style={{ clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }}
              onClick={() => props.get().handleInput(k)}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Intro button - right side */}
        <button
          className="
            text-[10px] sm:text-xs text-gray-400
            px-2 py-1.5
            bg-white/5 border border-red-900/40
            hover:border-red-500/50 hover:text-red-400 hover:bg-red-600/10
            active:scale-95
            transition-all duration-150
            cursor-pointer select-none
            whitespace-nowrap uppercase tracking-wider font-bold
          "
          onClick={() => props.get().onIntro()}
        >
          Intro
        </button>
      </div>
    </div>
  );
}
