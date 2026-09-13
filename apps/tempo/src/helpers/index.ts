export {
  NO_ACTIVITY_COLOR_KEY,
  buildAnalyticsMetrics,
  buildTimeByActivity,
  buildTimeByDay,
  formatDurationLabel,
  getAnalyticsDataset,
  getAnalyticsPalette,
  getRecordColorKey,
  parseDateInputValue,
  resolveAnalyticsPeriod,
} from "./analytics.helper";
export {
  buildBreakStartRecord,
  DEFAULT_BREAK_SESSION_NAME,
  isDefaultBreakSessionName,
  LEGACY_REST_SESSION_NAME,
  validateStartBreak,
} from "./break.helper";
export { resolveFocusViewState } from "./focus-view.helper";
export type { FocusViewState } from "./focus-view.helper";
export {
  foldRunningSegment,
  formatClock,
  formatHmsClock,
  formatMenuBarClock,
  formatStageClock,
  formatTimerClock,
  getDisplayedElapsedSeconds,
  getRemainingSeconds,
  shouldAutoStopTimer,
  shouldNotifyStopwatchGoal,
} from "./elapsed.helper";
export {
  encodeAppIconPng,
  encodeRingPng,
  encodeTrayTemplatePng,
} from "./icon.helper";
export {
  buildActivityFilterOptions,
  buildBacklogFilterOptions,
  buildManualSessionOptions,
  buildHistoryDayGroups,
  buildHistoryEntries,
  filterRecordsByBacklogSession,
  filterRecordsByStartedAtRange,
  parseDatetimeLocalValue,
  resolveRecordColor,
} from "./history.helper";
export {
  buildLiveStartRecord,
  buildManualRecord,
  buildPausedRecord,
  buildResumedRecord,
  buildStoppedRecord,
  buildUpdatedRecord,
  normalizeScope,
  parseMinutesInput,
  clampSessionName,
  SESSION_NAME_MAX_LENGTH,
  resolveRecordIdentity,
  assertSavedSessionNotInUse,
  validateDeleteRecord,
  validateManualRecord,
  validateSavedSessionName,
  validateSavedSessionReorder,
  shouldOfferSaveAsActivity,
  validateStartSession,
  validateUpdateRecord,
  validateUpdateSavedSession,
  pickDefaultSessionColor,
} from "./session.helper";
export {
  DICTATION_WAVEFORM_BAR_COUNT,
  DICTATION_WAVEFORM_SAMPLE_INTERVAL_MS,
  createIdleWaveformLevels,
  getRmsAmplitude,
  pushWaveformLevel,
} from "./dictation-waveform.helper";
export {
  DURATION_PRESET_MINUTES,
  combineDurationHms,
  formatDurationChipLabel,
  formatDurationHms,
  isPresetDurationMinutes,
  isPresetDurationSeconds,
  padDurationUnit,
  splitDurationHms,
} from "./duration-preset.helper";
export { resolveZoomFactor } from "./window-zoom.helper";
export {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  parseDurationPreset,
  parseStoredSettings,
  resolveBreakDurationMinutes,
  resolveDurationMinutes,
} from "./settings.helper";
export {
  playGoalReachedSound,
  playTimerEndedSound,
  unlockTimerSound,
} from "./timer-sound.helper";
