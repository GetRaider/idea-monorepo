import type { LibraryCommand, Provider, NewChatInput } from "../shared";

export function validateCommand(input: unknown): LibraryCommand {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid library operation");
  const command = input as Record<string, unknown>;
  const type = command.type;
  switch (type) {
    case "folder:create":
      return { type, name: validName(command.name) };
    case "folder:rename":
    case "space:rename":
    case "chat:rename":
      return { type, id: validId(command.id), name: validName(command.name) };
    case "folder:delete":
    case "space:delete":
    case "chat:remove":
      return { type, id: validId(command.id) };
    case "space:create":
      return {
        type,
        name: validName(command.name),
        folderId: nullableId(command.folderId),
      };
    case "space:move":
      return {
        type,
        id: validId(command.id),
        folderId: nullableId(command.folderId),
      };
    case "chat:move":
      return {
        type,
        id: validId(command.id),
        spaceId: nullableId(command.spaceId),
      };
    default:
      throw new Error("Unknown library operation");
  }
}

export function validId(input: unknown): string {
  if (typeof input !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(input))
    throw new Error("Invalid record ID");
  return input;
}

export function nullableId(input: unknown): string | null {
  return input === null ? null : validId(input);
}

export function validProvider(input: unknown): Provider {
  if (input !== "chatgpt" && input !== "claude")
    throw new Error("Invalid provider");
  return input;
}

function validName(input: unknown): string {
  if (
    typeof input !== "string" ||
    !input.trim() ||
    input.trim().length > 240 ||
    Array.from(input).some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    )
  )
    throw new Error("Enter a name between 1 and 240 characters");
  return input.trim();
}

export function validateNewChat(input: unknown): NewChatInput {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid new chat");
  const draft = input as Record<string, unknown>;
  if (
    typeof draft.text !== "string" ||
    !draft.text.trim() ||
    draft.text.length > 32000 ||
    draft.text.includes(String.fromCharCode(0))
  )
    throw new Error("Enter a draft between 1 and 32000 characters");
  return {
    provider: validProvider(draft.provider),
    spaceId: nullableId(draft.spaceId),
    text: draft.text,
  };
}
