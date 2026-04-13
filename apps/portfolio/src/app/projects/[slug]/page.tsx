import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectBrandMark } from "@/components/ProjectBrandMark";
import { SectionRichText } from "@/components/SectionRichText";
import { getProjectBySlug, projects } from "@/content/projects";
import {
  getProjectBrandImage,
  getProjectRasterMatteClass,
} from "@/lib/project-brand-src";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const prodRestricted =
    project.prodUrl === null
      ? (project.prodRestrictedLabel ?? "Production access restricted")
      : null;

  const brandImage = getProjectBrandImage(project.slug);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24 pt-10">
      <Link
        href="/projects"
        className="inline-flex text-sm text-zinc-500 transition-colors hover:text-cyan-300/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400/70"
      >
        ← All projects
      </Link>

      <article className="mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-[var(--surface-glass)] shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl">
        <div className="relative border-b border-white/[0.06] px-8 py-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative">
            <div className="mb-5 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-scan-line bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent" />
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              {brandImage ? (
                <div className="flex shrink-0 justify-center sm:justify-start">
                  <ProjectBrandMark
                    src={brandImage}
                    variant="detail"
                    matteSurfaceClass={getProjectRasterMatteClass(project.slug)}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h1 className="m-0 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  <span className="text-white">{project.title}</span>
                  <span className="font-normal text-zinc-400">
                    {" "}
                    — {project.tagline}
                  </span>
                </h1>
                <p className="mt-5 text-sm leading-relaxed text-zinc-500">
                  {project.summary}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {project.prodUrl ? (
                <a
                  href={project.prodUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_-8px_rgba(99,102,241,0.75)] transition-[transform,box-shadow] hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300/80"
                >
                  Open production
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-full border border-white/10 bg-zinc-900/80 px-6 py-2.5 text-sm font-medium text-zinc-500"
                  title={prodRestricted ?? undefined}
                >
                  {prodRestricted}
                </button>
              )}
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-white/15 bg-black/30 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300/80"
              >
                Repository
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-10 px-8 py-10">
          <section>
            <h2 className="m-0 text-m pb-2 font-semibold uppercase tracking-[0.2em] text-violet-300/85">
              Why
            </h2>
            <SectionRichText body={project.why} />
          </section>
          <section>
            <h2 className="m-0 text-m pb-2 font-semibold uppercase tracking-[0.2em] text-violet-300/85">
              How
            </h2>
            <SectionRichText body={project.how} />
          </section>
          <section>
            <h2 className="m-0 text-m pb-2 font-semibold uppercase tracking-[0.2em] text-violet-300/85">
              Product requirements
            </h2>
            <SectionRichText body={project.productRequirements} />
          </section>
          <section>
            <h2 className="m-0 text-m pb-2 font-semibold uppercase tracking-[0.2em] text-violet-300/85">
              Analytics & measurement
            </h2>
            <SectionRichText body={project.analytics} />
          </section>
        </div>
      </article>
    </main>
  );
}
