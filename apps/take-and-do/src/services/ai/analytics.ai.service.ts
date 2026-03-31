import { BaseAIService } from "./base.ai.service";

import { AnalyticsInputSchema, AnalyticsOutputSchema } from "./schemas";
import { aiPrompts, type AnalyticsInput, type AnalyticsOutput } from ".";

export class AnalyticsAIService extends BaseAIService {
  constructor() {
    super();
  }

  async generate(input: AnalyticsInput): Promise<AnalyticsOutput> {
    const validatedInput = this.validateInput(input, AnalyticsInputSchema);
    const prompt = aiPrompts.buildAnalytics(validatedInput);
    const result = await this.processPrompt(prompt, AnalyticsOutputSchema);
    return result.data;
  }
}
