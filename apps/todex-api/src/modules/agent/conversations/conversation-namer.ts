import { Inject, Injectable } from "@nestjs/common";

import { LLM_CLIENT, type LlmClient } from "../llm/llm-client";
import { ConversationsRepository } from "./conversations.repository";

const TITLE_PROMPT = [
  "Name this chat from what the user wants the agent to do.",
  "Reply with only the name, at most six words.",
].join(" ");

const MAX_TITLE_CHARACTERS = 60;
const MAX_TITLE_WORDS = 6;

@Injectable()
export class ConversationNamer {
  constructor(
    private readonly conversations: ConversationsRepository,
    @Inject(LLM_CLIENT) private readonly llm: LlmClient,
  ) {}

  async nameIfMissing(conversationId: string): Promise<void> {
    const conversation = await this.conversations.findConversation(conversationId);
    if (!conversation || conversation.title) return;
    const messages = await this.conversations.listMessages(conversationId);
    const firstUser = messages.find(
      (message) => message.role === "user" && message.content.trim(),
    );
    if (!firstUser) return;
    await this.conversations.setTitleIfEmpty(
      conversationId,
      await this.propose(firstUser.content),
    );
  }

  private async propose(userText: string): Promise<string> {
    try {
      const completion = await this.llm.complete({
        messages: [
          { role: "system", content: TITLE_PROMPT },
          { role: "user", content: userText },
        ],
        tools: [],
      });
      return cleanTitle(completion.content) ?? fallbackTitle(userText);
    } catch {
      return fallbackTitle(userText);
    }
  }
}

function cleanTitle(content: string): string | null {
  const line = content
    .split("\n")
    .map((part) => part.trim())
    .find(Boolean);
  if (!line) return null;
  return clipTitle(line.replace(/^["'`]+|["'`]+$/g, ""));
}

function fallbackTitle(input: string): string {
  return clipTitle(input) ?? "New chat";
}

function clipTitle(input: string): string | null {
  const words = input.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return null;
  const title = words.slice(0, MAX_TITLE_WORDS).join(" ");
  if (title.length <= MAX_TITLE_CHARACTERS) return title;
  return `${title.slice(0, MAX_TITLE_CHARACTERS).trimEnd()}…`;
}
