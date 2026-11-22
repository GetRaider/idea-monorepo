# Todex landing page

| Field           | Value                                         |
| --------------- | --------------------------------------------- |
| Status          | Draft                                         |
| Scope           | TDX                                           |
| Apps / packages | `apps/todex-landing`, `@repo/ui`, `@repo/api` |
| Created         | 2026-10-31                                    |
| Updated         | 2026-10-31                                    |

## Sources

Read from Notion on 2026-10-31. Customer-facing sentences below are copied from these pages. Three product decisions override the pages where they disagree:

1. The only button is **Join the Waitlist**. Notion's "Get started", "Explore Todex", "View pricing", "Explore the workspace", "Start building with Todex", "Explore Todex for teams", "Start with Core", "Choose Pro", and "Talk to us" are not buttons.
2. Pricing is omitted from the header, the footer, and the sitemap. No `/pricing` route until plans are approved. Notion prices stay off the site.
3. Counters are out of scope. Do not mention them.

| Doc | URL |
| --- | --- |
| Home Page Copy | https://app.notion.com/p/40ac6069bb3381a59b75d1fae7b6448c |
| Product Page Copy | https://app.notion.com/p/40ac6069bb33814a8c61d33cd14a7aac |
| Solutions Page Copy | https://app.notion.com/p/40ac6069bb3381a49b6cf8504e4d8588 |
| Use Cases Page Copy | https://app.notion.com/p/40ac6069bb3381e9ab10da396e7b5a18 |
| Pricing Page Copy | https://app.notion.com/p/40ac6069bb3381f58a36edee9e7d9564 |
| Resources, FAQ & Messaging Guide | https://app.notion.com/p/40ac6069bb338143ad40d46e36b20f21 |
| Product Overview | https://app.notion.com/p/401c6069bb33812fa766cffbec06d68a |
| Product & Sales Pitch | https://app.notion.com/p/402c6069bb33812cbd74ff1a62d27465 |
| Pricing & Monetization Strategy | https://app.notion.com/p/408c6069bb3381c49be9f7e053c03390 |

The messaging guide says the primary CTA is "Get started", and to change it to early access until self-service onboarding exists. This PRD uses **Join the Waitlist**.

## Product overview and positioning

| Field | Text |
| --- | --- |
| Product | Todex |
| Category | AI-native Work OS |
| Tagline | Your work, actually done. |
| One line | Planning, knowledge, and execution live together in one context for humans and AI agents. |
| Wedge | Execution-first. |
| Audience | Solo founders and small teams. |
| Only button | Join the Waitlist |

Todex is not another task manager. Tasks are part of it. The site describes one workflow: decide what matters, plan, execute, and keep the outcome in the same context.

Do not write: "replaces every tool", "fully autonomous AI", "works with any AI", "unlimited AI", "proven productivity gains", or a privacy or security guarantee.

## Problem

`todex-web` is the signed-in product. There is no public site. Production signup is disabled (`disableSignUp` outside development in `apps/todex-api/src/auth.ts`), so the public action is a waitlist, not account creation.

## Goals

- Ship `apps/todex-landing` for `trytodex.com`.
- Pages and copy match this PRD.
- The only button on the site opens the waitlist dialog.
- Pricing is not linked and has no route.
- Counters are not on any page.
- Visual design matches the Todex app: black, white, silver, noise, real UI captures. No space imagery.

## Non-goals

- Counters, on the site or as a product claim.
- A Pricing nav item, including a disabled one with a tooltip.
- A `/pricing` route, empty or filled.
- Rendering Core, Pro, Team, prices, trials, or MCP quotas.
- A second button (Get started, Explore Todex, View pricing, Talk to us).
- Auth or account creation on the marketing app.
- A waitlist table in Todex Postgres.
- Editing `todex-web`. Copy the logo and screenshots into this app.
- Importing another app.
- Testimonials, user counts, or productivity numbers.
- A blog.
- Choosing the deploy host.

