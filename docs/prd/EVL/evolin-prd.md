# Evolin — Product Requirements Document (MVP)

Status: Draft v0.2 · Last updated: 2026-11-25
Repository: `idea-monorepo` (`apps/evolin`, `apps/evolin-api`, `packages/evolin-shared`)

## 0. How to use this document (for spec generation)

This PRD is the input for technical specifications written in the Execution AI. Every statement carries one of four tags. Treat them differently:

- **[Decided]**: confirmed by the product owner. Specs must follow it.
- **[Assumption]**: a default chosen to make the spec writable. Use it, but list it in the spec's "Assumptions to confirm" section. Do not bake it irreversibly into the data contract.
- **[Open]**: undecided. Do not invent an answer. Spec the surrounding behaviour so that either outcome fits, or stop and ask.
- **[Deferred]**: discussed and explicitly postponed. Out of scope; do not design for it beyond avoiding a dead end.

Requirement IDs (`FR-n`, `NFR-n`) are stable; reference them in specs, tickets and tests.

The earlier MVP PRD (9 Nov, Draft) is superseded where this document differs. Its proposed defaults were never confirmed product decisions.

## 1. Product

**Definition [Decided].** Evolin is a habit formation product that helps people turn intentional actions into sustainable, automatic behaviors. The app is positioned as **habit establishment**, not habit tracking.

**Core thesis [Decided].** Build the habit. Keep the change. Tracking is temporary: a person establishes a habit and stops needing the app for it.

**Problem [Decided].** Traditional trackers record activity instead of building behavior. They encourage permanent tracking, lean on streaks, punish missed days, and allow too many habits at once.

**How Evolin differs [Decided].**
- Capacity is limited per life area, so people start few habits at a time.
- Each habit has explicit criteria for what counts as done and for when it is established.
- A habit leaves daily tracking when it is established.
- Skipping is allowed, but needs a reason.

**Users [Assumption].** One individual adult, personal health and productivity habits, web first. No accounts in the MVP.

**Business context [Open].** ICP, pricing, monetization and validated market differentiation are unresolved. Not needed for MVP specs.

## 2. Principles

Each principle constrains design and logic. If a requirement conflicts with one, the requirement needs a decision, not a silent compromise.

1. Establish habits rather than track them forever.
2. Focus on a small number of active habits.
3. The minimum action must be realistic and repeatable.
4. Triggers connect behavior to existing routines or reliable cues.
5. Missed days do not reset progress.
6. Skipped and unmarked days are not failures.
7. Adapt the plan when execution is difficult.
8. Consistency is not proof of automaticity.
9. Established means sustainable behavior, not just a day count.
10. Established habits stay part of the user's life even when they leave daily tracking.

**Known tension [Decided to accept for MVP].** Principles 8 and 9 conflict with the MVP rule in §5.3 (90% over a month), which measures consistency only. The MVP accepts this knowingly. See §10 for the deferred automaticity check.

**Known tension with principle 6.** The status `failed` exists and is set explicitly by the user. Principle 6 is read as: *unmarked* and *skipped* checkpoints are not failures. What happens to unmarked checkpoints at day end is **[Open]** (§11, Q3).

**Change from the earlier PRD [Decided].** Streaks are no longer excluded. They are allowed as a secondary motivator only, and must never be the primary measure of progress or the basis for establishing a habit.

## 3. Scope

### In scope for MVP [Decided]
- One individual user (no authentication).
- Today screen: daily check-in across habits.
- Board screen: Backlog, Establishing, Established.
- Create and edit habit; habit detail.
- Check-in sheet: set a checkpoint's status, with a required reason for skip.
- Life areas with a per-area limit on habits being established.
- Practice history retained.
- Streak shown as a secondary indicator.
- Rule-based transition to Established (§5.3).

### Out of scope for MVP [Decided]
Authentication · onboarding · habit templates and Discover · analytics dashboards · notifications and reminders · AI features · social and community · native mobile apps · offline support · cloud deployment and hosting · CI · monitoring · Zustand.

