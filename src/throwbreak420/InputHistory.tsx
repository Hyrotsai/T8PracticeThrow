import { useState } from "react";
import ControllerListener from "./throwbreak/ControllerListener";

const msPerFrame = 1000 / 60;

type Data = { time: number; keys: string[] }[];
var data: Data = [];

export default function InputHistory() {
  const [_data, _updateData] = useState(data);
  const updateData = (newData: Data) => {
    newData = newData.slice(-1000);
    data = newData;
    _updateData(newData);
  };

  function reset() {
    updateData([{ time: Date.now(), keys: [] }]);
  }

  function update(key: string, pressed: boolean) {
    if (key === "Escape") {
      if (pressed) {
        reset();
      }
      return;
    }
    const keys = data[data.length - 1].keys.slice();
    if (pressed === keys.includes(key)) return;
    if (pressed) {
      keys.push(key);
    } else {
      keys.splice(keys.indexOf(key), 1);
    }
    updateData(data.concat({ time: Date.now(), keys }));
  }

  return (
    <div className="font-mono text-white bg-black h-dvh w-dvw flex text-lg">
      <div
        className="m-4 flex-1 overflow-auto outline-none"
        tabIndex={1}
        ref={(c) => {
          if (data.length === 0) reset();
          c?.focus();
          ControllerListener(update);
        }}
        onKeyDown={(e) => update(e.key, true)}
        onKeyUp={(e) => update(e.key, false)}
      >
        <h2
          className="text-xl font-black mb-4 text-red-500 uppercase italic tracking-wider"
          style={{ transform: "skewX(-8deg)" }}
        >
          Input History
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Press Escape to reset. Press any key or use controller.
        </p>
        <table className="text-sm">
          <thead>
            <tr className="text-gray-600 text-xs uppercase tracking-wider">
              <td className="pr-6 py-1">Frames</td>
              <td className="py-1">Keys</td>
            </tr>
          </thead>
          <tbody>
            {_data
              .slice()
              .reverse()
              .reduce(
                (obj, curr, index) => {
                  const keys = [curr.keys.sort().join(" ")];
                  if (keys[0] !== obj.lastKey) {
                    if (index === 0) {
                      obj.data.push({ keys, time: 0 });
                      obj.time = curr.time;
                      obj.lastKey = keys[0];
                    } else {
                      const ageFrames = (obj.time - curr.time) / msPerFrame;
                      if (ageFrames >= 1) {
                        obj.data.push({
                          keys,
                          time: Math.floor(ageFrames),
                        });
                        obj.time = curr.time;
                        obj.lastKey = keys[0];
                      }
                    }
                  }
                  return obj;
                },
                {
                  time: 0,
                  data: [] as Data,
                  lastKey: null as string | null,
                }
              )
              .data.map((d, i) => (
                <tr
                  key={i}
                  className="text-gray-400 border-b border-red-900/20"
                >
                  <td className="pr-6 py-1 tabular-nums text-gray-600">
                    {d.time}
                  </td>
                  <td className="py-1 font-bold text-white">
                    {d.keys[0] || (
                      <span className="text-gray-600 italic">none</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
