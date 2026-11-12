import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  app,
  BrowserWindow,
  WebContentsView,
  dialog,
  ipcMain,
  session,
  shell,
  type WebContents,
  type IpcMainInvokeEvent,
} from "electron";

import {
  actions,
  providers,
  toolbarHeight,
  sidebarWidth,
  newChatUrls,
  type HubState,
  type Provider,
  type ProviderState,
} from "../shared";
import {
  isConversation,
  isEmbeddedDestination,
  isHttps,
  isProviderOrigin,
  safeUrl,
} from "./policy";

import { openLibrary, type ChatLibrary } from "./library";
import { ConversationCapture } from "./capture";
import {
  nullableId,
  validId,
  validProvider,
  validateCommand,
} from "./validation";

app.setName("Airove");
app.setPath("userData", join(app.getPath("appData"), "airove"));
let mainWindow: BrowserWindow | null = null;
let library: ChatLibrary;
let disposeWindow: (() => void) | undefined;
const rendererFile = join(__dirname, "../renderer/index.html");
const rendererUrl =
  !app.isPackaged && process.env.ELECTRON_RENDERER_URL
    ? new URL(process.env.ELECTRON_RENDERER_URL).href
    : pathToFileURL(rendererFile).href;

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1180,
    minHeight: 600,
    title: "Airove",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow = window;
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.on("will-redirect", (event) => event.preventDefault());
  window.webContents.setVisualZoomLevelLimits(1, 1);
  const state: HubState = {
    selected: library.snapshot().lastProvider,
    selectedSpaceId: null,
    library: library.snapshot(),
    metadataError: null,
    providers: {} as Record<Provider, ProviderState>,
  };
  const capture = new ConversationCapture(library);
  const views = {} as Record<Provider, WebContentsView>;
  const popups = new Set<BrowserWindow>();
  const publish = () => {
    if (!window.isDestroyed()) window.webContents.send("airove:changed", state);
  };
  const resize = () => {
    const [width, height] = window.getContentSize();
    views[state.selected].setBounds({
      x: sidebarWidth,
      y: toolbarHeight,
      width: Math.max(0, (width ?? 0) - sidebarWidth),
      height: Math.max(0, (height ?? 0) - toolbarHeight),
    });
  };
  for (const provider of Object.keys(providers) as Provider[]) {
    const providerSession = session.fromPartition(`persist:${provider}`);
    const grants = new Set<string>();
    const owned = new Set<WebContents>();
    providerSession.setPermissionCheckHandler(
      (contents, permission, origin, details) =>
        !!contents &&
        owned.has(contents) &&
        isProviderOrigin(provider, origin) &&
        isProviderOrigin(provider, contents.getURL()) &&
        details.isMainFrame !== false &&
        grants.has(permission),
    );
    providerSession.setPermissionRequestHandler(
      (contents, permission, callback, details) => {
        const allowed = [
          "media",
          "clipboard-read",
          "clipboard-sanitized-write",
          "fullscreen",
        ];
        if (
          !owned.has(contents) ||
          !details.isMainFrame ||
          !isProviderOrigin(provider, details.requestingUrl) ||
          !isProviderOrigin(provider, contents.getURL()) ||
          !allowed.includes(permission)
        ) {
          callback(false);
          return;
        }
        void dialog
          .showMessageBox(window, {
            type: "question",
            title: "Airove permission",
            message: `${new URL(providers[provider]).hostname} requests ${permission}`,
            detail:
              "Allow for this window session? Camera and microphone also require macOS permission.",
            buttons: ["Deny", "Allow"],
            defaultId: 0,
            cancelId: 0,
          })
          .then(({ response }) => {
            if (response === 1) grants.add(permission);
            callback(response === 1);
          })
          .catch(() => callback(false));
      },
    );
    const view = new WebContentsView({
      webPreferences: {
        session: providerSession,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    views[provider] = view;
    const contents = view.webContents;
    owned.add(contents);
    state.providers[provider] = {
      provider,
      url: providers[provider],
      title: provider,
      loading: true,
      canGoBack: false,
      canGoForward: false,
      conversation: false,
      timestamp: new Date().toISOString(),
      error: null,
    };
    const update = (
      eventName: string,
      navigationUrl?: string,
      pageTitle?: string,
    ) => {
      if (contents.isDestroyed()) return;
      const current = state.providers[provider];
      const url = navigationUrl ?? (contents.getURL() || providers[provider]);
      Object.assign(current, {
        url: isProviderOrigin(provider, url)
          ? new URL(url).origin + new URL(url).pathname
          : safeUrl(url),
        title: pageTitle ?? contents.getTitle(),
        loading: contents.isLoading(),
        canGoBack: contents.navigationHistory.canGoBack(),
        canGoForward: contents.navigationHistory.canGoForward(),
        conversation: isConversation(provider, url),
        timestamp: new Date().toISOString(),
      });
      console.info("[airove]", eventName, {
        provider,
        url: safeUrl(url),
        loading: current.loading,
        conversation: current.conversation,
        timestamp: current.timestamp,
        error: current.error,
      });
      if (
        eventName === "did-navigate" ||
        eventName === "did-navigate-in-page" ||
        eventName === "page-title-updated"
      ) {
        try {
          if (
            capture.observe(
              provider,
              url,
              current.title,
              eventName === "page-title-updated" ? "title" : "navigation",
            )
          ) {
            state.library = library.snapshot();
            state.metadataError = null;
          }
        } catch {
          state.metadataError =
            "Could not save chat metadata. Check available disk space and restart Airove.";
        }
      }
      publish();
    };
    secureContents(contents, provider, window, popups, owned);
    contents.on("did-start-loading", () => {
      state.providers[provider].error = null;
      update("loading");
    });
    contents.on("did-stop-loading", () => update("loaded"));
    contents.on("did-navigate", (_event, url, httpResponseCode) => {
      if (httpResponseCode >= 400) {
        capture.cancel(provider);
        state.providers[provider].error =
          `Provider returned HTTP ${httpResponseCode}. Saved chat metadata has been kept.`;
        update("navigation-error", url);
        return;
      }
      update("did-navigate", url);
    });
    contents.on("did-navigate-in-page", (_event, url, isMainFrame) => {
      if (isMainFrame) update("did-navigate-in-page", url);
    });
    contents.on("page-title-updated", (_event, title) =>
      update("page-title-updated", undefined, title),
    );
    contents.on(
      "did-fail-load",
      (_event, code, _description, _url, mainFrame) => {
        if (!mainFrame || code === -3) return;
        capture.cancel(provider);
        state.providers[provider].error =
          `Navigation failed (${code}). Reload or open in browser.`;
        update("did-fail-load");
      },
    );
    contents.on("render-process-gone", () => {
      capture.cancel(provider);
      state.providers[provider].error =
        "Provider process exited. Reload to recover.";
      publish();
    });
    void contents.loadURL(providers[provider]).catch(() => {});
  }
  window.contentView.addChildView(views[state.selected]);
  resize();
  window.on("resize", resize);
  window.webContents.on("did-finish-load", publish);
  const validate = (event: IpcMainInvokeEvent) => {
    if (
      event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      event.senderFrame.url !== rendererUrl
    )
      throw new Error("Untrusted IPC sender");
  };
  ipcMain.handle("airove:state", (event) => {
    validate(event);
    return state;
  });
  const selectProvider = (provider: Provider) => {
    if (state.selected !== provider) {
      window.contentView.removeChildView(views[state.selected]);
      state.selected = provider;
      window.contentView.addChildView(views[provider]);
      resize();
      views[provider].webContents.focus();
    }
  };
  const refreshLibrary = () => {
    state.library = library.snapshot();
    state.metadataError = null;
    publish();
  };
  ipcMain.handle("airove:select", (event, input: unknown) => {
    validate(event);
    const provider = validProvider(input);
    library.rememberProvider(provider, state.selectedSpaceId);
    selectProvider(provider);
    refreshLibrary();
    return state;
  });
  ipcMain.handle("airove:space", (event, input: unknown) => {
    validate(event);
    const spaceId = nullableId(input);
    const snapshot = library.snapshot();
    const space = snapshot.spaces.find((candidate) => candidate.id === spaceId);
    if (spaceId && !space) throw new Error("Space no longer exists");
    state.selectedSpaceId = spaceId;
    selectProvider(space?.preferredProvider ?? snapshot.lastProvider);
    publish();
    return state;
  });
  ipcMain.handle("airove:library", (event, input: unknown) => {
    validate(event);
    const command = validateCommand(input);
    const removed =
      command.type === "chat:remove" ? library.getChat(command.id) : null;
    library.edit(command);
    if (removed) capture.removed(removed.provider, removed.url);
    if (command.type === "space:delete" && command.id === state.selectedSpaceId)
      state.selectedSpaceId = null;
    refreshLibrary();
  });
  ipcMain.handle("airove:new", async (event) => {
    validate(event);
    const provider = state.selected;
    library.rememberProvider(provider, state.selectedSpaceId);
    refreshLibrary();
    const token = capture.begin(provider, state.selectedSpaceId);
    try {
      await views[provider].webContents.loadURL(newChatUrls[provider]);
    } catch {
      capture.cancel(provider, token);
      throw new Error("Could not open a new conversation");
    }
  });
  ipcMain.handle("airove:open", async (event, input: unknown) => {
    validate(event);
    const chat = library.getChat(validId(input));
    capture.cancel(chat.provider);
    selectProvider(chat.provider);
    library.rememberProvider(chat.provider, state.selectedSpaceId);
    refreshLibrary();
    try {
      await views[chat.provider].webContents.loadURL(chat.url);
    } catch {
      throw new Error(
        "Could not open this conversation. Its local record has been kept.",
      );
    }
  });
  ipcMain.handle("airove:navigate", async (event, action: unknown) => {
    validate(event);
    if (
      typeof action !== "string" ||
      !actions.some((candidate) => candidate === action)
    )
      throw new Error("Invalid action");
    const contents = views[state.selected].webContents;
    if (action === "back" || action === "forward")
      capture.cancel(state.selected);
    if (action === "back" && contents.navigationHistory.canGoBack())
      contents.navigationHistory.goBack();
    if (action === "forward" && contents.navigationHistory.canGoForward())
      contents.navigationHistory.goForward();
    if (action === "reload") contents.reload();
    if (action === "external") await openExternal(contents.getURL(), window);
  });
  disposeWindow = () => {
    for (const channel of [
      "airove:state",
      "airove:select",
      "airove:navigate",
      "airove:space",
      "airove:library",
      "airove:new",
      "airove:open",
    ])
      ipcMain.removeHandler(channel);
    for (const popup of popups) if (!popup.isDestroyed()) popup.destroy();
    for (const view of Object.values(views))
      if (!view.webContents.isDestroyed()) view.webContents.close();
  };
  window.on("closed", () => {
    disposeWindow?.();
    disposeWindow = undefined;
    mainWindow = null;
  });
  void window.loadURL(rendererUrl);
}

function secureContents(
  contents: WebContents,
  provider: Provider,
  parent: BrowserWindow,
  popups: Set<BrowserWindow>,
  owned: Set<WebContents>,
) {
  contents.on("will-navigate", (event, url) => {
    if (!isEmbeddedDestination(provider, url)) {
      event.preventDefault();
      void openExternal(url, parent);
    }
  });
  contents.on("will-redirect", (event, url) => {
    if (!isEmbeddedDestination(provider, url)) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (!isEmbeddedDestination(provider, url)) {
      void openExternal(url, parent);
      return { action: "deny" };
    }
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        parent,
        width: 620,
        height: 780,
        autoHideMenuBar: true,
        webPreferences: {
          session: contents.session,
          sandbox: true,
          nodeIntegration: false,
          contextIsolation: true,
          preload: undefined,
        },
      },
    };
  });
  contents.on("did-create-window", (popup) => {
    const popupContents = popup.webContents;
    popups.add(popup);
    owned.add(popupContents);
    secureContents(popup.webContents, provider, parent, popups, owned);
    popup.on("closed", () => {
      popups.delete(popup);
      owned.delete(popupContents);
    });
  });
  contents.on("will-attach-webview", (event) => event.preventDefault());
}

async function openExternal(url: string, parent: BrowserWindow) {
  if (!isHttps(url) || parent.isDestroyed()) return;
  const { response } = await dialog.showMessageBox(parent, {
    type: "question",
    title: "Open browser",
    message: `Open ${new URL(url).origin} in your default browser?`,
    detail: "Browser sign-in uses a separate session from Airove.",
    buttons: ["Cancel", "Open"],
    defaultId: 0,
    cancelId: 0,
  });
  if (response === 1) await shell.openExternal(url).catch(() => {});
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow?.isMinimized()) mainWindow.restore();
    mainWindow?.show();
    mainWindow?.focus();
  });
  void app.whenReady().then(async () => {
    try {
      library = await openLibrary(
        join(app.getPath("userData"), "airove.sqlite"),
      );
      createWindow();
      app.on("activate", () => {
        if (!mainWindow) createWindow();
        else mainWindow.show();
      });
    } catch {
      dialog.showErrorBox(
        "Airove could not start",
        "Could not open the local metadata database. Check disk access. Your existing data has not been replaced.",
      );
      app.quit();
    }
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("will-quit", () => library?.close());
