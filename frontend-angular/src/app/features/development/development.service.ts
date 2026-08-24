import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export interface DevelopmentRecord {
  id: string;
  personId: string;
  personName: string;
  recordType: string;
  title: string;
  providerName: string;
  completedAt: string;
  skillSignal: string;
  notes: string;
  status: string;
  archivedAt: string | null;
}

export interface DevelopmentPlan {
  id: string;
  personId: string;
  personName: string;
  cycleId: string | null;
  cycleTitle: string;
  cycleSemesterLabel: string;
  competencyId: string | null;
  competencyName: string;
  focusTitle: string;
  actionText: string;
  dueDate: string;
  expectedEvidence: string;
  status: string;
  progressStatus: string;
  progressNote: string;
  progressUpdatedAt: string | null;
  isComplianceRequired: boolean;
  complianceRequiredAt: string | null;
  complianceRequiredByUserId: string | null;
  createdAt: string;
  archivedAt: string | null;
}

export type DevelopmentRecordPayload = Pick<
  DevelopmentRecord,
  'personId' | 'recordType' | 'title' | 'providerName' | 'completedAt' | 'skillSignal' | 'notes'
>;

export type DevelopmentPlanPayload = Pick<
  DevelopmentPlan,
  | 'personId'
  | 'cycleId'
  | 'competencyId'
  | 'focusTitle'
  | 'actionText'
  | 'dueDate'
  | 'expectedEvidence'
  | 'isComplianceRequired'
>;

export interface DevelopmentPlanExtension {
  id: string;
  planId: string;
  requestedDueDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedByUserId: string;
  requestedAt: string;
  decidedByUserId: string | null;
  decidedAt: string | null;
  leaderAreaName: string | null;
  decisionNote: string;
  planTitle?: string;
  personId?: string;
  personName?: string;
  currentDueDate?: string | null;
}

export interface DevelopmentProgressPayload {
  progressStatus: string;
  progressNote: string;
}

export interface LearningIntegrationEvent {
  id: string;
  sourceSystem: string;
  externalId: string;
  personEmail: string;
  personDocument: string | null;
  personId: string | null;
  personName: string;
  eventType: string;
  title: string;
  providerName: string;
  status: string;
  occurredAt: string | null;
  workloadHours: number | null;
  competencyKey: string | null;
  suggestedAction: 'development_record_candidate' | 'development_plan_candidate';
  processingStatus: 'ready_for_review' | 'needs_review' | 'applied';
  appliedEntityType: string | null;
  appliedEntityId: string | null;
  appliedAt: string | null;
  reviewNote: string;
}

export interface ApplyLearningEventPayload {
  personId: string;
  competencyId?: string;
  dueDate?: string;
  reviewNote?: string;
}

@Injectable({ providedIn: 'root' })
export class DevelopmentService {
  private readonly api = inject(ApiClient);

  listRecords(): Observable<DevelopmentRecord[]> {
    return this.api.get<DevelopmentRecord[]>('/api/development/records');
  }

  listPlans(): Observable<DevelopmentPlan[]> {
    return this.api.get<DevelopmentPlan[]>('/api/development/plans');
  }

  createRecord(payload: DevelopmentRecordPayload): Observable<DevelopmentRecord> {
    return this.api.post<DevelopmentRecord>('/api/development/records', payload);
  }

  updateRecord(
    recordId: string,
    payload: DevelopmentRecordPayload & { status: string },
  ): Observable<DevelopmentRecord> {
    return this.api.patch<DevelopmentRecord>(`/api/development/records/${recordId}`, payload);
  }

  createPlan(payload: DevelopmentPlanPayload): Observable<DevelopmentPlan> {
    return this.api.post<DevelopmentPlan>('/api/development/plans', payload);
  }

  updatePlan(
    planId: string,
    payload: DevelopmentPlanPayload & { status: string },
  ): Observable<DevelopmentPlan> {
    return this.api.patch<DevelopmentPlan>(`/api/development/plans/${planId}`, payload);
  }

  updatePlanProgress(
    planId: string,
    payload: DevelopmentProgressPayload,
  ): Observable<DevelopmentPlan> {
    return this.api.patch<DevelopmentPlan>(`/api/development/plans/${planId}/progress`, payload);
  }

  listPlanExtensions(): Observable<DevelopmentPlanExtension[]> {
    return this.api.get<DevelopmentPlanExtension[]>('/api/development/plans/extensions');
  }

  requestPlanExtension(
    planId: string,
    payload: { requestedDueDate: string; reason: string },
  ): Observable<DevelopmentPlanExtension> {
    return this.api.post<DevelopmentPlanExtension>(`/api/development/plans/${planId}/extensions`, payload);
  }

  decidePlanExtension(
    planId: string,
    extensionId: string,
    payload: { status: 'approved' | 'rejected' | 'cancelled'; decisionNote: string },
  ): Observable<DevelopmentPlanExtension> {
    return this.api.patch<DevelopmentPlanExtension>(`/api/development/plans/${planId}/extensions/${extensionId}`, payload);
  }

  listLearningEvents(): Observable<LearningIntegrationEvent[]> {
    return this.api.get<LearningIntegrationEvent[]>(
      '/api/development/integrations/learning-events',
    );
  }

  applyLearningEvent(
    eventId: string,
    payload: ApplyLearningEventPayload,
  ): Observable<{ event: LearningIntegrationEvent; appliedEntity: DevelopmentRecord | DevelopmentPlan }> {
    return this.api.post<{
      event: LearningIntegrationEvent;
      appliedEntity: DevelopmentRecord | DevelopmentPlan;
    }>(`/api/development/integrations/learning-events/${eventId}/apply`, payload);
  }
}
