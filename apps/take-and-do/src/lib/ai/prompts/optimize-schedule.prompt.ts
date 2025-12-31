import { OptimizeScheduleInput } from "../schemas";
import { PROMPT_RULES } from "./constants";

export function buildOptimizeSchedulePrompt(
  input: OptimizeScheduleInput,
): string {
  const tasksJson = JSON.stringify(input.tasks, null, 2);

  return `You are a productivity optimization assistant. Analyze the following tasks and suggest optimized schedule dates based on their priority, due dates, and estimated effort.

CURRENT TASKS:
${tasksJson}

CURRENT DATE: ${input.currentDate}

RULES:
${PROMPT_RULES.JSON_ONLY}
- Analyze each task's priority, dueDate, and estimation to determine optimal scheduling
- Tasks with closer dueDates should generally be scheduled earlier
- Higher priority tasks should be scheduled before lower priority ones when due dates are similar
- Consider task estimation to balance daily workload (aim for ~8 hours per day max)
- Tasks without due dates should be distributed based on priority and workload balance
- Never schedule a task after its due date
- Use "today" or "tomorrow" or specific dates (YYYY-MM-DD) for schedule recommendations

SCHEDULING STRATEGY:
1. Critical/High priority with near due dates → Schedule today or tomorrow
2. Medium priority with due dates within a week → Distribute across available days
3. Low priority or no due date → Schedule after higher priority tasks
4. Consider estimation: Don't overload a single day (8 hours max recommended)

ANALYSIS REQUIRED:
1. Review current schedules and identify conflicts or inefficiencies
2. Identify overdue risks (tasks that might miss their due dates)
3. Suggest optimal schedule dates for each task
4. Provide reasoning for schedule changes
5. Calculate workload distribution

CRITICAL: NEVER include task IDs in any human-readable text (risks, insights, reasons, summary). Always use task summaries or descriptions instead. Task IDs are only for internal matching in the recommendations array.

OUTPUT FORMAT:
{
  "summary": "Brief overview of schedule optimization (1-2 sentences)",
  "currentWorkload": {
    "today": number (total estimated hours for today),
    "tomorrow": number (total estimated hours for tomorrow),
    "unscheduled": number (total estimated hours for unscheduled tasks)
  },
  "recommendations": [
    {
      "taskId": "string (must match one of the task IDs provided)",
      "taskSummary": "string (first 50 chars of task summary)",
      "currentSchedule": "string or null (current scheduleDate, use null if unscheduled)",
      "suggestedSchedule": "string (MUST be a date string: YYYY-MM-DD format, or null if no change needed)",
      "reason": "string (brief reason for this recommendation)"
    }
  ],
  "risks": [
    "string (potential scheduling risks or conflicts - use task summaries, NEVER task IDs)"
  ],
  "insights": [
    "string (productivity insights based on the task distribution - use task summaries, NEVER task IDs)"
  ]
}

IMPORTANT: 
- suggestedSchedule can be null if no schedule change is recommended
- Use YYYY-MM-DD format for dates (e.g., "2024-01-15")
- Do not use "today" or "tomorrow" strings, use actual dates
- NEVER include task IDs in risks, insights, summary, or reason fields - only use task summaries or descriptions
- When referencing tasks in risks/insights, use format like: "Task 'Task Summary Here' has..." instead of "Task 'task-id-123' has..."

Respond with the JSON object only.`;
}

