export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface Space extends Folder {
  folderId: string | null;
  preferredProvider: import("./index").Provider | null;
}
export interface Chat {
  id: string;
  provider: import("./index").Provider;
  url: string;
  title: string;
  spaceId: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}
export interface Library {
  folders: Folder[];
  spaces: Space[];
  chats: Chat[];
  lastProvider: import("./index").Provider;
}
export type LibraryCommand =
  | { type: "folder:create"; name: string }
  | { type: "folder:rename"; id: string; name: string }
  | { type: "folder:delete"; id: string }
  | { type: "space:create"; name: string; folderId: string | null }
  | { type: "space:rename"; id: string; name: string }
  | { type: "space:move"; id: string; folderId: string | null }
  | { type: "space:delete"; id: string }
  | { type: "chat:rename"; id: string; name: string }
  | { type: "chat:move"; id: string; spaceId: string | null }
  | { type: "chat:remove"; id: string };
