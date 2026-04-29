import type { StaticImageData } from "next/image";

export function ProjectBrandMark({
  src,
  variant,
  matteSurfaceClass,
}: ProjectBrandMarkProps) {
  const frameSurface =
    matteSurfaceClass ?? "bg-gradient-to-b from-zinc-900/95 to-black/80";

  if (variant === "card") {
    return (
      <div
        className={`flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl border border-white/12 p-1.5 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)_inset] sm:h-14 sm:w-14 sm:p-2 ${frameSurface}`}
      >
        <img
          src={src.src}
          width={src.width}
          height={src.height}
          alt=""
          className="h-full w-full object-contain"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl border border-white/12 p-2 shadow-[0_12px_40px_-14px_rgba(99,102,241,0.35),0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:h-[5.5rem] sm:w-[5.5rem] sm:p-2.5 ${frameSurface}`}
    >
      <img
        src={src.src}
        width={src.width}
        height={src.height}
        alt=""
        className="h-full w-full object-contain"
        decoding="async"
      />
    </div>
  );
}

type ProjectBrandMarkProps = {
  src: StaticImageData;
  variant: "card" | "detail";
  matteSurfaceClass?: string;
};