## Slices

Ship in this order. Pricing is in none of them. Later slices add to the previous one. Page copy further down in this PRD is the finished text. It does not all land in slice 1.

### Slice 1 — Home design

The home page layout, with no marketing sentences and no email send.

- Scaffold `apps/todex-landing` (port 3003, Tailwind, header, footer, noise, type, spacing).
- Header: logo, Sign in as a text link, and the white **Join the Waitlist** pill. No Product, Solutions, Use Cases, Pricing, or Resources items.
- Home is the eight regions in the homepage order: hero, problem, solution, four steps, five highlights, human or AI, two audience cards, closing band. Each region has a short label, not the Notion paragraph.
- A frame where the product screenshot will go. No real capture yet.
- **Join the Waitlist** opens the dialog (email field and the same pill). Submit does not call FormSubmit. It closes the dialog.
- Footer matches the header: no page links yet, brand line, the waitlist button.

### Slice 2 — Home content

- Replace the placeholder labels with the homepage copy in this PRD.
- Put `previews/home-shell.png` in the screenshot frame.
- Wire the dialog to `postFormSubmitAjax`, including the `$https` fix, validation, and the success and error strings.
- Highlight cards and audience cards stay text. They do not link to `/product` or `/use-cases` until slice 3.

### Slice 3 — Product, Solutions, Use Cases

- Add `/product`, `/solutions`, and `/use-cases` with the copy in this PRD.
- Add those three links to the header and the footer.
- Turn the home highlights into links to `/product#planning`, `#knowledge`, `#calendar`, `#execution`, and `#ai`.
- Turn the home audience cards into links to `/use-cases#solo-founders` and `#small-teams`.

### Slice 4 — Resources

- Add the Resources menu.
- Add `/docs`, `/docs/getting-started`, `/docs/ai`, `/docs/mcp`, `/docs/faq`, and `/changelog` with the copy in this PRD.
- Add Docs, MCP, and Changelog to the footer.

## Sitemap and navigation

Marketing origin: `https://trytodex.com`. Application origin: `https://todex.app`.

| Route | Page |
| --- | --- |
| `/` | Home |
| `/product` | Product |
| `/solutions` | Solutions |
| `/use-cases` | Use cases |
| `/docs` | Docs index |
| `/docs/getting-started` | Getting started |
| `/docs/ai` | Working with AI |
| `/docs/mcp` | MCP |
| `/docs/faq` | FAQ |
| `/changelog` | Changelog |

Header, left to right:

1. Mark plus the word Todex. Links to `/`.
2. Product, Solutions, Use Cases. Route links. Active route is indicated. Pricing is not in the header.
3. Resources. A menu, not a page. Items: Docs (`/docs`), Getting started, Working with AI, MCP, FAQ, Changelog.
4. Sign in. Text link, not a button, to `{APP_URL}/sign-in`.
5. **Join the Waitlist.** The only button. Opens the dialog.

Footer:

- Product: Product (`/product`), Solutions, Use Cases. Text links. Pricing is not in the footer.
- Resources: Docs, MCP, Changelog. Text links.
- Brand line: `Todex — Your work, actually done.`
- **Join the Waitlist** button.
- `© Todex`.
- Contact, Privacy, and Terms stay out until those URLs exist.

Mobile: logo, the waitlist button, and a control that opens the nav. Resources expands inside that panel. Escape closes it.

## Waitlist

Every **Join the Waitlist** button opens one dialog. Email only. No name field.

| State | Copy |
| --- | --- |
| Title | Join the Waitlist |
| Intro | Join the waitlist to hear when Todex opens. |
| Success | You're on the list. We'll email you when Todex opens. |
| Missing recipient | Waitlist email is not configured. |
| Non-200 | Could not join the waitlist. Try again later. |
| Thrown | Network error. Check your connection and try again. |

