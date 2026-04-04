import { aiServices } from "@/server/services/ai";
import { ForbiddenError } from "@/lib/api/errors";
import {
  BaseApiService,
  DataAccess,
} from "@/server/services/api/base.api.service";

import type { AnalyticsInput, AnalyticsOutput } from "@/server/services/ai";
import type { TaskStatsInput, Timeframe } from "@/db/dtos";
import { DB, and, gte } from "@/db/client";
import { tasks } from "@/db/schemas";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskStatistics } from "./tasks.api.service";

export class AnalyticsApiService extends BaseApiService {
  constructor(protected readonly db: DB) {
    super(db);
  }

  async getTasksStatistic(
    timeframe: "week" | "month" | "quarter" | "all" = "month",
    access: DataAccess,
  ): Promise<TaskStatistics> {
    return this.handleOperation(async () => {
      const now = new Date();
      let startDate: Date | null = null;

      switch (timeframe) {
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      const accessCond = this.accessWhere(tasks, access);
      const query = this.db
        .select({
          id: tasks.id,
          status: tasks.status,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          dueDate: tasks.dueDate,
        })
        .from(tasks);

      const allTasks = startDate
        ? await query.where(and(gte(tasks.createdAt, startDate), accessCond))
        : await query.where(accessCond);

      const completedTasks = allTasks.filter((t) => t.status === "Done");
      let avgCompletionTimeDays = 0;

      if (completedTasks.length > 0) {
        const completionTimes = completedTasks
          .map(
            (task) =>
              (new Date(task.updatedAt).getTime() -
                new Date(task.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
          .filter((days) => days >= 0);
        if (completionTimes.length > 0) {
          avgCompletionTimeDays =
            completionTimes.reduce((sum, days) => sum + days, 0) /
            completionTimes.length;
        }
      }

      const tasksWithDueDate = allTasks.filter((t) => t.dueDate !== null);
      const overdueTasks = tasksWithDueDate.filter((t) => {
        if (t.status === "Done") return false;
        const dueDate = tasksHelper.date.parse(t.dueDate);
        return dueDate !== undefined && dueDate < now;
      });

      return {
        tasksCreated: allTasks.length,
        tasksCompleted: completedTasks.length,
        avgCompletionTimeDays: Math.round(avgCompletionTimeDays * 10) / 10,
        overdueRate:
          tasksWithDueDate.length > 0
            ? Math.round(
                (overdueTasks.length / tasksWithDueDate.length) * 100,
              ) / 100
            : 0,
      };
    });
  }

  async generate(
    stats: TaskStatsInput,
    timeframe: Timeframe,
    shouldUseAI: boolean,
    isAnonymous: boolean,
  ): Promise<AnalyticsOutput> {
    return this.handleOperation(async () => {
      if (shouldUseAI) {
        if (isAnonymous) {
          throw new ForbiddenError(
            "AI features are not available for guest users. Please sign in to use them.",
          );
        }
        return this.generateAI({ stats, timeframe });
      }

      return this.generateBasic(stats, timeframe);
    });
  }

  async generateAI(input: AnalyticsInput): Promise<AnalyticsOutput> {
    return this.handleOperation(() => aiServices.analytics.generate(input));
  }

  generateBasic(stats: TaskStatsInput, timeframe: Timeframe): AnalyticsOutput {
    const completionRate =
      stats.tasksCreated > 0
        ? (stats.tasksCompleted / stats.tasksCreated) * 100
        : 0;

    const periodLabel =
      timeframe === "all" ? "all time" : `the past ${timeframe}`;
    const summary = `Over ${periodLabel}, you created ${stats.tasksCreated} tasks and completed ${stats.tasksCompleted} (${completionRate.toFixed(1)}% completion rate). Average completion time was ${stats.avgCompletionTimeDays} days, with ${(stats.overdueRate * 100).toFixed(1)}% of tasks with due dates being overdue.`;

    const insights: string[] = [];
    if (completionRate >= 80) {
      insights.push("High completion rate indicates strong task execution.");
    } else if (completionRate >= 60) {
      insights.push(
        "Moderate completion rate suggests room for improvement in task follow-through.",
      );
    } else {
      insights.push(
        "Low completion rate indicates potential issues with task planning or execution.",
      );
    }

    if (stats.avgCompletionTimeDays <= 2) {
      insights.push(
        "Fast average completion time suggests efficient task management.",
      );
    } else if (stats.avgCompletionTimeDays <= 5) {
      insights.push("Moderate completion time indicates balanced workload.");
    } else {
      insights.push(
        "Long average completion time may indicate task complexity or capacity issues.",
      );
    }

    if (stats.overdueRate > 0.2) {
      insights.push(
        "High overdue rate suggests need for better deadline management.",
      );
    } else if (stats.overdueRate > 0.1) {
      insights.push(
        "Some overdue tasks indicate occasional deadline challenges.",
      );
    } else {
      insights.push("Low overdue rate shows good deadline adherence.");
    }

    const risks: string[] = [];
    if (stats.overdueRate > 0.3) {
      risks.push(
        "High overdue rate may impact project timelines and team reliability.",
      );
    }
    if (completionRate < 50 && stats.tasksCreated > 10) {
      risks.push(
        "Low completion rate with high task creation suggests potential task overload.",
      );
    }
    if (stats.avgCompletionTimeDays > 7) {
      risks.push(
        "Long completion times may indicate tasks are too large or poorly scoped.",
      );
    }
    if (risks.length === 0) {
      risks.push(
        "No significant risks detected based on current task metrics.",
      );
    }

    const recommendations: string[] = [];
    if (completionRate < 70) {
      recommendations.push(
        "Consider breaking down larger tasks into smaller, more manageable pieces.",
      );
    }
    if (stats.overdueRate > 0.15) {
      recommendations.push(
        "Review and adjust due dates to be more realistic based on actual completion patterns.",
      );
    }
    if (stats.avgCompletionTimeDays > 5) {
      recommendations.push(
        "Evaluate task complexity and consider adding more detailed task descriptions.",
      );
    }
    if (stats.tasksCreated > stats.tasksCompleted * 2) {
      recommendations.push(
        "Focus on completing existing tasks before creating new ones.",
      );
    }

    return { summary, insights, risks, recommendations };
  }

  protected override mapError(error: unknown): never {
    throw error;
  }
}
