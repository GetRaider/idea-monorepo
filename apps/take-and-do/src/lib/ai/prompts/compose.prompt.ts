import { ComposeTaskInput } from "../schemas";
import { PROMPT_RULES, PROMPT_GUIDELINES, PROMPT_OPTIONS } from "./constants";

export function buildComposePrompt(input: ComposeTaskInput): string {
  return `You are a task composition assistant. Convert the following raw text into a structured task matching the Task interface.

RAW TEXT:
${input.text}

RULES:
${PROMPT_RULES.JSON_ONLY}
- Extract all task properties that can be inferred from the text
- Include only fields that are explicitly mentioned or clearly implied
${PROMPT_RULES.NO_INVENTION}
${PROMPT_RULES.DATE_FORMAT}
${PROMPT_RULES.INFER_REASONABLE}

REQUIRED FIELDS:

1. "summary": string - concise task title (max 100 characters)
   • Use action verbs (Create, Implement, Fix, Update, Review, etc.)
   • Be specific and clear about what needs to be done
   • Examples:
     - "Create user authentication system"
     - "Fix login button styling issue"
     - "Update database schema for user profiles"
     - "Review and approve marketing campaign proposal"

2. "description": string - detailed explanation with concrete actions
   • MUST include a structured breakdown of what needs to be done
   • Use bullet points or numbered lists for multiple steps
   • Include specific details, requirements, or constraints mentioned
   • Include a header, subtitle, steps, and conclusion if needed
   • Format examples:
     - For simple tasks: "Complete the following: [action 1], [action 2]"
     - For complex tasks: Use numbered steps (1, 2, 3) or bullet points
   • Examples of good descriptions:
     * "Implement user login functionality:
       1. Create login form with email and password fields
       2. Add form validation for required fields
       3. Integrate with authentication API endpoint
       4. Handle success and error responses
       5. Redirect to dashboard on successful login"
     * "Fix the navigation menu:
       • Update mobile menu styling to match design system
       • Ensure all menu items are accessible
       • Test responsive behavior on different screen sizes
       • Verify keyboard navigation works correctly"
     * "Review quarterly sales report:
       1. Analyze sales data for Q4 2024
       2. Compare with previous quarter and year-over-year
       3. Identify top-performing products and regions
       4. Document key insights and recommendations
       5. Prepare presentation for management team"

3. "priority": ${PROMPT_OPTIONS.PRIORITY} - based on urgency and importance
   ${PROMPT_GUIDELINES.PRIORITY}

OPTIONAL FIELDS (include only if mentioned in text, omit if not present):

• "labels": string[] - tags or categories mentioned
  Examples: ["bug", "frontend", "backend", "urgent", "documentation", "testing"]

• "dueDate": string - ISO 8601 date (YYYY-MM-DD) if deadline is mentioned
  • Extract dates from phrases like "by Friday", "due next week", "deadline is Jan 15"
  • Convert relative dates to absolute dates based on current context

• "estimation": number - hours (default) or story points if explicitly stated
  • Only include if a numeric estimate is mentioned (e.g., "2 hours", "3 days", "5 story points")
  • Convert days to hours if needed (1 day = 8 hours)

• "scheduleDate": string - ISO 8601 date (YYYY-MM-DD) for scheduling
  • If text mentions "today", "this morning", "this afternoon" → use today's date
  • If text mentions "tomorrow", "next day" → use tomorrow's date
  • If a specific date is mentioned (e.g., "on January 20th", "scheduled for next Monday") → use that date

• "status": ${PROMPT_OPTIONS.STATUS} - only if explicitly stated
  • Only include if the text explicitly mentions the task status
  • Default to "To Do" if not mentioned

IMPORTANT CONSTRAINTS:
• Do NOT include optional fields with null values - omit them entirely if not present
• Do NOT include system-managed fields: "id", "taskBoardId", "taskKey", "subtasks"
• The description must expand on the summary with concrete intent or scope
• Do NOT repeat the summary verbatim in the description
• Do NOT decompose the task into subtasks
• Do NOT infer task boards, workflows, or ownership

DESCRIPTION QUALITY REQUIREMENTS:
• Must be actionable and specific
• Should break down complex tasks into clear steps
• Use formatting (bullet points, numbered lists) for readability
• Include context, requirements, or constraints when mentioned
• Avoid vague language like "handle", "manage", "process" - be specific

OUTPUT FORMAT:
{
  "summary": "string - concise task title with action verb",
  "description": "string - detailed explanation with structured steps/actions",
  "priority": ${PROMPT_OPTIONS.PRIORITY},
  "labels": ["string"] (optional),
  "dueDate": "YYYY-MM-DD" (optional),
  "estimation": number (optional),
  "scheduleDate": "YYYY-MM-DD" (optional),
  "status": ${PROMPT_OPTIONS.STATUS} (optional)
}

Respond with the JSON object only.`;
}