Wire body through `postFormSubmitAjax`: subject `Todex — Waitlist request`, `replyTo` and `email` are the visitor's address, message `I'd like to join the Todex waitlist.` Reject an empty or invalid email before the request. Disable the submit control while the request is in flight. Repeat submits are allowed.

Sign in is not this dialog. It is a text link to `https://todex.app/sign-in`. Unset `NEXT_PUBLIC_TODEX_APP_URL` means `http://localhost:3002/sign-in`.

## Page specifications

Screenshots are static files in `public/previews/`, captured from `todex-web`. A missing file omits the image. No stock art.

### Homepage

**Objective.** Say what Todex is and show the path from planning to execution.

**Audience.** Solo founders and small teams.

**Order and copy**

1. **Hero.** Eyebrow: `PLAN · KNOWLEDGE · EXECUTE`. H1: `Your work, actually done.` Body: `Todex is the AI-native Work OS where planning, knowledge, and execution live together. Stay focused on what matters, work alongside AI agents, and turn ideas into finished work.` Button: **Join the Waitlist**. No second button. Under the hero, `previews/home-shell.png` (signed-in shell). No heading on the image.
2. **Problem.** H2: `More tools. More planning. Not enough progress.` Body: `Your tasks live in one app. Your decisions live in another. Your calendar has the schedule, but not the full context. And every AI assistant needs another explanation.` Then: `The result? More time coordinating work, less time completing it.`
3. **Solution.** H2: `One workspace. One context. From plan to execution.` Body: `Bring your goals, tasks, knowledge, calendar, and execution into one connected workflow. Choose what matters, give it a clear time estimate, and move it forward—yourself or with AI.`
4. **How it works.**
   - `01 — Organize what matters` — `Define goals, create spaces, capture decisions, and break work into actionable tasks.`
   - `02 — Plan with intention` — `Prioritize tasks, estimate effort, and make time for what matters. Every task has an estimate, so the work starts with a clear boundary.`
   - `03 — Execute, don't just track` — `Move tasks into your execution queue. Work with a focus timer or delegate supported actions to AI agents.`
   - `04 — Keep the context` — `Connect plans, documentation, decisions, and results so your next step starts from shared context—not from scratch.`
5. **Product highlights.** Planning, Knowledge, Calendar, Execution, AI & MCP. No Counters.
   - Planning — `From goals to concrete tasks, organized in spaces built around your work.` Links to `/product#planning`.
   - Knowledge — `Keep research, requirements, notes, and decisions close to the tasks they inform.` Links to `/product#knowledge`.
   - Calendar — `Make room for priorities and connect scheduled time to actual work.` Links to `/product#calendar`.
   - Execution — `Queue the right tasks, focus on delivery, and track execution rather than collecting endless to-dos.` Links to `/product#execution`.
   - AI & MCP — `Let compatible agents access relevant, authorized Todex context through MCP. Keep humans in control of what gets changed.` Links to `/product#ai`.
6. **Human or AI.** H2: `Human or AI? Your choice.` Body: `Do the work yourself, ask AI for help, or use a connected agent for supported operations. Todex brings the planning and context together without locking your workflow to one AI provider.`
7. **Use cases.** H2: `Built for people who build.`
   - Solo founders — `Bring product, engineering, customers, and priorities into one workflow.` Links to `/use-cases#solo-founders`.
   - Small teams — `Give people and agents a shared place for tasks, decisions, and delivery.` Links to `/use-cases#small-teams`.
8. **Final CTA.** H2: `Less managing. More doing.` Body: `Turn your work into progress with Todex.` Button: **Join the Waitlist**. Do not add "View pricing".

**SEO.** Title: `Todex — Your Work, Actually Done | AI-Native Work OS`. Description: `Todex connects planning, knowledge, calendar, and execution in one AI-native workspace for solo founders and small teams. Less managing, more doing.`

**Acceptance criteria**

- [ ] Sections are in the order above.
- [ ] Hero strings match this page, including the eyebrow.
- [ ] The only buttons are Join the Waitlist.
- [ ] Five highlights. No Counters highlight.
- [ ] Two audience cards, linked to the use-case anchors.
- [ ] The preview is a Todex UI capture.

