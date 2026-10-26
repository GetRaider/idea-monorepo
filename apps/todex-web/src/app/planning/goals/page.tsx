"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DocType, GoalStatus } from "@repo/api/todex";
import type { DocSummary } from "@repo/api/todex";
import { Spinner } from "@repo/ui";
import { toast } from "sonner";

import { NewButton } from "@components/new-button";
import { todexClient } from "@lib/todex-client";
import { docsSectionClassName } from "../../knowledge/doc-collection";
import { DocsBreadcrumb } from "../../knowledge/docs-header";

export default function GoalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const goalsQuery = useQuery({
    queryKey: ["docs", { type: DocType.GOAL }],
    queryFn: () => todexClient.docs.list({ type: DocType.GOAL }),
  });
  const createGoal = useMutation({
    mutationFn: () =>
      todexClient.docs.create({ type: DocType.GOAL, title: "Untitled" }),
    onSuccess: async (goal) => {
      await queryClient.invalidateQueries({ queryKey: ["docs"] });
      router.push(`/planning/goals/${goal.id}`);
    },
    onError: () => toast.error("Could not create the doc"),
  });
  const goals = filterGoals(goalsQuery.data ?? []);

  return (
    <section className={docsSectionClassName()}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <DocsBreadcrumb
          className="min-w-0"
          crumbs={[{ label: "Planning", href: "/planning" }, { label: "Goals" }]}
        />
        <NewButton
          onClick={() => createGoal.mutate()}
          disabled={createGoal.isPending}
        />
      </div>
      {goalsQuery.isPending ? (
        <Spinner className="flex-1" />
      ) : goalsQuery.isError ? (
        <p className="text-sm text-muted-foreground">Goals are unavailable.</p>
      ) : (
        <GoalRows
          goals={goals}
          emptyLabel="No goals yet."
        />
      )}
    </section>
  );
}

function GoalRows({
  goals,
  emptyLabel,
}: {
  goals: DocSummary[];
  emptyLabel: string;
}) {
  if (goals.length === 0) {
    return (
      <p className="px-2 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <ul className="flex flex-col">
      {goals.map((goal) => (
        <li key={goal.id}>
          <Link
            href={`/planning/goals/${goal.id}`}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface"
          >
            <span className="min-w-0 flex-1 truncate">{goal.title}</span>
            <span className="w-16 shrink-0 text-muted-foreground">
              {GOAL_STATUS_LABEL[goal.goalStatus ?? GoalStatus.ACTIVE]}
            </span>
            <span className="w-24 shrink-0 text-muted-foreground">
              {goal.goalDeadline ?? "—"}
            </span>
            <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
              {goal.progressPercent ?? 0}%
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function filterGoals(goals: DocSummary[]) {
  return [...goals].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  [GoalStatus.ACTIVE]: "Active",
  [GoalStatus.PAUSED]: "Paused",
  [GoalStatus.DONE]: "Done",
};
