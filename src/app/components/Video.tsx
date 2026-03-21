import { RefObject } from "react";

export default function Video(props: {
  get: () => {
    mainRef: RefObject<HTMLVideoElement>;
    backupRef: RefObject<HTMLVideoElement>;
    onEnded: () => void;
    initialized: boolean;
    initialize: () => void;
    speed: number;
  };
}) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <video
        ref={props.get().mainRef}
        className="absolute max-h-full max-w-full z-[1] object-contain"
        playsInline
        autoPlay
        muted
        onEnded={() => props.get().onEnded()}
      />
      <video
        src="video/blank.mp4"
        ref={props.get().backupRef}
        className="absolute max-h-full max-w-full object-contain"
        autoPlay
        playsInline
        onCanPlay={() => {
          const t = props.get().backupRef.current!;
          t.pause();
          if (!props.get().initialized) {
            props.get().initialize();
            return;
          }
          const video = props.get().mainRef.current!;
          video.src = t.src;
          video.playbackRate = props.get().speed;
        }}
      />
    </div>
  );
}
