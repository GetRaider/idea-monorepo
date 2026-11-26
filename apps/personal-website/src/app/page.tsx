import Link from "next/link";

import { CompanyMarquee } from "@/components/CompanyMarquee";
import { ContactLinks } from "@/components/ContactLinks";
import { OrbitField } from "@/components/OrbitField";
import { FeaturedProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { ArrowLink, Eyebrow, SectionHeader, card, monoLabel, primaryButton, textLink } from "@/components/ui";
import { productsByTier } from "@/data/products";
import { profile, resolveMetrics } from "@/data/profile";

const aboutLabel = "text-xl font-medium tracking-tight text-silver sm:text-2xl";

export default function HomePage() {
  const metrics = resolveMetrics();
  const [featured] = productsByTier("featured");
  const { about } = profile;

  return (
    <>
      <section className="relative isolate overflow-hidden px-5 pb-10 pt-20 sm:pb-16 sm:pt-28">
        <OrbitField className="-z-20 [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_50%_40%,rgba(11,17,25,0.45),transparent_65%)]" />
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow>
            {profile.status} · {profile.location}
          </Eyebrow>
          <h1 className="mt-7 text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.05em] text-silver">
            {profile.name}
          </h1>
          <p className="mt-4 text-xl font-medium tracking-tight text-ember sm:text-2xl">{profile.title}</p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream/85 sm:text-lg">{profile.oneLiner}</p>
          <div className="mt-9 flex flex-col items-center gap-5">
            <Link href="/experience" className={primaryButton}>
              View experience
            </Link>
            <ContactLinks className="justify-center" />
          </div>
        </div>
      </section>

      <CompanyMarquee />

      <section aria-labelledby="about-title" className="px-5 py-16 sm:py-24">
        <div className="mx-auto grid max-w-page gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <SectionHeader id="about-title" eyebrow="About" title="Product and engineering, end to end." align="left" />
          </Reveal>
          <Reveal delay={100} className="space-y-5 text-[15px] leading-relaxed text-cream/90">
            <dl className="space-y-6">
              <div>
                <dt className={aboutLabel}>Summary</dt>
                <dd className="mt-1.5">{about.summary}</dd>
              </div>
              <div>
                <dt className={aboutLabel}>Stack</dt>
                <dd className="mt-1.5">{about.stack.join(", ")}</dd>
              </div>
              <div>
                <dt className={aboutLabel}>AI</dt>
                <dd className="mt-1.5">
                  {about.ai.join(", ")}.{" "}
                  <Link href={`/products/${about.aiProofSlug}`} className={textLink}>
                    See Todex
                  </Link>
                </dd>
              </div>
              <div>
                <dt className={aboutLabel}>Domains</dt>
                <dd className="mt-1.5">{about.domains.join(", ")}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {metrics.length > 0 ? (
        <section aria-labelledby="impact-title" className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-page">
            <h2 id="impact-title" className="sr-only">
              Selected impact
            </h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {metrics.map((metric, index) => (
                <Reveal as="li" key={`${metric.experienceId}-${metric.highlightIndex}`} delay={index * 90} className={`${card} flex h-full flex-col p-6`}>
                  <p className="text-5xl font-medium tracking-tight text-silver">{metric.value}</p>
                  <p className="mt-3 text-sm leading-relaxed text-cream/85">{metric.label}</p>
                  {/* Pinned bottom-left so the company sits on the same line in every card. */}
                  <p className={`${monoLabel} mt-auto pt-6`}>{metric.company}</p>
                </Reveal>
              ))}
            </ul>
            <div className="mt-6 text-center">
              <ArrowLink href="/experience">Full experience</ArrowLink>
            </div>
          </div>
        </section>
      ) : null}

      {featured ? (
        <section aria-labelledby="products-title" className="px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-page">
            <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeader
                id="products-title"
                eyebrow="Products"
                title="What I'm building."
                lead="Each one started as a problem I had myself. I solve it for me first, then for everyone who has it too."
                align="left"
              />
              <ArrowLink href="/products">All products</ArrowLink>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <FeaturedProductCard product={featured} />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Section 6 (Looking for + contact) is the footer block, which closes every page. */}
    </>
  );
}
