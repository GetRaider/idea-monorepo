import { contextBridge, ipcRenderer } from "electron";

import type { TempoApi } from "../shared/tempo-api.types";
import type {
  AddManualRecordInput,
  CreateSavedSessionInput,
  StartSessionInput,
  UpdateRecordInput,
  UpdateSavedSessionInput,
} from "../shared/records.types";
import type { AppSettings } from "../shared/settings.types";

const tempoApi: TempoApi = {
  listRecords: () => ipcRenderer.invoke("records:list"),
  getActive: () => ipcRenderer.invoke("records:getActive"),
  start: (input: StartSessionInput) =>
    ipcRenderer.invoke("records:start", input),
  pause: () => ipcRenderer.invoke("records:pause"),
  resume: () => ipcRenderer.invoke("records:resume"),
  stop: () => ipcRenderer.invoke("records:stop"),
  discard: () => ipcRenderer.invoke("records:discard"),
  addManual: (input: AddManualRecordInput) =>
    ipcRenderer.invoke("records:addManual", input),
  updateRecord: (input: UpdateRecordInput) =>
    ipcRenderer.invoke("records:update", input),
  deleteRecord: (recordId: string) =>
    ipcRenderer.invoke("records:delete", recordId),
  listSessions: () => ipcRenderer.invoke("sessions:list"),
  createSession: (input: CreateSavedSessionInput) =>
    ipcRenderer.invoke("sessions:create", input),
  updateSession: (input: UpdateSavedSessionInput) =>
    ipcRenderer.invoke("sessions:update", input),
  deleteSession: (sessionId: string) =>
    ipcRenderer.invoke("sessions:delete", sessionId),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (patch: Partial<AppSettings>) =>
    ipcRenderer.invoke("settings:update", patch),
  revealData: () => ipcRenderer.invoke("data:reveal"),
  exportData: () => ipcRenderer.invoke("data:export"),
  importData: () => ipcRenderer.invoke("data:import"),
};

contextBridge.exposeInMainWorld("tempo", tempoApi);
