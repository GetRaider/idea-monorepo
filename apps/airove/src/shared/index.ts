import type { Library, LibraryCommand } from "./library";

export type { Folder, Space, Chat, Library, LibraryCommand } from "./library";

export const providers = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/",
} as const;
export const toolbarHeight = 104;
export const sidebarWidth = 340;
export const newChatUrls = {
  chatgpt: providers.chatgpt,
  claude: "https://claude.ai/new",
} as const;
export const actions = ["back", "forward", "reload", "external"] as const;

export type Provider = keyof typeof providers;
export type Action = (typeof actions)[number];
export interface ProviderState {
  provider: Provider;
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  conversation: boolean;
  timestamp: string;
  error: string | null;
}
export interface HubState {
  composing: boolean;
  drafts: Partial<Record<Provider, DraftStatus>>;
  selected: Provider;
  selectedSpaceId: string | null;
  library: Library;
  metadataError: string | null;
  providers: Record<Provider, ProviderState>;
}
export interface AiroveApi {
  getState: () => Promise<HubState>;
  select: (provider: Provider) => Promise<HubState>;
  selectSpace: (spaceId: string | null) => Promise<HubState>;
  showComposer: (visible: boolean) => Promise<void>;
  newChat: (input: NewChatInput) => Promise<void>;
  retryDraft: () => Promise<void>;
  copyDraft: () => Promise<void>;
  dismissDraft: () => Promise<void>;
  requestMicrophone: () => Promise<boolean>;
  openChat: (id: string) => Promise<void>;
  editLibrary: (command: LibraryCommand) => Promise<void>;
  navigate: (action: Action) => Promise<void>;
  subscribe: (listener: (state: HubState) => void) => () => void;
}

export type DraftStatus = "waiting" | "ready" | "occupied" | "unavailable";
export interface NewChatInput {
  provider: Provider;
  spaceId: string | null;
  text: string;
}
