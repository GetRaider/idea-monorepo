"use client";

import { useEffect, useId, useRef, useState } from "react";
import { apiServices } from "@/services/api";
import { tasksHelper } from "@/helpers/task.helper";
import { CloseIcon } from "@/components/Icons";
import { SecondaryButton, CloseButton } from "@/components/Buttons";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  HeaderContent,
  ModalDescription,
  OptimizationContent,
  SummarySection,
  SummaryText,
  WorkloadGrid,
  WorkloadCard,
  WorkloadLabel,
  WorkloadValue,
  RecommendationsSection,
  SectionTitle,
  RecommendationCard,
  TaskName,
  ScheduleChange,
  ArrowIcon,
  ReasonText,
  RisksList,
  RiskItem,
  InsightsList,
  InsightItem,
  LoadingContainer,
  Spinner,
  LoadingState,
  ErrorState,
  TaskSelectionSection,
  TaskSelectionHeader,
  TaskCheckbox,
  TaskLabel,
  SelectAllRow,
  GenerateOptimizationButton,
  ActionsContainer,
  OptimizeButton,
} from "./AIPlanningOptimizationModal.styles";
import { useTasks } from "@/hooks/useTasks";

interface AIPlanningOptimizationModalProps {
  onClose: () => void;
}

interface ScheduleOptimization {
  summary: string;
  currentWorkload: {
    today: number;
    tomorrow: number;
    unscheduled: number;
  };
  recommendations: Array<{
    taskId: string;
    taskSummary: string;
    currentSchedule: string | null;
    suggestedSchedule: string | null;
    reason: string;
  }>;
  risks: string[];
  insights: string[];
}