### Product

**Objective.** Explain the connected workflow. Counters are not a section.

**Audience.** Someone who opened Product.

**Copy**

1. H1: `One workspace. From goals to execution.` Deck: `Todex connects the work you plan, the knowledge you need, and the actions you take—so nothing important gets lost between tools.` No "Explore the workspace" button.
2. H2: `Your connected workflow.`
   - `#planning` Planning — `Start with goals. Organize work into spaces, epics, and tasks. Set priorities and estimate effort before you begin.` Image: `previews/planning.png`.
   - `#knowledge` Knowledge — `Write down research, decisions, requirements, and ideas. Keep them available as context for ongoing work.` Image: `previews/knowledge.png`.
   - `#calendar` Calendar — `Connect priorities to your schedule and plan when work should happen.` Do not claim it replaces Google Calendar. Image: `previews/calendar.png`.
   - `#execution` Execution — `Select tasks, build a queue, and start a focused session. Follow progress from intention to completion.` Image: `previews/execution.png`.
3. H2: `Made for execution.`
   - H3: `An estimate gives work a boundary.` Body: `Every task requires an effort estimate. Planning isn't the destination; it's the starting point for getting work done.`
   - H3: `One context for humans and AI agents.` Body: `Your goals, tasks, and knowledge form a shared work model. Compatible external AI agents can retrieve relevant context through MCP, subject to authorization.`
   - H3: `Stay in control.` Body: `Human execution always remains an option. AI write operations should require explicit approval; available integrations and actions depend on the connected client.` This is a requirement, not a claim that the approval gate is already a production guarantee.
4. Close. H2: `Plan less in circles. Finish more of what matters.` Button: **Join the Waitlist**.

**SEO.** Title: `Product | Todex — A Connected Work OS`. Description: `Explore how Todex brings goals, planning, knowledge, calendar, execution, and AI context into one connected workflow.`

**Acceptance criteria**

- [ ] Anchors exist for planning, knowledge, calendar, execution, and ai.
- [ ] The word Counters does not appear.
- [ ] The only button is Join the Waitlist.
- [ ] "Stay in control" is not rewritten into "AI can never write without approval" as a guarantee.

### Solutions

**Objective.** Problems and outcomes, not a feature list.

**Copy**

1. H1: `Less friction between plans and results.` Deck: `Todex solves the disconnect between what you intend to do, what you know, and what actually gets done.`
2. Fragmented work. H2: `Stop piecing your work together.` Body: `Goals, tasks, documents, schedules, and execution all belong to the same workflow. Keep relevant information connected without repeatedly reconstructing context.` Outcome: `Less switching and less manual coordination.`
3. Endless planning. H2: `Turn your plans into action.` Body: `Move from priorities to estimated tasks, then into a deliberate execution queue. Focus on doing the work—not continually rearranging it.` Outcome: `A clearer next step and a repeatable execution rhythm.`
4. AI without context. H2: `Give agents the information behind the task.` Body: `Let compatible AI agents access authorized tasks and relevant knowledge through Todex MCP instead of relying on manually pasted instructions for every session.` Outcome: `Fewer repeated explanations and more context-aware collaboration.`
5. Unclear progress. H2: `Know what moved forward.` Body: `Connect completed work to goals, execution history, and measurable outcomes. Use what you learn to improve the next plan.` Outcome: `Progress defined by delivered results, not activity alone.` Do not add a Counters UI or the word Counters.
6. Rigid AI workflows. H2: `Work your way.` Body: `Execute tasks manually, use Todex AI where available, or connect supported external agents. The workspace remains useful without buying built-in AI.` Outcome: `Flexibility without losing the shared context.` "Where available" stays in the sentence.
7. Close. H2: `One connected path from intention to completion.` Button: **Join the Waitlist**.

