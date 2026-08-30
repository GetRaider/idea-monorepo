# PRD — Tempo Analytics

## 1. Product

**Tempo** — lightweight desktop time-tracking application.

## 2. Problem

Tempo already records sessions and provides basic analytics:

- Total tracked time
- Today
- Week
- Month
- Filtering

The next step is to make analytics answer:

> How much did I actually work, how consistently, what activities took my time, and what do my sessions look like?

Analytics should remain simple and factual rather than attempting to calculate an abstract "productivity score."

---

## 3. Goals

### Primary

1. Give the user a quick understanding of their actual time investment.
2. Show consistency over time.
3. Show session patterns.
4. Show how time is distributed across different activities.
5. Allow all metrics to respect the currently selected filters/date range.
6. Keep analytics lightweight and actionable.

### Non-goals

- Productivity scoring
- AI productivity recommendations
- Gamification
- Pomodoro analytics
- Complex project management functionality

---

## 4. Session Activities

Before starting a session, the user can optionally specify an **Activity**.

Example:

```text
Start Session

Activity: [ Software Growth ▼ ]

          [ Start ]
```

The Activity is optional.

A session can therefore exist without an Activity:

```text
Session
├── startedAt
├── endedAt
├── duration
└── activity (optional)
```

### Activity behavior

- User can select an existing Activity.
- User can create a new Activity.
- Activity is optional.
- Activity is attached to the session when the session starts.
- Activity can be used for filtering and analytics.
- Existing sessions without an Activity remain valid.

Example Activities:

- Software Growth
- Work
- Business
- Learning
- Personal

The system should not force users to categorize every session.

---

## 5. Metrics

### Existing

| Metric         | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| **Total Time** | Total duration of sessions matching current filters/date range |
| **Today**      | Total duration tracked today                                   |
| **Week**       | Total duration tracked during the current week                 |
| **Month**      | Total duration tracked during the current month                |

### New

#### Sessions

Number of completed sessions matching the current filters.

Example:

`16 sessions`

#### Daily Average

Average tracked time per calendar day in the selected period.

Example:

`3h 44m / day`

The denominator should be the number of calendar days in the selected period rather than only active days.

#### Average Session

Average duration of completed sessions.

Example:

`18h 42m / 16 sessions = 1h 10m`

#### Longest Session

Duration of the longest completed session in the selected period.

Example:

`2h 18m`

#### Active Days

Number of days containing at least one completed session.

Example:

`5 / 7 days`

This measures consistency without introducing a gamified streak system.

---

## 6. Time Over Time

Add a **Time by Day** visualization.

Example:

```text
TIME BY DAY

Mon   █████████      4h 20m
Tue   ██████         2h 50m
Wed   ██████████     5h 10m
Thu   ███            1h 30m
Fri   █████          2h 40m
```

### Requirements

- X-axis = dates
- Y-axis = tracked duration
- Each day displays total completed session time.
- Must respect active filters.
- Must adapt to the selected period.

Recommended aggregation:

- Day → hourly breakdown
- Week → daily breakdown
- Month → daily breakdown
- Longer/custom periods → daily or weekly aggregation depending on range

---

## 7. Time by Activity

Add an **Activity Breakdown** visualization showing how tracked time is distributed across Activities.

Example:

```text
TIME BY ACTIVITY

Software Growth     12h 40m   45%
Work                 8h 20m   30%
Business              4h 10m   15%
Personal              2h 50m   10%
```

### Requirements

- Only sessions with an Activity are included.
- Sessions without an Activity should be grouped under **No Activity** or excluded based on the selected view.
- Must respect the selected date range.
- Must respect other active filters.
- Display both duration and percentage.
- Activities should be ordered by total duration descending.

---

## 8. Filters

All analytics should operate on the same filtering mechanism.

Example:

```text
Date: This Week
Activity: Software Growth
```

Result:

```text
Total Time       14h 30m
Sessions              12
Daily Average      2h 54m
Avg. Session       1h 12m
Longest Session    2h 18m
Active Days          5 / 5
```

### Principle

> One filter state → one consistent analytics dataset.

All metrics and visualizations must use the same filtered session dataset.

---

## 9. Analytics Layout

```text
Analytics

[Today] [Week] [Month] [Custom]

Total Time          Sessions
18h 42m             16

Daily Average       Avg. Session
3h 44m              1h 10m

Longest Session     Active Days
2h 18m              5 / 5


TIME BY DAY

Mon   █████████      4h 20m
Tue   ██████         2h 50m
Wed   ██████████     5h 10m
...


TIME BY ACTIVITY

Software Growth     12h 40m   45%
Work                 8h 20m   30%
Business              4h 10m   15%
Personal              2h 50m   10%
```

**Total Time** should have the strongest visual hierarchy. The remaining metrics and charts provide supporting context.

---

## 10. Data Model

Conceptually:

```text
Session
├── id
├── startedAt
├── endedAt
├── duration
└── activityId (optional)

Activity
├── id
└── name
```

Analytics should derive metrics from sessions rather than storing redundant aggregate values.

This keeps analytics deterministic and avoids synchronization problems.

---

## 11. Success Criteria

The feature is successful if the user can open Analytics and answer within a few seconds:

1. How much time did I spend?
2. How many sessions did I do?
3. How long are my sessions on average?
4. How consistent was I?
5. How was my time distributed across the selected period?
6. What activities consumed most of my time?

No additional interpretation should be required.

---

## 12. MVP Scope

### Must Have

- Total Time
- Sessions
- Daily Average
- Average Session
- Longest Session
- Active Days
- Time-by-day chart
- Activity on session start
- Optional Activity
- Activity creation
- Activity filtering
- Time-by-Activity chart
- Today / Week / Month filters
- Custom date range if already supported
- All metrics respect active filters

### Not Now

- Productivity score
- Goals
- Streaks
- AI insights
- Recommendations
- Gamification
- Complex project management

---

## 13. Core Product Principle

> **Tempo should be a precise instrument for measuring time and understanding where it goes, without trying to judge productivity.**
