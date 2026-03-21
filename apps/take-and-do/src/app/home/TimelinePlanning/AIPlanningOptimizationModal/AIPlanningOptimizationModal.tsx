"use client";

import { useId, useRef, useState } from "react";
import { apiServices } from "@/services/api";
import { tasksHelper } from "@/helpers/task.helper";
import { CloseIcon } from "@/components/Icons";
import { SelectList } from "@/components/SelectList";
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
  GenerateOptimizationButton,
  ActionsContainer,
  OptimizeButton,
} from "./AIPlanningOptimizationModal.styles";
import { useDialogFocusLock } from "@/hooks/useDialogFocusLock";
import { useTasks } from "@/hooks/useTasks";
import { Task } from "@/components/Boards/KanbanBoard/KanbanBoard";

export function AIPlanningOptimizationDialog({
  onClose,
}: AIPlanningOptimizationModalProps) {
  const modalTitleId = useId();
  const modalContentRef = useRef<HTMLDivElement>(null);

  const [isExploring, setIsExploring] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [exploration, setExploration] = useState<ScheduleOptimization | null>(
    null,
  );
  const { tasks, isLoading: isTasksLoading } = useTasks();

  useDialogFocusLock(modalContentRef, onClose);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
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
        summary: sanitizeText(result.optimization.summary, tasks),
        risks: result.optimization.risks.map((risk) =>
          sanitizeText(risk, tasks),
        ),
        insights: result.optimization.insights.map((insight) =>
          sanitizeText(insight, tasks),
        ),
        recommendations: result.optimization.recommendations.map((rec) => ({
          ...rec,
          reason: sanitizeText(rec.reason, tasks),
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
            <SelectList
              tasks={tasks}
              isLoading={isTasksLoading}
              selectedIds={selectedTaskIds}
              onSelectionChange={setSelectedTaskIds}
            />

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

            {exploration?.currentWorkload &&
              Object.entries(exploration.currentWorkload).map(
                ([schedule, workload]) => {
                  return (
                    <WorkloadGrid>
                      <WorkloadCard>
                        <WorkloadLabel>{schedule}</WorkloadLabel>
                        <WorkloadValue>{workload}h</WorkloadValue>
                      </WorkloadCard>
                    </WorkloadGrid>
                  );
                },
              )}

            {exploration.recommendations.length > 0 && (
              <RecommendationsSection>
                <SectionTitle>📋 Recommendations</SectionTitle>
                {exploration.recommendations.map((recommendation, index) => (
                  <RecommendationCard key={index}>
                    <TaskName>{recommendation.taskSummary}</TaskName>
                    <ScheduleChange>
                      {formatSchedule(recommendation.currentSchedule)}
                      <ArrowIcon>→</ArrowIcon>
                      <strong
                        aria-label={`Updated schedule to ${formatSchedule(recommendation.suggestedSchedule)}`}
                      >
                        {formatSchedule(recommendation.suggestedSchedule)}
                      </strong>
                    </ScheduleChange>
                    <ReasonText>{recommendation.reason}</ReasonText>
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

function sanitizeText(text: string, tasks: Task[]): string {
  const taskMap = new Map(tasks.map((tasks) => [tasks.id, tasks.summary]));
  let sanitized = text;
  taskMap.forEach((summary, id) => {
    sanitized = sanitized.replace(new RegExp(id, "g"), `"${summary}"`);
  });
  return sanitized;
}

function formatSchedule(schedule: string | null): string {
  if (!schedule) return "Unscheduled";
  const date = new Date(schedule);
  if (!isNaN(date.getTime())) {
    return tasksHelper.date.formatForSchedule(date);
  }
  return schedule;
}

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
