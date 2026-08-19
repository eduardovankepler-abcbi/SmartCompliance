import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export type DashboardTimeGrouping = 'cycle' | 'semester' | 'quarter' | 'year';
export type DashboardMode = 'executive' | 'team' | 'personal';
export type DashboardTone = 'positive' | 'warning' | 'critical' | 'neutral' | 'support';

export interface DashboardOverviewQuery {
  area?: string | null;
  teamManagerId?: string | null;
  timeGrouping?: DashboardTimeGrouping;
}

export interface DashboardScopeSummary {
  peopleCount: number;
  pendingAssignments: number;
  submittedAssignments: number;
  totalAssignments: number;
  developmentRecords: number;
  applauseEntries: number;
}

export interface DashboardCard {
  label: string;
  value: string;
  trend: string;
}

export interface DashboardDonutMetric {
  key: string;
  label: string;
  percentage: number;
  value: number;
  total: number;
  detail: string;
}

export interface DashboardSatisfactionByArea {
  area: string;
  peopleCount: number;
  score: string;
  scoreValue: number;
  percentage: number;
}

export interface DashboardDistributionOption {
  value: number;
  label: string | number;
  total: number;
  percentage: number;
}

export interface DashboardQuestionDistribution {
  questionId: string;
  questionPrompt: string;
  dimensionTitle: string;
  totalAnswers: number;
  options: DashboardDistributionOption[];
}

export interface DashboardResponseDistribution {
  relationshipType: string;
  totalResponses: number;
  questions: DashboardQuestionDistribution[];
}

export interface DashboardEvaluationMix {
  type: string;
  total: number;
  percentage: number;
}

export interface DashboardEvaluationResult {
  relationshipType: string;
  totalAssignments: number;
  totalResponses: number;
  adherencePercentage: number;
  averageScore: number | null;
  averageScoreLabel: string;
  tone: DashboardTone;
}

export interface DashboardAssignmentStatus {
  status: string;
  label: string;
  total: number;
  percentage: number;
}

export interface DashboardDevelopmentByType {
  type: string;
  total: number;
  percentage: number;
}

export interface DashboardCycleTimelineItem {
  key: string;
  label: string;
  totalAssignments: number;
  submittedAssignments: number;
  pendingAssignments: number;
  adherencePercentage: number;
  totalResponses: number;
  averageScore: number | null;
  averageScoreLabel: string;
}

export interface DashboardPerformanceArea {
  area: string;
  score10: number;
  scoreLabel: string;
  peopleCount: number;
  percentage: number;
  tone: DashboardTone;
}

export interface DashboardPerformanceDistribution {
  label: string;
  total: number;
  percentage: number;
  tone: DashboardTone;
}

export interface DashboardPerformanceHealth {
  averageScore10: number;
  averageScoreLabel: string;
  reviewCount: number;
  partialReadings: number;
  confidenceLabel: string;
  tone: DashboardTone;
  distribution: DashboardPerformanceDistribution[];
  areaSeries: DashboardPerformanceArea[];
  areaHighlights: DashboardPerformanceArea[];
  lowestArea: DashboardPerformanceArea | null;
  highestArea: DashboardPerformanceArea | null;
  recommendations: ReadonlyArray<Record<string, unknown>>;
  guidance: string;
}

export interface DashboardRiskSummary {
  openIncidents: number;
  overdueIncidents: number;
  unassignedIncidents: number;
  pendingAssignments: number;
  blockedDevelopmentPlans: number;
  notStartedDevelopmentPlans: number;
  pendingLearningEvents: number;
}

export interface DashboardOperationalAlert {
  key: string;
  label: string;
  value: number;
  tone: DashboardTone;
  detail: string;
}

export interface DashboardSatisfactionQuestionAnalytics {
  periodKey: string;
  periodLabel: string;
  questionId: string;
  questionPrompt: string;
  dimensionTitle: string;
  totalAnswers: number;
  averageScore: number | null;
  averageScoreLabel: string;
}

export interface DashboardPdiStatusItem {
  status: string;
  label: string;
  total: number;
  percentage: number;
}

export interface DashboardPdiEvolutionItem {
  periodKey: string;
  label: string;
  totalPlans: number;
  notStarted: number;
  inProgress: number;
  blocked: number;
  completed: number;
  overdue: number;
  stale: number;
  coveragePercentage: number;
  executionPercentage: number;
  completionPercentage: number;
  onTimePercentage: number;
}

