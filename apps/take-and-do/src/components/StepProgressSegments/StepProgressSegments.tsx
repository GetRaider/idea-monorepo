"use client";

type StepProgressSegmentsProps = {
  totalSteps: number;
  currentStep: number;
};

export function StepProgressSegments({
  totalSteps,
  currentStep,
}: StepProgressSegmentsProps) {
  return (
    <div className="mb-6 flex w-full gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <StepProgressSegment
          key={index}
          filled={index <= currentStep}
          active={index === currentStep}
        />
      ))}
    </div>
  );
}

function StepProgressSegment({
  filled,
  active,
}: {
  filled: boolean;
  active: boolean;
}) {
  const base =
    "h-2.5 flex-1 origin-left rounded-full transition-[background,transform] duration-300 ease-out";

  if (!filled) {
    return <div className={`${base} bg-input-bg`} />;
  }

  if (active) {
    return (
      <div
        className={`${base} animate-segment-fill animate-shimmer bg-gradient-to-r from-zinc-500 to-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.12)]`}
      />
    );
  }

  return (
    <div
      className={`${base} animate-segment-fill bg-gradient-to-r from-zinc-600 to-zinc-400`}
    />
  );
}
