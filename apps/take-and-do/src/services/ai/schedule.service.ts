import { aiPrompts } from "@/lib/ai";
import { BaseAIService } from "./base-ai.service";

import {
  OptimizeScheduleInput,
  OptimizeScheduleInputSchema,
  OptimizeScheduleOutput,
  OptimizeScheduleOutputSchema,
} from "@/lib/ai/schemas";

export class ScheduleAIService extends BaseAIService {
  constructor() {
    super();
  }

  async optimize(
    input: OptimizeScheduleInput,
  ): Promise<OptimizeScheduleOutput> {
    const validatedInput = this.validateInput(
      input,
      OptimizeScheduleInputSchema,
    );
    const prompt = aiPrompts.buildOptimizeSchedulePrompt(validatedInput);
    const result = await this.processPrompt(
      prompt,
      OptimizeScheduleOutputSchema,
    );
    return result.data;
  }
}
