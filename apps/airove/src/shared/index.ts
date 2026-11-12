export const providers = {
  chatgpt: "https://chatgpt.com/",
  claude: "https://claude.ai/",
} as const;
export const toolbarHeight = 104;
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
  providers: Record<Provider, ProviderState>;
}
export interface AiroveApi {
  getState: () => Promise<HubState>;
  select: (provider: Provider) => Promise<HubState>;
  navigate: (action: Action) => Promise<void>;
  subscribe: (listener: (state: HubState) => void) => () => void;
}
