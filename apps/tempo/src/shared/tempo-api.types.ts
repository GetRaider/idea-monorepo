import type {
  ActiveSessionState,
  AddManualRecordInput,
  CreateSavedSessionInput,
  FocusRecord,
  SavedSession,
  StartBreakInput,
  StartSessionInput,
  UpdateRecordInput,
  UpdateSavedSessionInput,
} from "./records.types";
import type { AppSettings } from "./settings.types";

export interface TempoApi {
  listRecords: () => Promise<FocusRecord[]>;
  getActive: () => Promise<FocusRecord | null>;
  getActiveState: () => Promise<ActiveSessionState>;
  start: (input: StartSessionInput) => Promise<FocusRecord>;
  startBreak: (input: StartBreakInput) => Promise<FocusRecord>;
  pause: () => Promise<FocusRecord>;
  resume: () => Promise<FocusRecord>;
  pauseBreak: () => Promise<FocusRecord>;
  stop: () => Promise<FocusRecord | null>;
  stopBreak: () => Promise<FocusRecord | null>;
  discard: () => Promise<void>;
  discardBreak: () => Promise<void>;
  addManual: (input: AddManualRecordInput) => Promise<FocusRecord>;
  updateRecord: (input: UpdateRecordInput) => Promise<FocusRecord>;
  deleteRecord: (recordId: string) => Promise<void>;
  listSessions: () => Promise<SavedSession[]>;
  createSession: (input: CreateSavedSessionInput) => Promise<SavedSession>;
  updateSession: (input: UpdateSavedSessionInput) => Promise<SavedSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
  revealData: () => Promise<void>;
  exportData: () => Promise<boolean>;
  importData: () => Promise<boolean>;
}
