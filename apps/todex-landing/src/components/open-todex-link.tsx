import { getAppHref } from "@/lib/app-url";

export function OpenTodexLink() {
  return (
    <a
      href={getAppHref()}
      className="primary-noise inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-black hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
    >
      <span className="relative">Open Todex</span>
    </a>
  );
}
