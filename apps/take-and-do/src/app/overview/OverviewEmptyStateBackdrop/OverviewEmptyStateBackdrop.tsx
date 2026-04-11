export function OverviewEmptyStateBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 bottom-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)]"
      >
        <div className="absolute left-1/2 top-[42%] h-[min(520px,70vh)] w-[min(130vw,780px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_110%_92%_at_50%_50%,rgba(139,92,246,0.11)_0%,rgba(124,58,237,0.055)_24%,rgba(109,40,217,0.022)_48%,rgba(91,33,182,0.011)_72%,rgba(91,33,182,0.003)_92%,transparent_100%)] blur-[80px]" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)]"
      >
        <div
          aria-hidden
          className="aspect-[4/5] h-[min(400px,55vh)] w-[min(92vw,400px)] opacity-[0.35] [background-image:linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_88%_80%_at_50%_50%,#000_12%,rgba(0,0,0,0.45)_42%,rgba(0,0,0,0.12)_72%,transparent_100%)]"
        />
      </div>
    </>
  );
}
