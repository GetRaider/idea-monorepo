import { contextBridge, ipcRenderer } from "electron";

import type { AiroveApi, HubState } from "../shared";

const api: AiroveApi = {
  getState: () => ipcRenderer.invoke("airove:state"),
  select: (provider) => ipcRenderer.invoke("airove:select", provider),
  selectSpace: (spaceId) => ipcRenderer.invoke("airove:space", spaceId),
  showComposer: (visible) => ipcRenderer.invoke("airove:compose", visible),
  newChat: (input) => ipcRenderer.invoke("airove:new", input),
  retryDraft: () => ipcRenderer.invoke("airove:draft:retry"),
  copyDraft: () => ipcRenderer.invoke("airove:draft:copy"),
  dismissDraft: () => ipcRenderer.invoke("airove:draft:dismiss"),
  requestMicrophone: () => ipcRenderer.invoke("airove:microphone"),
  openChat: (id) => ipcRenderer.invoke("airove:open", id),
  editLibrary: (command) => ipcRenderer.invoke("airove:library", command),
  navigate: (action) => ipcRenderer.invoke("airove:navigate", action),
  subscribe: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, state: HubState) =>
      listener(state);
    ipcRenderer.on("airove:changed", handler);
    return () => ipcRenderer.removeListener("airove:changed", handler);
  },
};
contextBridge.exposeInMainWorld("airove", api);
