import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  screen,
  session,
  shell,
  type MenuItemConstructorOptions,
  type WebContents,
} from "electron";

import { readDesktopConfig, type DesktopConfig } from "./config";
import {
  decideNavigation,
  isGoogleSignInUrl,
  isStackRetry,
  isStatusDocument,
} from "./policy";
import {
  SESSION_COOKIE_NAME,
  sessionCookieExpiration,
  startSessionHandoffServer,
} from "./session-handoff";
import { probeUrl } from "./probe";
import {
  waitUntilReady,
  withReadinessFailures,
  type ReadinessFailure,
} from "./readiness";
import {
  loadWindowState,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  placeWindow,
  saveWindowState,
} from "./window-state";

app.setName("Todex");
app.setPath("userData", join(app.getPath("appData"), "todex-desktop"));

const windowStateFile = "window-state.json";
let mainWindow: BrowserWindow | null = null;
let openWindow: () => void = () => undefined;
let browserSignInPending = false;
let showSignedInApp: (() => Promise<void>) | null = null;

function start(): void {
  let config: DesktopConfig;
  try {
    config = readDesktopConfig(process.env);
  } catch (error) {
    dialog.showErrorBox(
      "Todex",
      error instanceof Error ? error.message : "Invalid desktop configuration",
    );
    app.quit();
    return;
  }
  const statusPageUrl = resolveStatusPageUrl();
  installApplicationMenu(!app.isPackaged);
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  app.on("second-instance", () => focusExistingWindow());
  void app.whenReady().then(() => {
    const handoffServer = startSessionHandoffServer((sessionToken) =>
      acceptBrowserSession(config, sessionToken),
    );
    handoffServer.on("error", () => {
      dialog.showErrorBox(
        "Todex",
        "Could not listen for the browser sign-in handoff.",
      );
    });
    applyDockIcon();
    const statePath = join(app.getPath("userData"), windowStateFile);
    openWindow = () => createWindow(config, statusPageUrl, statePath);
    openWindow();
    app.on("activate", () => focusExistingWindow());
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

function createWindow(
  config: DesktopConfig,
  statusPageUrl: string,
  statePath: string,
): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    focusExistingWindow();
    return;
  }
  const saved = placeWindow(
    loadWindowState(statePath),
    screen.getAllDisplays().map((display) => display.workArea),
  );
  const icon = resolveIconPath();
  const browserWindow = new BrowserWindow({
    x: saved.bounds.x,
    y: saved.bounds.y,
    width: saved.bounds.width,
    height: saved.bounds.height,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
    title: "Todex",
    show: true,
    backgroundColor: "#000000",
    ...(icon ? { icon } : {}),
    webPreferences: securePreferences(),
  });
  mainWindow = browserWindow;
  if (saved.maximized) browserWindow.maximize();
  rememberWindowState(browserWindow, statePath);
  const boot = attachNavigation(browserWindow, config, statusPageUrl);
  browserWindow.on("closed", () => {
    if (mainWindow === browserWindow) mainWindow = null;
  });
  void boot();
}

function attachNavigation(
  browserWindow: BrowserWindow,
  config: DesktopConfig,
  statusPageUrl: string,
): () => Promise<void> {
  let bootGeneration = 0;
  let viewingWeb = false;
  const webTarget = config.targets.find((target) => target.name === "web");

  const boot = async (): Promise<void> => {
    const generation = ++bootGeneration;
    const active = () =>
      generation === bootGeneration && !browserWindow.isDestroyed();
    viewingWeb = false;
    let shownFailure = "";
    let pendingFailures: ReadinessFailure[] = [];
    try {
      await browserWindow.loadURL(withReadinessFailures(statusPageUrl, []));
      if (!active()) return;
      const result = await waitUntilReady({
        targets: config.targets,
        probe: probeUrl,
        shouldContinue: active,
        onProgress: async (failed) => {
          if (!active()) return;
          pendingFailures = [...failed];
          const signature = failed
            .map((failure) => `${failure.name}=${failure.url}`)
            .join("|");
          if (signature === shownFailure) return;
          shownFailure = signature;
          await browserWindow.loadURL(
            withReadinessFailures(statusPageUrl, failed, { pending: true }),
          );
        },
      });
      if (!active() || result.status === "cancelled") return;
      if (result.status === "timeout") {
        await browserWindow.loadURL(
          withReadinessFailures(statusPageUrl, result.failed),
        );
        return;
      }
      viewingWeb = true;
      await browserWindow.loadURL(config.webUrl);
    } catch {
      if (!active()) return;
      viewingWeb = false;
      const failed = failureToShow(pendingFailures, webTarget, config.targets);
      await browserWindow
        .loadURL(withReadinessFailures(statusPageUrl, failed))
        .catch(() => undefined);
    }
  };

  const onNavigate = (event: { preventDefault: () => void }, url: string) => {
    if (isStackRetry(url, statusPageUrl)) {
      event.preventDefault();
      void boot();
      return;
    }
    if (isStatusDocument(url, statusPageUrl)) return;
    const decision = decideNavigation(url, config.allowedOrigins);
    if (decision === "allow") return;
    event.preventDefault();
    if (decision === "external") openInBrowser(url);
  };

  showSignedInApp = async () => {
    viewingWeb = true;
    await browserWindow.loadURL(signedInUrl(config.webUrl));
  };
  secureContents(
    browserWindow.webContents,
    browserWindow,
    config,
    statusPageUrl,
    onNavigate,
    boot,
  );
  browserWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, _description, _url, isMainFrame) => {
      if (!viewingWeb || !isMainFrame || errorCode === -3) return;
      viewingWeb = false;
      const failed: ReadinessFailure[] = webTarget
        ? [webTarget]
        : [...config.targets];
      void browserWindow
        .loadURL(withReadinessFailures(statusPageUrl, failed))
        .catch(() => undefined);
    },
  );
  return boot;
}

