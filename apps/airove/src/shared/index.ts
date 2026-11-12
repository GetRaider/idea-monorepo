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
  newChat: () => Promise<void>;
  openChat: (id: string) => Promise<void>;
  editLibrary: (command: LibraryCommand) => Promise<void>;
  navigate: (action: Action) => Promise<void>;
  subscribe: (listener: (state: HubState) => void) => () => void;
}
