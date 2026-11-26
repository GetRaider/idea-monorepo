import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/data/products";

import { ArrowIcon, StatusBadge, TagList, card } from "./ui";

function ProductMark({ product, size }: { product: Product; size: "lg" | "sm" }) {
  const box = size === "lg" ? "size-14 rounded-2xl text-xl" : "size-10 rounded-xl text-base";
  if (product.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small static mark
      <img src={product.logo} alt="" width={56} height={56} className={`${box} shrink-0 border border-white/10 bg-ink-raised object-cover`} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${box} inline-flex shrink-0 items-center justify-center border border-white/10 bg-[linear-gradient(180deg,rgba(242,162,90,0.18),rgba(242,162,90,0.04))] font-medium text-ember`}
    >
      {product.name.charAt(0)}
    </span>
  );
}

const cardLink = "group flex h-full transition-colors hover:border-white/20";

/** Large card with a mini product mock (Todex). */
export function FeaturedProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className={`${card} ${cardLink} flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center`}>
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <ProductMark product={product} size="lg" />
          <div>
            <h3 className="text-2xl font-medium tracking-tight text-cream">{product.name}</h3>
            <div className="mt-1.5">
              <StatusBadge tone={product.statusTone}>{product.status}</StatusBadge>
            </div>
          </div>
        </div>
        <p className="mt-5 text-lg text-cream/90">{product.tagline}</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">{product.why}</p>
        <div className="mt-5">
          <TagList items={product.stack} label={`${product.name} stack`} />
        </div>
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-ember">
          Read more <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      {product.media?.[0] ? (
        <div className="w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-raised p-1 lg:w-[26rem]">
          <Image
            src={product.media[0].src}
            alt=""
            width={product.media[0].width}
            height={product.media[0].height}
            sizes="(min-width: 1024px) 416px, 100vw"
            className="h-auto w-full rounded-lg"
          />
        </div>
      ) : (
        <ContextMock />
      )}
    </Link>
  );
}

/** Decorative mini-mock: a task with linked context, handed to an agent. The card text carries the meaning. */
function ContextMock() {
  return (
    <div aria-hidden="true" className="w-full max-w-sm shrink-0 rounded-xl border border-white/[0.08] bg-ink/70 text-xs lg:w-80">
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] px-4 py-2.5">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="ml-2 text-mist">Planning / Launch</span>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm font-medium text-cream">Ship invoice drafts</p>
        <div className="space-y-1.5">
          {["Research: 6 findings", "Decision: invoices only", "Plan: 3 tasks"].map((row) => (
            <p key={row} className="flex items-center gap-2 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-mist">
              <span className="size-1.5 rounded-full bg-ember/80" /> {row}
            </p>
          ))}
        </div>
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
          <span className="size-1.5 animate-pulse rounded-full bg-ember motion-reduce:animate-none" /> agent reading via MCP
        </p>
      </div>
    </div>
  );
}

/** Medium card (Take & Do). */
export function SecondaryProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className={`${card} ${cardLink} flex-col gap-4 p-6 sm:flex-row sm:items-center`}>
      <ProductMark product={product} size="lg" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-medium tracking-tight text-cream">{product.name}</h3>
          <StatusBadge tone={product.statusTone}>{product.status}</StatusBadge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-mist">{product.tagline}</p>
      </div>
      <ArrowIcon className="hidden size-5 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-ember sm:block" />
    </Link>
  );
}

/** One-line row for the remaining products. */
export function CompactProductRow({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex items-center gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-white/[0.03] sm:px-4"
    >
      <ProductMark product={product} size="sm" />
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
        <h3 className="font-medium text-cream sm:w-28 sm:shrink-0">{product.name}</h3>
        <p className="text-sm text-mist sm:flex-1">{product.tagline}</p>
      </div>
      <span className="hidden text-xs text-mist md:inline">{product.status}</span>
      <ArrowIcon className="size-4 shrink-0 text-mist transition-transform group-hover:translate-x-0.5 group-hover:text-ember" />
    </Link>
  );
}
