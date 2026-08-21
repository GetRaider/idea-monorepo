import type {
  AddManualRecordInput,
  CreateSavedSessionInput,
  FocusRecord,
  SavedSession,
  StartSessionInput,
  UpdateRecordInput,
  UpdateSavedSessionInput,
} from "./records.types";
import type { AppSettings } from "./settings.types";

export interface TempoApi {
  listRecords: () => Promise<FocusRecord[]>;
  getActive: () => Promise<FocusRecord | null>;
  start: (input: StartSessionInput) => Promise<FocusRecord>;
  pause: () => Promise<FocusRecord>;
  resume: () => Promise<FocusRecord>;
  stop: () => Promise<FocusRecord>;
  discard: () => Promise<void>;
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
