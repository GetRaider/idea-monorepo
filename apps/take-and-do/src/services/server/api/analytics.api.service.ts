import { aiServices } from "@/services/server/ai";
import { ForbiddenError } from "@/lib/api/errors";
import { BaseApiService } from "@/services/server/api/base.api.service";

import type { AnalyticsInput, AnalyticsOutput } from "@/services/server/ai";
import type { TaskStatsInput, Timeframe } from "@/db/dtos";
import type { DataAccess } from "@/db/repositories/base.repository";
import type { TasksRepository } from "@/db/repositories/tasks.repository";

export class AnalyticsApiService extends BaseApiService {
  constructor(private readonly repository: TasksRepository) {
    super();
  }

  async getStatistics(timeframe: Timeframe, access: DataAccess) {
    return this.handleOperation(() =>
      this.repository.getTaskStatistics(timeframe, access),
    );
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
