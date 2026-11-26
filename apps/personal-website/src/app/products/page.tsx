import type { Metadata } from "next";

import { CompactProductRow, FeaturedProductCard, SecondaryProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { SectionHeader, card, monoLabel } from "@/components/ui";
import { products, productsByTier } from "@/data/products";

export const metadata: Metadata = {
  title: "Products",
  description: `Products I build end to end: ${products.map((product) => product.name).join(", ")}.`,
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  const featured = productsByTier("featured");
  const secondary = productsByTier("secondary");
  const compact = productsByTier("compact");

  return (
    <div className="px-5 pb-10 pt-16 sm:pt-24">
      <div className="mx-auto max-w-page">
        <SectionHeader
          as="h1"
          id="products-title"
          eyebrow="Products"
          title="What I'm building."
          lead="Every one of these products started with me. I build them around problems I have myself first, so I understand the problem fully and can then help people who need the same thing solved."
          align="left"
        />
        <div className="mt-12 space-y-4">
          {featured.map((product) => (
            <Reveal key={product.slug}>
              <FeaturedProductCard product={product} />
            </Reveal>
          ))}
          {secondary.map((product) => (
            <Reveal key={product.slug} delay={80}>
              <SecondaryProductCard product={product} />
            </Reveal>
          ))}
        </div>
        {compact.length > 0 ? (
          <Reveal delay={120} className={`${card} mt-10 p-3 sm:p-4`}>
            <h2 className={`${monoLabel} px-3 pb-2 pt-2 sm:px-4`}>More in progress</h2>
            <ul className="divide-y divide-white/[0.06]">
              {compact.map((product) => (
                <li key={product.slug}>
                  <CompactProductRow product={product} />
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}
