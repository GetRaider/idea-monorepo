"use client";

const heroMask =
  "[mask-image:radial-gradient(ellipse_110%_100%_at_50%_50%,#000_58%,rgba(0,0,0,0.35)_80%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_110%_100%_at_50%_50%,#000_58%,rgba(0,0,0,0.35)_80%,transparent_100%)]";

export function IntroHeroScene() {
  return (
    <div
      className={`relative mx-auto flex h-[min(36rem,78vh)] w-full max-w-2xl items-center justify-center overflow-hidden lg:h-[min(40rem,85vh)] lg:max-w-none ${heroMask}`}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-aurora-pulse h-[min(22rem,55vw)] w-[min(22rem,55vw)] rounded-full bg-gradient-to-tr from-fuchsia-600/35 via-violet-600/25 to-cyan-500/30 blur-[100px]" />
        <div className="animate-drift absolute h-[min(18rem,45vw)] w-[min(18rem,45vw)] rounded-full bg-blue-600/20 blur-[90px]" />
      </div>

      <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2">
        <div className="animate-glow-orbit absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_24px_4px_rgba(34,211,238,0.65)]" />
        <div
          className="animate-glow-orbit absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-400 opacity-90 shadow-[0_0_20px_3px_rgba(232,121,249,0.55)]"
          style={{ animationDuration: "28s", animationDirection: "reverse" }}
        />
      </div>

      <div className="relative isolate h-full w-full perspective-[1400px]">
        <div className="animate-float absolute left-[8%] top-[12%] h-36 w-52 sm:h-44 sm:w-64">
          <div
            className="h-full w-full rounded-2xl border border-fuchsia-500/45 bg-gradient-to-br from-white/[0.12] to-transparent shadow-[0_0_70px_-10px_rgba(217,70,239,0.55)] backdrop-blur-md"
            style={{
              transform: "rotateX(22deg) rotateY(-28deg) translateZ(60px)",
            }}
          />
        </div>
        <div
          className="animate-float-slow absolute right-[6%] top-[20%] h-32 w-48 sm:h-40 sm:w-56"
          style={{ animationDelay: "0.5s" }}
        >
          <div
            className="h-full w-full rounded-2xl border border-cyan-400/35 bg-gradient-to-tl from-white/[0.08] to-transparent opacity-95 shadow-[0_0_60px_-14px_rgba(34,211,238,0.45)] backdrop-blur-md"
            style={{
              transform: "rotateX(16deg) rotateY(20deg) translateZ(40px)",
            }}
          />
        </div>
        <div
          className="animate-float absolute bottom-[14%] left-[18%] h-28 w-44 sm:h-36 sm:w-52"
          style={{ animationDelay: "1.2s" }}
        >
          <div
            className="h-full w-full rounded-xl border border-violet-400/30 bg-white/[0.05] opacity-80 shadow-[0_0_50px_-18px_rgba(139,92,246,0.5)] backdrop-blur-lg"
            style={{
              transform: "rotateX(18deg) rotateY(-12deg) translateZ(20px)",
            }}
          />
        </div>
        <div
          className="absolute bottom-[22%] right-[12%] h-24 w-40 rounded-xl border border-white/10 bg-white/[0.03] opacity-45 blur-[1px] backdrop-blur"
          style={{
            transform: "rotateX(24deg) rotateY(8deg) translateZ(-40px)",
          }}
        />
        <div
          className="animate-float-slow absolute left-[28%] top-[38%] h-16 w-28"
          style={{ animationDelay: "2s" }}
        >
          <div
            className="h-full w-full rounded-lg border border-white/15 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 opacity-70 backdrop-blur-sm"
            style={{
              transform: "rotateX(10deg) rotateY(35deg) translateZ(80px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
