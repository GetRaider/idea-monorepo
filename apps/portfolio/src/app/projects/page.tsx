import Link from "next/link";

import { ProjectBrandMark } from "@/components/ProjectBrandMark";
import { projects } from "@/content/projects";
import {
  getProjectBrandImage,
  getProjectRasterMatteClass,
} from "@/lib/project-brand-src";

export default function ProjectsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 inline-flex rounded-full border border-cyan-400/25 bg-cyan-950/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/85">
          Selected work
        </p>
        <h1 className="m-0 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          Projects
        </h1>
        <p className="mt-4 text-zinc-400">
          Deep dives on motivation, implementation, and requirements of all
          projects.
        </p>
      </div>

      <ul className="mx-auto mt-16 grid max-w-5xl list-none gap-8 p-0 sm:grid-cols-1 md:grid-cols-2">
        {projects.map((project) => {
          const brandImage = getProjectBrandImage(project.slug);
          return (
            <li key={project.slug}>
              <Link
                href={`/projects/${project.slug}`}
                className="group relative block h-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[var(--surface-glass)] p-8 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-xl transition-[border-color,transform] hover:-translate-y-0.5 hover:border-cyan-400/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400/70"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="relative">
                  <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-1/3 animate-scan-line rounded-full bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent" />
                  </div>
                  <div className="mb-4 flex items-center gap-4">
                    {brandImage ? (
                      <ProjectBrandMark
                        src={brandImage}
                        variant="card"
                        matteSurfaceClass={getProjectRasterMatteClass(
                          project.slug,
                        )}
                      />
                    ) : null}
                    <h2 className="m-0 text-xl font-semibold text-white group-hover:text-cyan-100">
                      {project.title}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {project.tagline}
                  </p>
                  <p className="mt-4 text-sm font-semibold tracking-tight text-violet-300/90">
                    View Case Study →
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
