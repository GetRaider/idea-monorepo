import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLink, ExternalIcon, StatusBadge, TagList, card, ghostButton, monoLabel, textLink } from "@/components/ui";
import { getProduct, products } from "@/data/products";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: `${product.name}: ${product.tagline}. ${product.status}.`,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const successor = product.predecessorOf ? getProduct(product.predecessorOf) : undefined;

  return (
    <article className="px-5 pb-10 pt-12 sm:pt-20">
      <div className="mx-auto max-w-4xl">
        <ArrowLink href="/products">All products</ArrowLink>

        <header className="mt-8">
          <StatusBadge tone={product.statusTone}>{product.status}</StatusBadge>
          <h1 className="mt-5 text-4xl font-medium tracking-tight text-silver sm:text-6xl">{product.name}</h1>
          <p className="mt-4 text-lg text-cream/90 sm:text-xl">{product.tagline}</p>
          {successor ? (
            <p className="mt-4 text-sm text-mist">
              Predecessor of {successor.name}: this is where it started.{" "}
              <Link href={`/products/${successor.slug}`} className={textLink}>
                See {successor.name}
              </Link>
            </p>
          ) : null}
        </header>

        <section aria-labelledby="why-title" className="mt-10">
          <h2 id="why-title" className={monoLabel}>
            Why
          </h2>
          <p className="mt-3 text-base leading-relaxed text-cream/90 sm:text-lg">{product.why}</p>
        </section>

        {product.links.length > 0 ? (
          <ul className="mt-8 flex flex-wrap gap-3">
            {product.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={ghostButton}>
                  {link.label} <ExternalIcon className="size-4" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        {product.media?.length ? (
          <section aria-label={`${product.name} screenshots`} className="mt-10 space-y-6">
            {product.media.map((item, index) => (
              <figure key={item.src} className={`${card} bg-ink-raised p-1.5`}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(min-width: 1024px) 896px, 100vw"
                  priority={index === 0}
                  className="h-auto w-full rounded-xl"
                />
              </figure>
            ))}
          </section>
        ) : null}

        <section aria-labelledby="stack-title" className="mt-10">
          <h2 id="stack-title" className={`${monoLabel} mb-3`}>
            Stack
          </h2>
          <TagList items={product.stack} label={`${product.name} stack`} />
        </section>

        {product.details?.length ? (
          <section aria-labelledby="details-title" className={`${card} mt-12 p-6 sm:p-8`}>
            <h2 id="details-title" className={monoLabel}>
              Details
            </h2>
            <dl className="mt-5 space-y-5">
              {product.details.map((detail) => (
                <div key={detail.title}>
                  <dt className="font-medium text-cream">{detail.title}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-mist">{detail.body}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </article>
  );
}
