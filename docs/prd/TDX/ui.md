# Todex Tasks — Complete the Tasks UI

You are working on the existing Todex application.

I already have an implemented/prototyped **Tasks Board UI**. Your job is to **extend the existing Tasks experience**, not redesign the application from scratch.

Before making changes:

1. Inspect the existing Tasks page and related components.
2. Understand the current layout, styling, components, routing, and interaction patterns.
3. Reuse existing components and design patterns wherever possible.
4. Preserve the current Board design unless a change is explicitly required below.
5. Do not introduce unnecessary dependencies or a new design system.

The goal is to implement the following Tasks states and make them feel like one coherent product.

---

## 1. Tasks structure

The Tasks section should have three levels:

```text
Tasks
├── Board
│   └── Task
```

Implement these states:

- Tasks Root
- Tasks Board
- Task Detail

Use breadcrumbs consistently.

---

# 2. Tasks Root

Create/complete the Tasks root page.

### Header

Show:

- `Tasks`
- `+ New Task`
- `Search`

### Quick Access

Add a section:

`Quick Access`

With four compact cards:

```text
Inbox 3
Unscheduled
Overdue 2
All 247
```

Each card should be clickable.

### Recently Created

Add:

`Recently Created`

Show a short list of recently created tasks.

Example:

```text
Task A
Task B
Task C
```

### Recently Completed

Add:

`Recently Completed`

Show a short list of recently completed tasks.

Example:

```text
Task X
Task Y
```

Keep this page lightweight. It should be an overview and navigation hub, **not another task board**.

Do not add unnecessary analytics, charts, filters, or dashboards.

---

# 3. Tasks Board

The existing Board is the main reference.

**Do not redesign the Board from scratch.**

Preserve its current:

- layout
- components
- spacing
- typography
- interactions
- navigation
- task cards

Add/complete the following functionality.

## Header

Use:

```text
Tasks > BOARD_NAME
```

Include:

- Board name
- Kanban / List view switcher
- Search
- Settings
- `+ New Task`

Search, Settings, and New Task should remain on the right side of the header.

---

## Kanban View

Keep the existing Kanban structure.

Example:

```text
Todo        In Progress        Done
```

At the bottom of the Todo column add:

```text
+ New task
```

### Fast task creation

When clicking `+ New task`, expand an inline creation UI.

The user should be able to define:

- Task title
- Estimation
- Priority
- Status

Keep this interaction fast and compact.

Do not turn it into a large modal unless the existing implementation already follows that pattern.

---

## List View

Implement a List representation of the same Board.

The List view should contain the same tasks and properties as the Kanban view.

The user should be able to switch between:

```text
Kanban | List
```

without losing the current Board context.

---

# 4. Task Detail

Create/complete the individual Task view.

### Breadcrumbs

Use:

```text
Tasks > BOARD_NAME > TASK_KEY
```

Example:

```text
Tasks > Product Development > T-1
```

### Layout

Use a two-column layout.

### Left column

Primary task content:

- Task title
- Description

This should be the dominant content area.

### Right column

Create a compact sidebar containing:

#### Task Details

Show:

- Status
- Priority
- Estimation
- Schedule / due date
- Board
- Goal / Space where applicable

#### Subtasks

Show the task's subtasks and their completion state.

The sidebar should remain secondary to the task content.

---

# 5. Visual Design

The current UI uses too many different grey tones.

Simplify the visual system.

Primary colors:

- Black
- White
- Grayscale derived from black → white

Reduce unnecessary grey variations.

Use grayscale primarily for:

- secondary text
- borders
- dividers
- subtle backgrounds
- disabled states
- hover states

Maintain clear hierarchy between:

- Primary content
- Secondary content
- Interactive elements
- Inactive elements

The overall UI should feel:

- minimal
- clean
- calm
- modern
- highly scannable

Do not add decorative elements without a functional purpose.

---

# 6. Required UI States

Implement the important states rather than only the default populated state.

### Tasks Root

- Populated
- Empty/relevant empty sections

### Board

- Kanban with tasks
- Empty Kanban column
- Fast task creation collapsed
- Fast task creation expanded
- List view
- Search state
- Empty Board
- Settings interaction

### Task

- Normal task
- Task with description
- Task without description
- Task with subtasks
- Task without subtasks
- Completed task
- Editable task properties

Use realistic sample data where the existing application does not yet have the required data model.

---

# 7. Important Implementation Rules

### Reuse first

Before creating a new component, check whether an existing component can be reused.

Do not duplicate components unnecessarily.

### Preserve existing design

The current Tasks Board is the visual source of truth.

Extend it instead of replacing it.

### Keep scope focused

Only work on the Tasks experience described above.

Do not redesign:

- Sidebar
- Spaces
- Schedules
- Other application pages
- Global navigation

unless a small change is required to make the Tasks navigation work correctly.

### No unnecessary backend work

If backend/data functionality does not exist yet, use the application's existing mock/state/data patterns rather than building unnecessary infrastructure.

### Responsive behavior

Make the new layouts work with the existing responsive system.

For the Task Detail page, ensure the two-column layout can collapse appropriately on smaller screens.

### Final cleanup

After implementation:

- Check all Tasks routes/states.
- Remove obvious visual inconsistencies.
- Ensure buttons and interactions use existing components.
- Ensure spacing and typography match the existing Board.
- Ensure there are no unnecessary grey shades.
- Ensure there are no broken states or placeholder UI.

The final result should feel like **one existing Todex product**, not a newly designed section.

Start by inspecting the existing Tasks implementation and then implement the missing states incrementally.
