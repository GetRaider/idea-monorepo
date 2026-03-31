import { BaseAIService } from "./base.ai.service";

import { aiPrompts } from ".";
import {
  ComposeTaskInputSchema,
  ComposeTaskOutputSchema,
  DecomposeTaskInput,
  DecomposeTaskInputSchema,
  DecomposeTaskOutput,
  DecomposeTaskOutputSchema,
} from "./schemas";

import type { ComposeTaskInput, ComposeTaskOutput } from ".";

export class TaskAIService extends BaseAIService {
  constructor() {
    super();
  }

  async compose(input: ComposeTaskInput): Promise<ComposeTaskOutput> {
    const validatedInput = this.validateInput(input, ComposeTaskInputSchema);
    const prompt = aiPrompts.buildComposeTaskPrompt(validatedInput);
    const result = await this.processPrompt(prompt, ComposeTaskOutputSchema);
    return result.data;
  }

  async decompose(input: DecomposeTaskInput): Promise<DecomposeTaskOutput> {
    const validatedInput = this.validateInput(input, DecomposeTaskInputSchema);
    const prompt = aiPrompts.buildDecomposeTaskPrompt(validatedInput);
    const result = await this.processPrompt(prompt, DecomposeTaskOutputSchema);
    return result.data;
  }
}
