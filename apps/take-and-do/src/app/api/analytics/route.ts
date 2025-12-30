import { NextRequest, NextResponse } from "next/server";
import { getTaskStatistics } from "@/db/queries";
import { generateAnalytics } from "@/lib/ai";

function generateBasicAnalytics(
  stats: {
    tasksCreated: number;
    tasksCompleted: number;
    avgCompletionTimeDays: number;
    overdueRate: number;
  },
  timeframe: "week" | "month" | "quarter",
) {
  const completionRate =
    stats.tasksCreated > 0
      ? (stats.tasksCompleted / stats.tasksCreated) * 100
      : 0;

  const summary = `In the past ${timeframe}, you created ${stats.tasksCreated} tasks and completed ${stats.tasksCompleted} (${completionRate.toFixed(1)}% completion rate). Average completion time was ${stats.avgCompletionTimeDays} days, with ${(stats.overdueRate * 100).toFixed(1)}% of tasks with due dates being overdue.`;

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
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "month") as
      | "week"
      | "month"
      | "quarter";

    if (!["week", "month", "quarter"].includes(timeframe)) {
      return NextResponse.json(
        { error: "Invalid timeframe. Must be 'week', 'month', or 'quarter'" },
        { status: 400 },
      );
    }

    const stats = await getTaskStatistics(timeframe);

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
  try {
    const body = await request.json();
    const { stats, timeframe, shouldUseAI } = body;

    if (!stats || !timeframe) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "Both 'stats' and 'timeframe' are required",
        },
        { status: 400 },
      );
    }

    if (!["week", "month", "quarter"].includes(timeframe)) {
      return NextResponse.json(
        { error: "Invalid timeframe. Must be 'week', 'month', or 'quarter'" },
        { status: 400 },
      );
    }

    let analytics;

    if (shouldUseAI === true) {
      analytics = await generateAnalytics({
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