**SEO.** Title: `Solutions | Todex — From Planning to Execution`. Description: `Reduce scattered work, endless planning, and repeated AI context handoffs with Todex's connected work and execution system.`

**Acceptance criteria**

- [ ] Five problems, in that order, each with its outcome line.
- [ ] No feature grid, no prices, no Counters.
- [ ] The only button is Join the Waitlist.

### Use cases

**Objective.** An example workflow for each audience. These are illustrations, not testimonials and not proof that a named client integration is generally available.

**Copy**

1. H1: `Built for people with work to get done.` Deck: `From your first product idea to your next launch, Todex connects priorities, knowledge, and execution.`
2. `#solo-founders`. H2: `Build your company without losing the thread.` Body: `Your product roadmap, customer insights, engineering tasks, and personal priorities compete for attention. Use spaces to organize work, Knowledge to preserve decisions, and Execution to focus on the next meaningful outcome.` Example: `Capture a customer insight → draft requirements → create estimated tasks → execute with Cursor using relevant Todex context → review results.`
3. `#small-teams`. H2: `Keep the plan and the work in sync.` Body: `Make goals, task definitions, decisions, and deliverables visible in one connected workspace. Let team members execute work while compatible agents retrieve the relevant context.` Example: `Agree on an objective → organize tasks and requirements → assign the work → execute and review completed deliverables.` Do not add invites, roles, or SSO. Those are not a shipped screen.
4. `#ai-assisted-builders`. H2: `Keep your agents connected to the source.` Body: `Use Todex as a structured context layer for compatible tools such as Cursor or Claude-based agents. Retrieve tasks and docs, perform authorized updates, and keep the resulting knowledge connected to the work.` Example: `Select an implementation task → retrieve its context via MCP → implement externally → review and record the outcome.` "Explore MCP" is a text link to `/docs/mcp`, not a button.
5. Close. H2: `Whatever you're building, keep moving.` Button: **Join the Waitlist**.

**SEO.** Title: `Use Cases | Todex for Founders, Teams & AI Builders`. Description: `Discover connected planning, knowledge, and execution workflows for solo founders, small product teams, and AI-assisted builders.`

**Acceptance criteria**

- [ ] Three sections, those anchors, example lines unchanged.
- [ ] No quotes, logos, or outcome metrics.
- [ ] The only button is Join the Waitlist. MCP is a text link.

### Pricing

Not in this version. No header item, no footer item, no disabled control, no tooltip, and no `/pricing` route. A direct hit on `/pricing` is the normal not-found page. The Notion pricing page and the monetization strategy were read and are not rendered. Add the link only after plans are approved and written into this PRD.

**Acceptance criteria**

- [ ] Header and footer have no Pricing link and no disabled Pricing control.
- [ ] `/pricing` is not a page. It uses the not-found page.

### Resources

Resources is a menu. `/docs` is the index.

**Index.** H1: `Learn Todex. Build with context.` Deck: `Practical guidance for organizing work, executing with focus, and connecting compatible AI tools.` Four text links:

- Getting started — `Create your first space, define a goal, organize tasks, and plan your first execution session.` → `/docs/getting-started`
- Working with AI — `Understand what Todex AI can read, when approval is required, and how to review outputs.` → `/docs/ai`
- MCP documentation — `Connect compatible external AI tools to your authorized Todex tasks and knowledge.` → `/docs/mcp`
- Changelog — `See new capabilities, improvements, and integrations as they ship.` → `/changelog`

**Getting started, Working with AI, MCP.** Each page shows its title and the one sentence above. Do not invent steps. MCP must not list clients beyond the FAQ answer.

**FAQ.** H1: `FAQ`.

