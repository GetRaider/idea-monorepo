# AI Layer - Local Testing with Ollama

This directory contains the AI provider abstraction layer for task decomposition and analytics generation.

## Local Development Setup

### Prerequisites

1. **Install Ollama**: [https://ollama.ai](https://ollama.ai)

2. **Pull the llama3.1:8b model**:

```bash
ollama pull llama3.1:8b
```

3. **Start Ollama server** (if not running automatically):

```bash
ollama serve
```

The server runs on `http://localhost:11434` by default.

### Environment Configuration

Set the following in your `.env.local` file:

```env
AI_PROVIDER=local
OLLAMA_MODEL=llama3.1:8b
```

The `AI_PROVIDER=local` setting uses the Ollama provider. The model name must match a model you've pulled with `ollama pull`.

### Verify Ollama is Running

Test that Ollama is accessible:

```bash
curl http://localhost:11434/api/tags
```

You should see a list of available models, including `llama3.1:8b`.

## Testing the AI Functions

### Task Decomposition

```typescript
import { decomposeTask } from "@/lib/ai";

const result = await decomposeTask({
  title: "Build user authentication system",
  description: "Add login, registration, and password reset functionality",
});

console.log(result);
// {
//   tasks: [
//     {
//       title: "Create login API endpoint",
//       description: "Implement POST /api/auth/login with email and password validation",
//       priority: "high"
//     },
//     ...
//   ]
// }
```

### Analytics Summary

```typescript
import { generateAnalytics } from "@/lib/ai";

const analytics = await generateAnalytics({
  stats: {
    tasksCreated: 45,
    tasksCompleted: 38,
    avgCompletionTimeDays: 2.3,
    overdueRate: 0.12,
  },
  timeframe: "week",
});

console.log(analytics);
// {
//   summary: "...",
//   insights: ["..."],
//   risks: ["..."],
//   recommendations: ["..."]
// }
```

## Troubleshooting

### "Connection refused" or "Failed to fetch"

- Ensure Ollama is running: `ollama serve`
- Check the service is accessible: `curl http://localhost:11434/api/tags`
- Verify the port (default: 11434) matches your Ollama configuration

### "Model not found"

- Pull the model: `ollama pull llama3.1:8b`
- Verify the model name in `.env.local` matches exactly: `OLLAMA_MODEL=llama3.1:8b`
- List available models: `ollama list`

### Invalid JSON responses

The AI layer automatically:

- Strips markdown code blocks if present
- Validates output with Zod schemas
- Throws explicit errors with validation details

If you see validation errors, the model may need a more specific prompt or the response format may need adjustment.

### Slow responses

The `llama3.1:8b` model runs locally and may be slower than cloud providers:

- First request may be slower (model loading)
- Subsequent requests should be faster
- Consider using a smaller model for faster development: `ollama pull llama3.1:1b`

## Switching to OpenAI (Production)

To switch to OpenAI for production:

1. Set environment variables:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

2. No code changes required - the provider is selected automatically based on `AI_PROVIDER`.

## Architecture

- **Provider Interface**: `provider.ts` - Common interface for all AI providers
- **Ollama Provider**: `providers/ollama.provider.ts` - Local development
- **OpenAI Provider**: `providers/openai.provider.ts` - Production
- **Schemas**: `schemas.ts` - Zod validation for inputs/outputs
- **Prompts**: `prompts/` - Reusable prompt templates
- **Public API**: `index.ts` - `decomposeTask()` and `generateAnalytics()`

All AI calls are server-side only. Never expose API keys or make AI calls from client components.