function failureToShow(
  pendingFailures: readonly ReadinessFailure[],
  webTarget: ReadinessFailure | undefined,
  targets: readonly ReadinessFailure[],
): readonly ReadinessFailure[] {
  if (pendingFailures.length > 0) return pendingFailures;
  if (webTarget) return [webTarget];
  return targets;
}

function secureContents(
  contents: WebContents,
  parent: BrowserWindow,
  config: DesktopConfig,
  statusPageUrl: string,
  onNavigate: (event: { preventDefault: () => void }, url: string) => void,
  boot: () => Promise<void>,
): void {
  contents.on("will-navigate", onNavigate);
  contents.on("will-redirect", onNavigate);
  contents.on("will-attach-webview", (event) => event.preventDefault());
  contents.setWindowOpenHandler(({ url }) => {
    if (isStackRetry(url, statusPageUrl)) {
      void boot();
      return { action: "deny" };
    }
    const decision = decideNavigation(url, config.allowedOrigins);
    if (decision === "external") {
      openInBrowser(url);
      return { action: "deny" };
    }
    if (decision !== "allow") return { action: "deny" };
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        parent,
        autoHideMenuBar: true,
        webPreferences: securePreferences(),
      },
    };
  });
  contents.on("did-create-window", (popup) => {
    secureContents(
      popup.webContents,
      parent,
      config,
      statusPageUrl,
      onNavigate,
      boot,
    );
  });
}

function rememberWindowState(
  browserWindow: BrowserWindow,
  statePath: string,
): void {
  let timer: NodeJS.Timeout | undefined;
  const write = () => {
    if (browserWindow.isDestroyed()) return;
    try {
      saveWindowState(statePath, {
        bounds: browserWindow.getNormalBounds(),
        maximized: browserWindow.isMaximized(),
      });
    } catch {
      // Keep the window usable when userData is not writable.
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(write, 200);
  };
  browserWindow.on("resize", schedule);
  browserWindow.on("move", schedule);
  browserWindow.on("close", () => {
    clearTimeout(timer);
    write();
  });
}

function installApplicationMenu(isDev: boolean): void {
  const viewSubmenu: MenuItemConstructorOptions[] = [
    { role: "reload" },
    { role: "forceReload" },
    ...(isDev ? [{ role: "toggleDevTools" as const }] : []),
    { type: "separator" },
    { role: "resetZoom" },
    { role: "zoomIn" },
    { role: "zoomOut" },
    { type: "separator" },
    { role: "togglefullscreen" },
  ];
  const template: MenuItemConstructorOptions[] = [];
  if (process.platform === "darwin") template.push({ role: "appMenu" });
  else template.push({ label: "File", submenu: [{ role: "quit" }] });
  template.push(
    { role: "editMenu" },
    { label: "View", submenu: viewSubmenu },
    { role: "windowMenu" },
  );
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function focusExistingWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    openWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function openInBrowser(url: string): void {
  if (isGoogleSignInUrl(url)) browserSignInPending = true;
  void shell.openExternal(url).catch(() => undefined);
}

async function acceptBrowserSession(
  config: DesktopConfig,
  sessionToken: string,
): Promise<boolean> {
  if (!browserSignInPending) return false;
  browserSignInPending = false;
  await session.defaultSession.cookies.set({
    url: config.apiUrl,
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    path: "/",
    httpOnly: true,
    secure: config.apiUrl.startsWith("https://"),
    sameSite: "lax",
    expirationDate: sessionCookieExpiration(),
  });
  await showSignedInApp?.();
  focusExistingWindow();
  return true;
}

function signedInUrl(webUrl: string): string {
  return new URL("/overview", `${webUrl}/`).href;
}

function resolveStatusPageUrl(): string {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (!app.isPackaged && rendererUrl) {
    return new URL("stack-down.html", rendererUrl).href;
  }
  return pathToFileURL(join(__dirname, "../renderer/stack-down.html")).href;
}

function resolveIconPath(): string | undefined {
  const candidates = [
    join(app.getAppPath(), "resources", "icon.png"),
    join(__dirname, "../../resources/icon.png"),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function applyDockIcon(): void {
  const icon = resolveIconPath();
  if (icon) app.dock?.setIcon(icon);
}

function securePreferences(): Electron.WebPreferences {
  return {
    preload: join(__dirname, "../preload/index.js"),
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
  };
}

start();