### Deferred [Deferred]
- Automaticity verification before a habit is established (a short self-report plus a trial period without tracking). Discussed 25 Nov; owner chose not to do it now.
- Paused state. The owner described three statuses (Backlog, Establishing, Established); Paused appears in older notes. Treat as removed unless reinstated (§11, Q6).

## 4. Domain model

Logical model. Field names are indicative; the data contract is specified separately in `packages/evolin-shared` (Zod).

### 4.1 Terms

| Term | Meaning |
|---|---|
| Life area | A category of life a habit belongs to (e.g. Health, Fitness, Mind, Work). Capacity is limited per area. |
| Habit | A small repeatable action tied to a trigger, with criteria for done and for established. |
| Checkpoint | One required occurrence of a habit within a day. A habit has 1..N checkpoints per day (water: 3). |
| Check-in | The user's recorded outcome for one checkpoint on one date. |
| Status (of a check-in) | `completed`, `failed`, `skipped`. |
| Acceptance criteria | What makes a single checkpoint count as completed. |
| Success criteria | What makes the habit established. MVP rule in §5.3. |
| Slot | One unit of per-area capacity for habits in Establishing. |

### 4.2 Entities

**LifeArea** `[Assumption: fixed seed list, user-defined areas are Open (Q5)]`
- `id`, `name`
- `slotLimit` (default 2, **[Assumption]**, see Q5)

**Habit** `[Assumption: merges the rich model and the 9 Nov simplified model, pending reconciliation (Q8)]`
- `id`, `lifeAreaId`
- `name` (the action)
- `why` (personal reason)
- `trigger` (free text: time- or routine-based cue)
- `acceptanceCriteria` (free text: what counts as done for one checkpoint)
- `checkpointsPerDay` (integer ≥ 1) and optional `checkpointLabels`
- `weekdays` (days on which the habit is scheduled)
- `status`: `backlog | establishing | established`
- `establishingStartedAt`, `establishedAt` (nullable)
- timestamps

