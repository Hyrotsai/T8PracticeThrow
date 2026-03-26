export default function SlicePreview() {
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-bg-primary min-h-dvh">
      <video
        src={`video/4_2_2024/preview.mp4?${Date.now()}`}
        muted
        className="max-w-full rounded-lg"
      />
      <video
        src={`video/4_2_2024/preview.mp4?${Date.now()}`}
        muted
        autoPlay
        className="max-w-full rounded-lg"
      />
    </div>
  );
}
