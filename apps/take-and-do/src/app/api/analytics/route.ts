import { NextRequest, NextResponse } from "next/server";

import { dataAccessFromAuth, requireAuth } from "@/lib/api-auth";
import { getTaskStatistics } from "@/lib/db/queries";
import { aiServices } from "@/services/ai";

function generateBasicAnalytics(
  stats: {
    tasksCreated: number;
    tasksCompleted: number;
    avgCompletionTimeDays: number;
    overdueRate: number;
  },
  timeframe: "week" | "month" | "quarter" | "all",
) {
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
  // Always include at least one risk for Basic Summary
  if (risks.length === 0) {
    risks.push("No significant risks detected based on current task metrics.");
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

  return {
    summary,
    insights,
    risks,
    recommendations,
  };
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const access = dataAccessFromAuth(authResult);
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "month") as
      | "week"
      | "month"
      | "quarter"
      | "all";

    if (!["week", "month", "quarter", "all"].includes(timeframe)) {
      return NextResponse.json(
        {
          error:
            "Invalid timeframe. Must be 'week', 'month', 'quarter', or 'all'",
        },
        { status: 400 },
      );
    }

    const stats = await getTaskStatistics(timeframe, access);

    return NextResponse.json({
      timeframe,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { stats, timeframe, shouldUseAI } = body as {
      stats: Parameters<typeof generateBasicAnalytics>[0];
      timeframe: "week" | "month" | "quarter" | "all";
      shouldUseAI?: boolean;
    };

    if (!stats || !timeframe) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "Both 'stats' and 'timeframe' are required",
        },
        { status: 400 },
      );
    }

    if (!["week", "month", "quarter", "all"].includes(timeframe)) {
      return NextResponse.json(
        {
          error:
            "Invalid timeframe. Must be 'week', 'month', 'quarter', or 'all'",
        },
        { status: 400 },
      );
    }

    if (shouldUseAI === true && authResult.isAnonymous) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message:
            "AI features are not available for guest users. Please sign in to use them.",
        },
        { status: 403 },
      );
    }

    let analytics;

    if (shouldUseAI === true) {
      analytics = await aiServices.analytics.generate({
        stats,
        timeframe,
      });
    } else {
      analytics = generateBasicAnalytics(stats, timeframe);
    }

    return NextResponse.json({
      timeframe,
      stats,
      analytics,
      aiGenerated: shouldUseAI === true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate analytics", details: message },
      { status: 500 },
    );
  }
}
