import { AnalyticsInput } from "../schemas";
import { PROMPT_RULES } from "./constants";

export function buildAnalyticsPrompt(input: AnalyticsInput): string {
  const { stats, timeframe } = input;

  return `You are a productivity analytics assistant. Analyze the following task statistics and produce concise, actionable insights.

STATISTICS (${timeframe}):
- Tasks Created: ${stats.tasksCreated}
- Tasks Completed: ${stats.tasksCompleted}
- Average Completion Time: ${stats.avgCompletionTimeDays} days
- Overdue Rate: ${(stats.overdueRate * 100).toFixed(1)}%

ANALYSIS GUIDELINES:
- Interpret what the metrics imply; do NOT restate numbers verbatim
- Use only the provided statistics; do NOT calculate or invent new values
- Insights must reference at least one metric and explain its implication
- Risks should describe potential negative outcomes if trends continue
- Recommendations must be specific, practical, and actionable within a task-management workflow

RULES:
${PROMPT_RULES.JSON_ONLY}
- Keep summary concise (1–2 sentences)
- Each insight, risk, and recommendation must be a complete sentence
- Avoid generic language (e.g., "could be improved", "might help")
- If any rule cannot be followed, return an empty JSON object {}

OUTPUT FORMAT:
{
  "summary": "string",
  "insights": ["string"],
  "risks": ["string"],
  "recommendations": ["string"]
}

Respond with the JSON object only.`;
}
