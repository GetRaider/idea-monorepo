import { useState, type FormEvent } from "react";

import type {
  Chat,
  Folder,
  HubState,
  LibraryCommand,
  Space,
} from "../../shared";

export function Sidebar({ state, busy, run }: SidebarProps) {
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const library = state.library;
  const chats = library.chats.filter(
    (chat) =>
      state.selectedSpaceId === null || chat.spaceId === state.selectedSpaceId,
  );
  const selectedSpace = library.spaces.find(
    (space) => space.id === state.selectedSpaceId,
  );
  const selectSpace = (id: string | null) => {
    void run(() => window.airove.selectSpace(id));
  };
  const spaceRow = (space: Space) => (
    <li key={space.id} className="flex min-w-0 items-center gap-1">
      <button
        className={`min-w-0 flex-1 truncate text-left ${state.selectedSpaceId === space.id ? "bg-zinc-700 text-white" : "text-zinc-300"}`}
        aria-current={state.selectedSpaceId === space.id ? "page" : undefined}
        disabled={busy}
        onClick={() => selectSpace(space.id)}
      >
        {space.name}
      </button>
      <button
        aria-label={`Edit space ${space.name}`}
        disabled={busy}
        onClick={() => setEditor({ kind: "space", record: space })}
      >
        ···
      </button>
    </li>
  );
  return (
    <aside
      aria-label="Chat library"
      className="flex h-screen w-[340px] shrink-0 flex-col border-r border-zinc-700 bg-zinc-900"
    >
      <div className="border-b border-zinc-700 p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold">
            airove{" "}
            <span className="text-xs font-normal text-zinc-400">0.2</span>
          </span>
          <span className="text-xs text-zinc-400">Local library</span>
        </div>
        <button
          className={`w-full text-left ${state.selectedSpaceId === null ? "bg-zinc-700" : ""}`}
          aria-current={state.selectedSpaceId === null ? "page" : undefined}
          disabled={busy}
          onClick={() => selectSpace(null)}
        >
          All Chats{" "}
          <span className="float-right text-zinc-400">
            {library.chats.length}
          </span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Spaces
          </h2>
          <div className="flex gap-1">
            <button
              disabled={busy}
              onClick={() => setEditor({ kind: "newFolder" })}
            >
              + Folder
            </button>
            <button
              disabled={busy}
              onClick={() => setEditor({ kind: "newSpace" })}
            >
              + Space
            </button>
          </div>
        </div>
        {editor && (
          <LibraryEditor
            key={editorKey(editor)}
            target={editor}
            state={state}
            busy={busy}
            run={run}
            close={() => setEditor(null)}
          />
        )}
        <nav aria-label="Spaces and folders">
          {library.folders.map((folder) => (
            <section key={folder.id} className="mb-2">
              <div className="flex items-center justify-between">
                <h3 className="min-w-0 truncate px-2 text-sm font-medium text-zinc-400">
                  ▾ {folder.name}
                </h3>
                <button
                  aria-label={`Edit folder ${folder.name}`}
                  disabled={busy}
                  onClick={() => setEditor({ kind: "folder", record: folder })}
                >
                  ···
                </button>
              </div>
              <ul className="ml-3 border-l border-zinc-700 pl-2">
                {library.spaces
                  .filter((space) => space.folderId === folder.id)
                  .map(spaceRow)}
              </ul>
              {!library.spaces.some(
                (space) => space.folderId === folder.id,
              ) && <p className="ml-5 text-xs text-zinc-500">No Spaces</p>}
            </section>
          ))}
          <ul>
            {library.spaces
              .filter((space) => space.folderId === null)
              .map(spaceRow)}
          </ul>
          {!library.spaces.length && (
            <p className="px-2 py-3 text-xs text-zinc-400">
              Create a Space to organize a project or topic.
            </p>
          )}
        </nav>
        <section
          className="mt-5 border-t border-zinc-700 pt-3"
          aria-label="Saved chats"
        >
          <h2 className="mb-2 truncate px-2 text-sm font-semibold">
            {selectedSpace?.name ?? "All Chats"}{" "}
            <span className="font-normal text-zinc-400">({chats.length})</span>
          </h2>
          {!chats.length && (
            <p className="px-2 text-xs text-zinc-400">
              No saved chats here. Choose a provider and start a New Chat.
            </p>
          )}
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li
                key={chat.id}
                className="flex items-start gap-1 rounded border border-zinc-800"
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  disabled={busy}
                  onClick={() => {
                    void run(() => window.airove.openChat(chat.id));
                  }}
                >
                  <span className="block truncate" title={chat.title}>
                    {chat.title}
                  </span>
                  <span className="block truncate text-xs text-zinc-400">
                    {chat.provider === "chatgpt" ? "ChatGPT" : "Claude"}
                    {chat.spaceId
                      ? ` · ${library.spaces.find((space) => space.id === chat.spaceId)?.name ?? "Space"}`
                      : " · Unassigned"}
                  </span>
                </button>
                <button
                  aria-label={`Edit chat ${chat.title}`}
                  disabled={busy}
                  onClick={() => setEditor({ kind: "chat", record: chat })}
                >
                  ···
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

function LibraryEditor({ target, state, busy, run, close }: EditorProps) {
  const record = "record" in target ? target.record : null;
  const [name, setName] = useState(initialName(target));
  const [parentId, setParentId] = useState(initialParent(target));
  const isSpace = target.kind === "space" || target.kind === "newSpace";
  const isChat = target.kind === "chat";
  const submit = (command: LibraryCommand) => {
    void run(async () => {
      await window.airove.editLibrary(command);
      close();
    });
  };
  const saveName = (event: FormEvent) => {
    event.preventDefault();
    if (target.kind === "newFolder") submit({ type: "folder:create", name });
    if (target.kind === "newSpace")
      submit({ type: "space:create", name, folderId: parentId || null });
    if (target.kind === "folder")
      submit({ type: "folder:rename", id: target.record.id, name });
    if (target.kind === "space")
      submit({ type: "space:rename", id: target.record.id, name });
    if (target.kind === "chat")
      submit({ type: "chat:rename", id: target.record.id, name });
  };
  const remove = () => {
    if (target.kind === "folder")
      submit({ type: "folder:delete", id: target.record.id });
    if (target.kind === "space")
      submit({ type: "space:delete", id: target.record.id });
    if (target.kind === "chat")
      submit({ type: "chat:remove", id: target.record.id });
  };
  const parentOptions = isChat ? state.library.spaces : state.library.folders;
  return (
    <section
      aria-label="Library editor"
      className="mb-3 rounded border border-zinc-600 bg-zinc-800 p-3"
    >
      <h3 className="mb-2 text-sm font-medium">
        {record ? "Edit" : "Create"} {editorLabel(target)}
      </h3>
      <form onSubmit={saveName} className="space-y-2">
        <label className="block text-xs text-zinc-300">
          {isChat ? "Local title" : "Name"}
          <input
            autoFocus
            required
            maxLength={240}
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 p-2 text-sm text-white"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
          />
        </label>
        {(isSpace || isChat) && (
          <label className="block text-xs text-zinc-300">
            {isChat ? "Space" : "Folder"}
            <select
              className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 p-2 text-sm text-white"
              value={parentId}
              disabled={busy}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">{isChat ? "No Space" : "Root"}</option>
              {parentOptions.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex flex-wrap gap-1">
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="bg-zinc-600"
          >
            {record ? "Save name" : "Create"}
          </button>
          {target.kind === "space" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                submit({
                  type: "space:move",
                  id: target.record.id,
                  folderId: parentId || null,
                })
              }
            >
              Move
            </button>
          )}
          {target.kind === "chat" && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                submit({
                  type: "chat:move",
                  id: target.record.id,
                  spaceId: parentId || null,
                })
              }
            >
              Move
            </button>
          )}
          <button type="button" disabled={busy} onClick={close}>
            Cancel
          </button>
        </div>
      </form>
      {record && (
        <div className="mt-3 border-t border-zinc-600 pt-2">
          <p className="mb-1 text-xs text-zinc-400">{deletionHint(target)}</p>
          <button disabled={busy} className="text-red-300" onClick={remove}>
            {isChat ? "Remove local chat" : `Delete ${editorLabel(target)}`}
          </button>
        </div>
      )}
    </section>
  );
}

function initialName(target: EditorTarget): string {
  if (target.kind === "chat") return target.record.title;
  if ("record" in target) return target.record.name;
  return "";
}

function initialParent(target: EditorTarget): string {
  if (target.kind === "space") return target.record.folderId ?? "";
  if (target.kind === "chat") return target.record.spaceId ?? "";
  return "";
}

function editorLabel(target: EditorTarget): string {
  if (target.kind === "newFolder") return "Folder";
  if (target.kind === "newSpace") return "Space";
  return target.kind;
}

function editorKey(target: EditorTarget): string {
  return "record" in target
    ? `${target.kind}:${target.record.id}`
    : target.kind;
}

function deletionHint(target: EditorTarget): string {
  if (target.kind === "folder") return "Deleting keeps its Spaces at the root.";
  if (target.kind === "space") return "Deleting keeps its chats in All Chats.";
  return "Removes this local entry. The provider conversation is kept.";
}

interface SidebarProps {
  state: HubState;
  busy: boolean;
  run: (operation: () => Promise<unknown>) => Promise<void>;
}
interface EditorProps extends SidebarProps {
  target: EditorTarget;
  close: () => void;
}
type EditorTarget =
  | { kind: "newFolder" }
  | { kind: "newSpace" }
  | { kind: "folder"; record: Folder }
  | { kind: "space"; record: Space }
  | { kind: "chat"; record: Chat };
