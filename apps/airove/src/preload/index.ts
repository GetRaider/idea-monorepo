import { contextBridge, ipcRenderer } from "electron";

import type { AiroveApi, HubState } from "../shared";

const api: AiroveApi = {
  getState: () => ipcRenderer.invoke("airove:state"),
  select: (provider) => ipcRenderer.invoke("airove:select", provider),
  navigate: (action) => ipcRenderer.invoke("airove:navigate", action),
  subscribe: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, state: HubState) =>
      listener(state);
    ipcRenderer.on("airove:changed", handler);
    return () => ipcRenderer.removeListener("airove:changed", handler);
  },
};
contextBridge.exposeInMainWorld("airove", api);
