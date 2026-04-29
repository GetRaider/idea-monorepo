import { SocialLinksRow } from "@/components/SocialLinksRow";

export function ResourcesSection() {
  return (
    <div className="mx-auto mt-16 max-w-xl">
      <p className="mb-4 text-center text-[0.65rem] font-medium uppercase tracking-[0.35em] text-zinc-500">
        Resources
      </p>
      <SocialLinksRow />
    </div>
  );
}