| Question | Answer |
| --- | --- |
| What is Todex? | Todex is an AI-native Work OS where planning, knowledge, calendar, and execution share one connected context. |
| Is Todex another task manager? | Tasks are part of Todex, but the product focuses on the entire process: decide what matters, plan, execute, and capture outcomes. |
| Can I work without AI? | Yes. Todex is designed to support human-first workflows alongside AI-assisted ones. |
| Why does every task need an estimate? | An estimate creates a deliberate time boundary and gives you a starting point for reviewing planned versus actual effort. It is not a promise that every estimate will be exact. |
| Is Todex only for startups? | No. Solo founders and small teams are the initial audience, but the work model is intended for anyone managing complex responsibilities. |
| Will AI modify my workspace without permission? | The planned AI model requires approval for writes. This is not a production guarantee. |
| Is my detailed execution history visible to my team? | The intended privacy model keeps individual sessions and detailed time records private by default. This is not a production guarantee. |
| Can I connect Cursor, Claude, or ChatGPT? | Todex is designed for compatible external agents using MCP. Actual availability depends on each client, its connector support, authentication, and permissions. |
| Does MCP execute work automatically? | No. MCP exposes authorized tools and context. A connected agent must initiate and perform supported operations. |

Do not publish the pricing FAQ (free trial, charge per MCP call, "are prices final"). Those answers describe unapproved packages.

**Changelog.** Empty state: `No public updates yet.`

**SEO.** `{Page} · Todex` for each docs route. Changelog description: `Updates to Todex.` Other descriptions are the one sentence for that page. FAQ description: `Answers about Todex, AI, and MCP.`

**Acceptance criteria**

- [ ] Resources opens the six menu items. There is no `/resources` route.
- [ ] Guide pages contain the one sentence and no invented procedure.
- [ ] The two permission and privacy answers include "not a production guarantee".
- [ ] Changelog shows the empty state.
- [ ] No price FAQ.

## Visual design

Match the app. Notion design note: monochrome black, white, and silver; restrained metallic gradient; subtle particle dust; fine-grain noise on dark surfaces and on the white primary button; actual product UI; no abstract space imagery.

| Rule | Detail |
| --- | --- |
| Type | Inter, same family as `apps/todex-web`. Large headings, generous space. |
| Button | One style: white pill, dark label, light noise. Label is always **Join the Waitlist**. |
| Sign in | Text link. Not a pill. |
| Chrome | Subtle borders, shadows, controlled silver glow. |
| Logo | Copy `apps/todex-web/public/todex-mark.png`. Word "Todex" is text. Do not use `todex-logo-silver.svg`. |
| Motion | No dust animation and no transition longer than a color change when `prefers-reduced-motion: reduce`. |
| Noise | Small repeating image or SVG filter. No particle library. |

## Responsive and accessibility

| Viewport | Behavior |
| --- | --- |
| Under 768px | One column. Nav collapses. Previews fit the column and sit below the hero button. |
| 768px to 1023px | Links may wrap. Previews stay inside the viewport. |
| 1024px and up | Full header. Content max width 1120px. The preview does not cover the hero text. |

- Silver body text must meet WCAG AA on black.
- Visible focus ring on every control.
- Resources and the mobile nav are buttons, close on Escape, and trap focus.
- Image alt text names the surface (`Todex planning view`).
- One `h1` per page.

## SEO

Canonical origin `https://trytodex.com` plus the path. `og:title` and `og:description` match the page. `og:image` is the mark on black until a share image exists. No `noindex`. No prices in metadata.

## Analytics

When `NEXT_PUBLIC_MIXPANEL_TOKEN` is unset, tracking is a no-op. No second vendor. Do not send the email address.

| Event | When | Properties |
| --- | --- | --- |
| `Page Viewed` | route render | `path` |
| `Waitlist Opened` | dialog opens | `path` |
| `Waitlist Submitted` | HTTP 200 | `path` |
| `Waitlist Failed` | validation, missing recipient, non-200, or throw | `path`, `reason` |
| `Sign In Clicked` | sign-in link | `path` |
| `Nav Clicked` | header, footer, or Resources | `path`, `target` |

## Launch readiness

"In the repo" is not end-to-end sign-off.