**CheckIn**
- `id`, `habitId`
- `date` (user's local calendar date)
- `checkpointIndex` (0-based, < `checkpointsPerDay`)
- `status`: `completed | failed | skipped`
- `skipReason` (required iff `status = skipped`; one of a preset list plus optional note)
- `note` (optional)
- timestamps
- Uniqueness: one check-in per `(habitId, date, checkpointIndex)`.
- A checkpoint with no CheckIn is **open** (unmarked).

**Derived values** (computed, not stored as the source of truth)
- `completionRate(habit)`, see §5.3.
- `streak(habit)`, see §5.4.
- Counts per status over a window.

### 4.3 Habit lifecycle

| From | To | Trigger | Condition |
|---|---|---|---|
| Backlog | Establishing | User action ("Start establishing") | The habit's life area has a free slot. |
| Establishing | Established | System, on rule being met | §5.3. |
| Establishing | Backlog | User action | **[Open]** whether allowed and what happens to history (Q6). |
| Established | (any) | — | **[Open]** whether a habit can be re-opened (Q7). |

Rules:
- **[Decided]** Established habits leave the daily Today list. Their history is retained.
- **[Assumption]** An Established habit no longer occupies a slot.
- **[Decided]** Habits are never deleted by the lifecycle itself. Delete or archive as a user action is **[Open]**.

## 5. Behaviour rules

### 5.1 Life-area slot limit [Decided; number is Assumption]
The number of habits in Establishing is limited **per life area**, not globally. Starting a habit in a full area is blocked, and the UI says why. The limit value (default 2) and whether any global cap still applies are **[Open]** (Q5). The earlier global cap of 3 is treated as replaced.

### 5.2 Checkpoints and check-ins [Decided]
- A habit has one or more checkpoints per day. Each is marked independently.
- Each checkpoint status is `completed`, `failed` or `skipped`.
- `skipped` requires a skip reason. Saving without one is not possible.
- A checkpoint counts as `completed` only if it meets the habit's acceptance criteria. The app records the user's judgment; it does not verify the action.
- A status can be changed after being set. Editing days other than today is **[Open]** (Q1).

**[Assumption]** Preset skip reasons: Sick, Travel, Day off, Too busy, Other, plus an optional free-text note.

### 5.3 Establishing rule (MVP) [Decided as provisional]
A habit becomes **Established** when, over the last 30 days of its establishing period, **at least 90%** of checkpoints are completed.

Provisional details, all **[Assumption]** unless noted:
- `completionRate = completed / (completed + failed)` over the window. Skipped checkpoints are excluded from the denominator (consistent with principle 6).
- The window is the last 30 days and requires the habit to have been Establishing for at least 30 days.
- The check runs when a check-in is written (or once per day). The transition is automatic, with no confirmation step.
- `establishedAt` is set at transition.

**Known weakness [Open, Q2].** Because skipped checkpoints are excluded, a user can reach 100% with very few completions (1 completed, 29 skipped). The rule needs a minimum number of completed checkpoints or a cap on the share of skipped ones. Until decided, specs must make the formula easy to change (single function, no duplicated logic in the client).

The threshold and window are owner-adjustable parameters, not constants scattered through code.

### 5.4 Streak [Decided as secondary; definition Assumption]
- Shown as a small, low-emphasis indicator. It is never used to decide establishment and never drives UI emphasis.
- **[Assumption]** A scheduled day extends the streak when all its checkpoints are `completed`. A day with any `failed` checkpoint ends it. `skipped` neither extends nor breaks it. Days not scheduled are ignored. Whether "all" or "any" checkpoint counts for multi-checkpoint habits is **[Open]** (Q4).
- Missed days do not reset overall progress (principle 5). The streak is the only thing that can drop to zero.

### 5.5 Day boundary [Open]
The calendar day is the user's local date. Time zone handling, the cut-off hour for "today", and treatment of unmarked checkpoints at day end are not decided (Q1, Q3). Specs must keep date logic in one place.

## 6. Screens

Reference design: the canvas "Evolin UI" with three artboards: **Today**, **Board**, **Check-in sheet**. Wireframe-level; no design system yet. Visual rules that are requirements:
- Status is never conveyed by colour alone: icon plus colour (check, cross, double chevron, empty).
- Touch targets are at least 44 px.
- Text contrast meets WCAG AA.

### 6.1 Today
Purpose: do the day's check-ins quickly.
- Lists habits in Establishing that are scheduled today, grouped by life area. Each group shows slot usage ("2 of 2 slots used").
- Per habit: name, trigger, "Counts as done" (acceptance criteria), streak chip (secondary), and a row of checkpoint cells.
- Cell states: open, completed, failed, skipped. A skipped checkpoint shows its reason.
- A summary line counts done, failed, skipped, open.
- Tapping a cell opens the Check-in sheet (§6.3).
- Established and Backlog habits do not appear.

### 6.2 Board
Purpose: see where each habit is in its life and manage capacity.
- Three columns: **Backlog**, **Establishing**, **Established**, with counts.
- A capacity strip shows slots used per life area and marks full areas.
- Backlog card: name, area, why, and **Start establishing**. If the area is full, the action is disabled with an explanation.
- Establishing card: name, area, trigger, day N of 30, completion rate against the 90% target (marker on the bar), and counts of done, failed, skipped.
- Established card: name, area, date established, rate over the establishing window, "history kept".
- Moving by drag and drop is **[Open]**. The wireframe uses the button only.

### 6.3 Check-in sheet
- Shows habit, life area, checkpoint (n of N) and the acceptance criteria.
- Status choice: completed, failed, skipped.
- When skipped is chosen: reason is required (preset chips) plus an optional note; **Save is disabled** until a reason is chosen, with an inline message.
- Cancel discards the change.

### 6.4 Create/edit habit and habit detail [Assumption: layout not yet designed]
Fields per §4.2. Detail shows the habit definition and its practice history. Editing a habit that already has check-ins must not rewrite history (what happens to old check-ins if `checkpointsPerDay` changes is **[Open]**, Q8).

## 7. Functional requirements

| ID | Requirement | Tag |
|---|---|---|
| FR-1 | The user can create a habit with name, life area, why, trigger, acceptance criteria, checkpoints per day and weekdays. New habits start in Backlog. | Assumption (fields) |
| FR-2 | The user can edit a habit's definition. | Decided |
| FR-3 | The user can start establishing a Backlog habit only if its life area has a free slot; otherwise the action is blocked with a reason. | Decided |
| FR-4 | The Today screen lists Establishing habits scheduled for today, grouped by life area. | Decided |
| FR-5 | The user can set each checkpoint's status to completed, failed or skipped. | Decided |
| FR-6 | A skipped status cannot be saved without a skip reason. | Decided |
| FR-7 | A habit may have multiple checkpoints per day, each recorded independently. | Decided |
| FR-8 | A status can be changed after being set (today). | Assumption |
| FR-9 | Check-in history is retained for every habit regardless of status. | Decided |
| FR-10 | A streak is computed and displayed as a secondary indicator. | Decided |
| FR-11 | Completion rate is computed per §5.3 and shown on Establishing cards against the target. | Decided (formula Assumption) |
| FR-12 | When §5.3 is met, the habit transitions to Established automatically and leaves the Today list. | Decided (rule provisional) |
| FR-13 | The Board shows habits in three columns by status, with per-area slot usage. | Decided |
| FR-14 | Established habits are visible on the Board with their establishment date and rate. | Assumption |
| FR-15 | The slot limit per area is configurable in one place. | Assumption |
| FR-16 | The success rule parameters (threshold, window, minimums) are configurable in one place. | Assumption |

### Acceptance criteria (key flows)

**FR-3 Start establishing**
- Given an area with 2 of 2 slots used, when the user views a Backlog habit in that area, then the start action is disabled and states the area is full.
- Given an area with a free slot, when the user starts a Backlog habit, then it moves to Establishing and the area's slot usage increases by one.

**FR-6 Skip reason**
- Given the Check-in sheet with status skipped and no reason chosen, then Save is disabled and a message asks for a reason.
- Given a reason is chosen, when the user saves, then the check-in stores `skipped` and the reason, and the Today cell shows the reason.

**FR-7 Multiple checkpoints**
- Given a habit with 3 checkpoints, when the user marks the first and second completed, then the third remains open and each has its own status.

**FR-12 Established**
- Given a habit Establishing for 30+ days whose rate over the last 30 days is at least 90%, when the next check-in is saved, then the habit becomes Established, `establishedAt` is set, it disappears from Today and its slot is freed.
- Given a rate below 90%, then the habit stays in Establishing and no penalty or reset occurs.

**FR-10 Streak**
- Given a habit with a streak of 6, when the user skips one checkpoint with a reason, then the streak stays 6.
- Given a failed checkpoint, then the streak drops (see §5.4 for the definition).

## 8. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Single-user, no authentication. The data layer must not hard-code "no users" in a way that blocks adding a user id later. |
| NFR-2 | Frontend: Expo Web / React Native Web with Expo Router, NativeWind (Tailwind 3.4), TanStack Query for server state, React Hook Form with Zod for forms. |
| NFR-3 | Backend: NestJS 11 REST API. Persistence: PostgreSQL 16 with Drizzle. |
| NFR-4 | Shared contracts as Zod schemas in `packages/evolin-shared`, used by client and API. Derived values (rate, streak, established check) are defined once, not duplicated per client. |
| NFR-5 | Local development through Docker Compose. No hosting, cloud deployment, CI, monitoring or offline support in the MVP. |
| NFR-6 | Accessibility per §6 (non-colour status, 44 px targets, AA contrast, real buttons and labels). |
| NFR-7 | The check-in flow must feel instant: marking a checkpoint should update the UI optimistically. |

## 9. Success of the MVP

**Product owner dogfooding [Decided].** Since 23 Nov the founder uses the app with the habit "Consistent Wake & Get Up". The MVP is useful when daily check-in is faster than the previous method and the Board gives a trustworthy picture of progress.

**What the MVP can validate:** whether per-area limits, acceptance criteria and skip-with-reason are workable in daily use.
**What it cannot validate yet:** whether the 90% rule indicates real automaticity (principles 8 and 9).

Product metrics beyond dogfooding are **[Open]**.

## 10. Deferred: establishing beyond consistency

For future reference only. Do not spec or build now.

Idea discussed 25 Nov: treat the 90% rule as an eligibility gate, add a short weekly automaticity self-report (SRBAI-style), and confirm Established with a trial period without tracking (about 14 days). If the behaviour holds, the habit is established; if not, it returns to Establishing without penalty. All numbers there are untested assumptions. No scientifically validated algorithm exists yet.

Design implication to avoid a dead end: allow the habit status model to gain an intermediate state later without breaking the data contract.

## 11. Open questions (decide before freezing the data contract)

| # | Question | Why it matters | Default if unanswered |
|---|---|---|---|
| Q1 | Day boundary, time zone, and whether past days can be edited. | Every check-in has a date. | Local date, edit today only. |
| Q2 | Minimum completions or cap on skipped share in the 90% rule. | Prevents gaming through skips. | None (rule as in §5.3) and flagged in the spec. |
| Q3 | What happens to unmarked checkpoints at day end: ignored or counted as failed. | Changes rate and streak. | Ignored (not failures). |
| Q4 | Streak with multiple checkpoints: all or any completed. | Changes the streak's meaning. | All completed. |
| Q5 | Slot limit value per area, and any global cap. Fixed vs user-defined life areas. | Limits are central to the product. | 2 per area, no global cap, fixed seed areas. |
| Q6 | Paused state, and moving Establishing back to Backlog. | Lifecycle and history handling. | No Paused; no move back. |
| Q7 | Can an Established habit be re-opened if the behaviour slips. | Honest handling of relapse. | Not in MVP. |
| Q8 | Reconcile the rich habit model (triggers with before/after, Minimum and Target levels, frequency, success criteria) with the simplified model. Behaviour when `checkpointsPerDay` changes on a habit with history. | Defines the Zod contract. | Merged model in §4.2. |

## 12. Decision log

| Date | Decision |
|---|---|
| 30 Oct | Veya renamed Evolin; initial direction was social habit formation. |
| 7 Nov | Interactive prototype with Today, Habits, Discover, Insights. |
| 9 Nov | Scope narrowed to an individual habit-establishment MVP (Draft PRD). |
| 13–15 Nov | Explored triggers, acceptance criteria, success criteria, automaticity. |
| 23 Nov | Founder dogfooding started. |
| 25 Nov | Limit on habits per life area. Acceptance criteria apply per checkpoint. Multiple checkpoints per day. Check-in statuses: completed, failed, skipped (skip requires reason). Streaks allowed as secondary motivation. "Graduation" replaced by "Established". Provisional rule: 90% over about a month. Three board columns: Backlog, Establishing, Established. Automaticity check deferred. |

## 13. Handoff checklist for the spec author

Before writing a spec from this PRD:
1. List every `[Assumption]` the spec depends on, and state the chosen default.
2. For each `[Open]` item the spec touches, either isolate the behaviour behind one function or flag the item as blocking.
3. Keep derived logic (completion rate, streak, establishment check) in `packages/evolin-shared` or one server module; clients render, they do not recompute.
4. Trace every spec section to FR/NFR IDs.
5. Do not add excluded features (§3) even if convenient.
