import { getPortfolioContactEmail } from "@/constants/contact.constant";

export type PillarIconId = "focus" | "stack" | "quality" | "collaboration";

export const profile = {
  name: "Andrew Polovets",
  title: "Product Engineer",
  location: "Remote · Anywhere in the world",
  summary:
    "Product Engineer who moves from research and analysis to execution - building robust backends, integrating polished frontends, and shipping iteratively with attention to UX, observability, and measurable outcomes.",
  badgeLabel: "OPEN TO OPPORTUNITIES",
  pillars: [
    {
      title: "Product Focus",
      icon: "focus" as const,
      body: "Shipping end-to-end features with clear scope, measurable outcomes, and tight feedback loops.",
    },
    {
      title: "Full-stack Depth",
      icon: "stack" as const,
      body: "Comfortable across TypeScript, JavaScript, Node.js, Nest.js, PostgreSQL, MongoDB, React, Next.js, and pragmatic cloud deployment.",
    },
    {
      title: "Quality Bar",
      icon: "quality" as const,
      body: "TypeScript, linted codebases, and tests where they buy the most confidence.",
    },
    {
      title: "Collaboration",
      icon: "collaboration" as const,
      body: "Clear communication, readable PRs, and focused pairing to unblock ambiguity and keep teams moving.",
    },
  ],
  email: getPortfolioContactEmail(),
  links: {
    linkedin: "https://www.linkedin.com/in/andrew-polovets/",
    github: "https://github.com/GetRaider",
  },
  employers: ["Evolved Ideas", "Spherity", "CorvaAI"],
} as const;