| Capability | Label | Site rule |
| --- | --- | --- |
| Planning, Knowledge, Calendar, Execution | In the repo, not launch-verified | Use the page copy. No SLA. Calendar does not "replace Google Calendar". |
| In-app agent and MCP tokens | In the repo, not launch-verified | Say compatible and authorized. Do not say any client, autonomous completion, or unlimited use. |
| AI write approval | Planned | FAQ says it is not a production guarantee. |
| Execution-history privacy | Intended, not validated | FAQ says it is not a production guarantee. |
| Counters | Out of scope | Absent from the site. |
| Team invites, roles, billing | Not a shipped screen | Use-case copy may say small teams. It must not say roles, SSO, or shared billing. |
| Prices | Unapproved | No Pricing link and no pricing page. |
| Public signup | Disabled outside development | Waitlist button. Sign in is only a link. |

## Functional requirements

1. The sitemap routes exist. Unknown paths use a not-found page with a link home and the waitlist button.
2. Join the Waitlist is the only `button` that submits or navigates, except the menu buttons, dialog close, and the email submit inside the dialog (label **Join the Waitlist**).
3. Sign in, nav, footer, and "Explore MCP" are links.
4. Copy matches this PRD. Counters and plan names do not appear.
5. Pricing is absent from the header, the footer, and the route table.
6. Changelog empty state is `No public updates yet.`
7. Reduced motion and focus rules hold on every page.

## Technical requirements

### Architecture

- **App:** `apps/todex-landing`, package `todex-landing`. Public. No auth.
- **Depends on:** `@repo/ui`, `@repo/api`. `transpilePackages: ["@repo/ui", "@repo/api"]`.
- **Scaffold from:** `apps/personal-website` (App Router, Tailwind, ESLint `next/core-web-vitals` and `next/typescript`, tsconfig `@repo/typescript-config/nextjs.json`, `@/`* → `./src/*`). Do not copy its pages.
- **Port:** `3003`. `todex-web` stays on `3002`.
- **Root script:** `dev:todex-landing` = `turbo run dev --filter=todex-landing --filter=@repo/ui --filter=@repo/api`.
- **Reuse:** `Dialog` from `@repo/ui`. `postFormSubmitAjax` from `@repo/api/helpers`. Logo copied from `todex-web`. Inter.
- **Modules:**
  - `src/app/layout.tsx`, `globals.css`, `not-found.tsx`, `page.tsx`
  - `src/app/product/page.tsx`, `solutions/page.tsx`, `use-cases/page.tsx`
  - `src/app/docs/page.tsx`, `docs/getting-started/page.tsx`, `docs/ai/page.tsx`, `docs/mcp/page.tsx`, `docs/faq/page.tsx`
  - `src/app/changelog/page.tsx`
  - `src/components/site-header.tsx`, `site-footer.tsx`, `resources-menu.tsx`, `waitlist-dialog.tsx`
  - `src/content/` for the strings in this PRD
  - `src/lib/waitlist.ts`, `waitlist.test.ts`, `app-url.ts`, `analytics.ts`, `analytics.test.ts`
  - `public/todex-mark.png`, `public/noise.png`, `public/previews/*.png`
- **Import boundaries:** `@repo/ui` and `@repo/api` only.
- **Scope docs:** add `apps/todex-landing` under TDX in `.cursor/rules/monorepo-architecture.mdc` and `.cursor/rules/git-conventions.mdc`.

### Data layer

None. Changelog starts empty. Waitlist mail goes to FormSubmit, not Postgres.

### API and contracts

No landing API. Fix the `$https://` prefix in `packages/api/src/helpers/form-submit.helper.ts` so the URL is `https://formsubmit.co/ajax/<recipient>`. Callers in Take & Do stay as they are aside from that fix.

Validate email: trim, one `@`, non-empty local part, domain contains a dot.

### Frontend