export function AIPlanningOptimizationModal({
  onClose,
}: AIPlanningOptimizationModalProps) {
  const modalTitleId = useId();
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [exploration, setExploration] = useState<ScheduleOptimization | null>(
    null,
  );
  const [isExploring, setIsExploring] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tasks, isLoading: isTasksLoading } = useTasks();

  useEffect(() => {
    const prevFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFirst = () => {
      const root = modalContentRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
      );

      (focusables[0] ?? root).focus?.();
    };

    focusFirst();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;
      const root = modalContentRef.current;
      if (!root) return;

      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
      );

      if (focusables.length === 0) {
        e.preventDefault();
        root.focus?.();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!active || active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      prevFocused?.focus?.();
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const allSelected = tasks.length > 0 && selectedTaskIds.size === tasks.length;

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedTaskIds(
      allSelected ? new Set() : new Set(tasks.map((t) => t.id)),
    );
  };

  const sanitizeText = (text: string): string => {
    const taskMap = new Map(tasks.map((tasks) => [tasks.id, tasks.summary]));
    let sanitized = text;
    taskMap.forEach((summary, id) => {
      sanitized = sanitized.replace(new RegExp(id, "g"), `"${summary}"`);
    });
    return sanitized;
  };

  const handleExplore = async () => {
    if (selectedTaskIds.size === 0) return;

    setIsExploring(true);
    setError(null);

    try {
      const result = await apiServices.tasks.optimizeSchedule(
        Array.from(selectedTaskIds),
      );

      const sanitized = {
        ...result.optimization,
        summary: sanitizeText(result.optimization.summary),
        risks: result.optimization.risks.map(sanitizeText),
        insights: result.optimization.insights.map(sanitizeText),
        recommendations: result.optimization.recommendations.map((rec) => ({
          ...rec,
          reason: sanitizeText(rec.reason),
        })),
      };

      setExploration(sanitized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to explore");
    } finally {
      setIsExploring(false);
    }
  };

  const handleOptimize = async () => {
    if (!exploration) return;

    setIsOptimizing(true);
    setError(null);

    try {
      // Apply schedule changes from recommendations
      const updates = exploration.recommendations
        .filter((rec) => rec.suggestedSchedule !== null)
        .map((rec) => ({
          taskId: rec.taskId,
          scheduleDate: new Date(rec.suggestedSchedule as string),
        }));

      const results = await Promise.allSettled(
        updates.map((update) =>
          apiServices.tasks.update(update.taskId, {
            scheduleDate: update.scheduleDate,
          }),
        ),
      );

      const rejected = results
        .map((result, idx) => ({ result, idx }))
        .filter(({ result }) => result.status === "rejected") as {
        result: PromiseRejectedResult;
        idx: number;
      }[];

      if (rejected.length > 0) {
        const failedTaskIds = rejected
          .slice(0, 5)
          .map(({ idx }) => updates[idx].taskId);
        console.error(
          "[AIPlanningOptimizationModal] Failed task updates:",
          rejected,
        );
        setError(
          `Failed to update ${rejected.length} task(s): ${failedTaskIds.join(", ")}.`,
        );
        return;
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize");
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatSchedule = (schedule: string | null): string => {
    if (!schedule) return "Unscheduled";
    const date = new Date(schedule);
    if (!isNaN(date.getTime())) {
      return tasksHelper.date.formatForSchedule(date);
    }
    return schedule;
  };

  return (
    <ModalOverlay
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      onClick={handleOverlayClick}
    >
      <ModalContent ref={modalContentRef} tabIndex={-1}>
        <ModalHeader>
          <HeaderContent>
            <ModalTitle id={modalTitleId}>
              ⏳ AI Planning Optimization
            </ModalTitle>
            <ModalDescription>
              Explore Planning Optimization with AI-powered analysis based on
              priorities, schedules, due dates, and estimations.
            </ModalDescription>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </ModalHeader>
        {!exploration && !isExploring && (
          <>
            <TaskSelectionHeader>
              <SectionTitle>Select tasks to explore</SectionTitle>
              {!isTasksLoading && tasks.length > 0 && (
                <SelectAllRow onClick={toggleAll}>
                  {allSelected ? "Deselect all" : "Select all"}
                </SelectAllRow>
              )}
            </TaskSelectionHeader>
            <TaskSelectionSection>
              {isTasksLoading ? (
                <LoadingContainer>
                  <Spinner />
                  <LoadingState>Loading tasks...</LoadingState>
                </LoadingContainer>
              ) : (
                tasks.map((task) => (
                  <TaskLabel key={task.id}>
                    <TaskCheckbox
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span>{task.summary}</span>
                  </TaskLabel>
                ))
              )}
            </TaskSelectionSection>

            <ActionsContainer>
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <GenerateOptimizationButton
                onClick={handleExplore}
                disabled={selectedTaskIds.size === 0}
              >
                ✨ Explore
              </GenerateOptimizationButton>
            </ActionsContainer>
          </>
        )}
        {isExploring && (
          <LoadingContainer>
            <Spinner />
            <LoadingState>Exploring planning optimization...</LoadingState>
          </LoadingContainer>
        )}
        {error && <ErrorState>{error}</ErrorState>}

        {exploration && !isExploring && (
          <OptimizationContent>
            <SummarySection>
              <SummaryText>{exploration.summary}</SummaryText>
            </SummarySection>

            <WorkloadGrid>
              <WorkloadCard>
                <WorkloadLabel>Today</WorkloadLabel>
                <WorkloadValue>
                  {exploration.currentWorkload.today}h
                </WorkloadValue>
              </WorkloadCard>
              <WorkloadCard>
                <WorkloadLabel>Tomorrow</WorkloadLabel>
                <WorkloadValue>
                  {exploration.currentWorkload.tomorrow}h
                </WorkloadValue>
              </WorkloadCard>
              <WorkloadCard>
                <WorkloadLabel>Unscheduled</WorkloadLabel>
                <WorkloadValue>
                  {exploration.currentWorkload.unscheduled}h
                </WorkloadValue>
              </WorkloadCard>
            </WorkloadGrid>

            {exploration.recommendations.length > 0 && (
              <RecommendationsSection>
                <SectionTitle>📋 Recommendations</SectionTitle>
                {exploration.recommendations.map((rec, idx) => (
                  <RecommendationCard key={idx}>
                    <TaskName>{rec.taskSummary}</TaskName>
                    <ScheduleChange>
                      {formatSchedule(rec.currentSchedule)}
                      <ArrowIcon>→</ArrowIcon>
                      <strong
                        aria-label={`Updated schedule to ${formatSchedule(rec.suggestedSchedule)}`}
                      >
                        {formatSchedule(rec.suggestedSchedule)}
                      </strong>
                    </ScheduleChange>
                    <ReasonText>{rec.reason}</ReasonText>
                  </RecommendationCard>
                ))}
              </RecommendationsSection>
            )}

            {exploration.risks.length > 0 && (
              <RecommendationsSection>
                <SectionTitle>⚠️ Risks</SectionTitle>
                <RisksList>
                  {exploration.risks.map((risk, idx) => (
                    <RiskItem key={idx} aria-label={`Risk: ${risk}`}>
                      {risk}
                    </RiskItem>
                  ))}
                </RisksList>
              </RecommendationsSection>
            )}

            {exploration.insights.length > 0 && (
              <RecommendationsSection>
                <SectionTitle>💡 Insights</SectionTitle>
                <InsightsList>
                  {exploration.insights.map((insight, idx) => (
                    <InsightItem key={idx}>{insight}</InsightItem>
                  ))}
                </InsightsList>
              </RecommendationsSection>
            )}

            <ActionsContainer>
              <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
              <OptimizeButton onClick={handleOptimize} disabled={isOptimizing}>
                {isOptimizing ? "Optimizing..." : "✨ Optimize"}
              </OptimizeButton>
            </ActionsContainer>
          </OptimizationContent>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}