export interface DashboardPdiCompetencyItem {
  competencyId: string;
  competencyName: string;
  peopleCount: number;
  responseCount: number;
  previousPeriodLabel: string;
  currentPeriodLabel: string;
  previousScore: number;
  currentScore: number;
  delta: number;
}

export interface DashboardPdiAnalytics {
  sampleSufficient: boolean;
  minimumAggregateSize: number;
  methodology: {
    competencySource: string;
    competencyScale: string;
    comparisonRule: string;
    dimensionMapping: string;
    historyAccuracy: string;
  };
  summary: {
    peopleCount: number;
    peopleWithPdi: number;
    peopleWithoutPdi: number;
    coveragePercentage: number;
    activePlans: number;
    executionPercentage: number;
    completionPercentage: number;
    onTimePercentage: number;
    blockedPlans: number;
    overduePlans: number;
    stalePlans: number;
    comparisonDelta: number;
  };
  comparison: {
    coverageDelta: number;
    executionDelta: number;
    completionDelta: number;
    onTimeDelta: number;
    blockedDelta: number;
    overdueDelta: number;
    staleDelta: number;
  };
  statusDistribution: DashboardPdiStatusItem[];
  evolution: DashboardPdiEvolutionItem[];
  competencyEvolution: DashboardPdiCompetencyItem[];
  competencyActionCoverage: Array<{
    competencyId: string;
    competencyName: string;
    evaluatedPeopleCount: number;
    latestScore: number | null;
    activePlanCount: number;
    developmentRecordCount: number;
    pendingLearningEventCount: number;
    hasDevelopmentAction: boolean;
  }>;
  competencyAlerts: Array<{
    key: string;
    competencyId: string;
    label: string;
    detail: string;
  }>;
  competencyPriorities: Array<{
    competencyId: string;
    competencyName: string;
    latestScore: number;
    gap: number;
    priorityScore: number;
    riskLevel: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  developmentRiskMatrix: Array<{
    level: 'high' | 'medium' | 'low';
    total: number;
    competencies: string[];
  }>;
  priorityActions: Array<{
    planId: string;
    personId: string;
    personName: string;
    competencyId: string;
    competencyName: string;
    focusTitle: string;
    actionText: string;
    dueDate: string;
    progressStatus: 'not_started' | 'in_progress' | 'blocked' | 'done';
    overdue: boolean;
  }>;
  priorityActionSummary: {
    notStarted: number;
    inProgress: number;
    blocked: number;
    done: number;
    overdue: number;
  };
}

export interface DashboardOverview {
  mode: DashboardMode;
  notice: string;
  scopeLabel: string;
  selectedArea: string | null;
  selectedTeamManagerId: string | null;
  areaOptions: string[];
  teamOptions: Array<{ managerPersonId: string; label: string; area: string; peopleCount: number }>;
  scopeSummary: DashboardScopeSummary;
  cards: DashboardCard[];
  donutMetrics: DashboardDonutMetric[];
  satisfactionByArea: DashboardSatisfactionByArea[];
  satisfactionQuestionAnalytics: DashboardSatisfactionQuestionAnalytics[];
  evaluationHighlights: string[];
  riskSummary: DashboardRiskSummary;
  operationalAlerts: DashboardOperationalAlert[];
  responseDistributions: DashboardResponseDistribution[];
  evaluationMix: DashboardEvaluationMix[];
  evaluationResultsSummary: DashboardEvaluationResult[];
  performanceHealth: DashboardPerformanceHealth | null;
  assignmentStatus: DashboardAssignmentStatus[];
  developmentByType: DashboardDevelopmentByType[];
  pdiAnalytics: DashboardPdiAnalytics;
  cycleTimeline: DashboardCycleTimelineItem[];
  timeGrouping: DashboardTimeGrouping;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiClient);

  getOverview(query: DashboardOverviewQuery = {}): Observable<DashboardOverview> {
    const params = new URLSearchParams();
    if (query.area) {
      params.set('area', query.area);
    }
    if (query.teamManagerId) {
      params.set('teamManagerId', query.teamManagerId);
    }
    if (query.timeGrouping) {
      params.set('timeGrouping', query.timeGrouping);
    }

    const suffix = params.size ? `?${params.toString()}` : '';
    return this.api.get<DashboardOverview>(`/api/dashboards/overview${suffix}`);
  }
}