Server Components for pages. Header, menu, and dialog are client islands. One parent holds dialog open state so every waitlist button shares it. No React Query. Tailwind on the JSX. No styled-components. No `style={{}}` except a CSS variable Tailwind cannot express.

### Auth and permissions

Public. No session on the marketing site.

### Error handling

Listed in the waitlist table. Analytics errors are swallowed. A missing preview omits the image.

### Testing

- **Unit:** missing recipient does not call `postFormSubmitAjax`. A valid email posts subject, `replyTo`, `email`, and the default message. App URL unset → `http://localhost:3002/sign-in`. Analytics is a no-op without the token.
- **E2E:** none.
- **Manual:** every route at 390px, 768px, and 1280px. Keyboard through Resources. Reduced motion. Header and footer have no Pricing item. `/pricing` is the not-found page. Waitlist dialog from the header and the homepage close. Sign-in href.

### Deployment and ops

- `NEXT_PUBLIC_TODEX_APP_URL` — app origin, no trailing slash. Production `https://todex.app`.
- `NEXT_PUBLIC_SITE_URL` — `https://trytodex.com`.
- `NEXT_PUBLIC_WAITLIST_CONTACT_EMAIL` — FormSubmit recipient. Not committed.
- `NEXT_PUBLIC_MIXPANEL_TOKEN` — optional.
- Add all four to `turbo.json` `globalEnv`.
- `pnpm dev:todex-landing`. `pnpm --filter todex-landing lint`, `test`, `build`.
- This PRD does not pick the Vercel project or DNS.

## Dependencies and risks

- FormSubmit must be activated for the recipient inbox. Until the env var is set, the dialog shows the configuration error.
- The `$https` prefix drops submissions until it is removed.
- Screenshots drift from `todex-web`. Replace the file. Do not embed the app.
- Notion still has prices and a Counters section. This PRD is the site contract. Those sections do not ship.
- Naming Cursor or Claude in an example workflow can be read as a guarantee. The sentences stay qualified. Do not add "supported today" or a logo row.

## Open questions

- [ ] Which inbox receives waitlist mail. Set it in `.env.local`. Do not put it in this PRD.
- [ ] Contact, Privacy, and Terms URLs.
- [ ] `og:image` beyond the mark.
- [ ] Deploy project for `trytodex.com`.
- [ ] When signup is enabled, whether the waitlist button becomes a sign-in link. Until then it stays the waitlist.

## Success criteria

Slice 1 is done when the home layout, header, footer, and dialog match [Slice 1](#slice-1--home-design), the dialog does not send email, and `pnpm --filter todex-landing lint` and `build` pass.

Slice 2 is done when the home copy and screenshot match this PRD and a configured recipient gets one FormSubmit mail per successful submit.

Slice 3 is done when `/product`, `/solutions`, and `/use-cases` are linked from the header and use the copy in this PRD.

Slice 4 is done when Resources, the docs routes, FAQ, and changelog match this PRD.

Across every slice: Pricing is absent, no page says Counters or shows a price, and the only pill button is **Join the Waitlist**.

## Implementation checklist

Slice 1

- [ ] Scaffold `apps/todex-landing` on port 3003. Root script. Add the app to the TDX scope rules.
- [ ] Header, footer, eight home regions with labels, screenshot frame, waitlist dialog that closes on submit.
- [ ] Check viewports. The only pill button is the waitlist. No other nav items.

Slice 2

- [ ] Replace labels with the homepage copy. Add `previews/home-shell.png`.
- [ ] Fix the `$https` prefix. Wire FormSubmit, validation, and `waitlist.test.ts`.
- [ ] Leave highlight and audience blocks unlinked.

Slice 3

- [ ] Product, Solutions, and Use Cases pages.
- [ ] Header and footer links. Home links to the product and use-case anchors.

Slice 4

- [ ] Resources menu, docs pages, FAQ, changelog empty state.
- [ ] Footer links for Docs, MCP, and Changelog.
- [ ] `pnpm --filter todex-landing test`, `lint`, and `build`.
