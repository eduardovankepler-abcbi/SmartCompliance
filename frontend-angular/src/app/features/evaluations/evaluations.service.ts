import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export interface EvaluationCycle {
  id: string;
  title: string;
  semesterLabel: string;
  dueDate: string;
  targetGroup: string;
  status: string;
  libraryId: string;
  libraryName: string;
  modelName: string;
  isEnabled: boolean;
  participantCount?: number;
  raterCount?: number;
  supportsConfig?: boolean;
  moduleAvailability?: Record<string, boolean>;
  transversalConfig?: { defaultReviewersPerPerson: number; unitOverrides: Record<string, number> };
}

export interface EvaluationCyclePayload { libraryId: string | null; title: string; semesterLabel: string; dueDate: string; targetGroup: string; }
export interface CycleParticipant { personId: string; personName: string; personArea: string; personRoleTitle: string; personWorkUnit: string; personWorkMode: string; managerName: string; totalRaters: number; completedRaters: number; pendingRaters: number; }
export interface CycleDelinquent { id: string; reviewerUserId: string; reviewerName: string; revieweePersonId: string; revieweeName: string; relationshipType: string; dueDate: string; daysOverdue: number; reminderCount: number; lastReminderSentAt: string | null; }
export interface TransversalPerson { personId: string; reviewerUserId?: string; personName: string; personArea: string; personWorkUnit: string; personWorkMode: string; candidateCount?: number; assignedCount?: number; targetCount?: number; reason?: string; }
export interface TransversalPairing { pairingId?: string; reviewerUserId: string; reviewerName: string; reviewerArea: string; revieweePersonId: string; revieweeName: string; revieweeArea: string; workUnit: string; }
export interface EvaluationCycleStructure {
  cycle: { id: string; title: string; semesterLabel: string; status: string; dueDate: string; participantCount: number; raterCount: number; transversalConfig: { defaultReviewersPerPerson: number; unitOverrides: Record<string, number> } };
  compliance: { totalAssignments: number; submittedAssignments: number; pendingAssignments: number; delinquentAssignments: number; adherenceRate: number; delinquencyRate: number };
  participants: CycleParticipant[];
  delinquents: CycleDelinquent[];
  relationshipSummary: Array<{ relationshipType: string; total: number }>;
  transversal: { config: { defaultReviewersPerPerson: number; unitOverrides: Record<string, number> }; pairings: TransversalPairing[]; eligible: TransversalPerson[]; ineligible: TransversalPerson[]; indicators?: { coverageRate?: number; repeatedPairings?: number } };
}

export interface EvaluationFeedbackRequest {
  id: string; cycleId: string; cycleTitle: string; semesterLabel: string; cycleStatus: string;
  requesterUserId: string; requesterName: string; revieweePersonId: string; revieweeName: string;
  status: 'pending' | 'approved' | 'rejected'; contextNote: string; requestedAt: string;
  decidedAt: string | null; decidedByName: string;
  providers: Array<{ id: string; providerPersonId: string; providerName: string; assignmentId: string | null }>;
}

export interface ReceivedManagerFeedback {
  id: string; cycleId: string; cycleTitle?: string; semesterLabel?: string; relationshipType: string;
  reviewerName?: string; revieweePersonId: string; overallScore: number | null; strengthsNote: string;
  developmentNote: string; submittedAt: string; revieweeAcknowledgementStatus: 'agreed' | 'disagreed' | null;
  revieweeAcknowledgementNote: string; revieweeAcknowledgedAt: string | null;
}

export interface Performance360Review {
  personId: string; personName: string; personArea: string; cycleId: string; cycleTitle: string;
  semesterLabel: string; score10: number | null; confidenceLabel: string; isPartial: boolean;
  guidance: string; developmentPlanSuggestion: string; visibility: string;
}

export interface EvaluationAssignment {
  id: string;
  cycleId: string;
  cycleTitle: string;
  semesterLabel: string;
  cycleStatus: string;
  revieweePersonId: string;
  revieweeName: string;
  revieweeArea: string;
  reviewerUserId: string;
  reviewerName?: string;
  relationshipType: string;
  projectContext?: string;
  collaborationContext?: string;
  dueDate: string;
  status: 'pending' | 'submitted';
  submittedAt?: string | null;
  overallScore?: number | null;
}

export interface EvaluationQuestionOption {
  value: string;
  label: string;
}

export interface EvaluationQuestion {
  id: string;
  sectionKey?: string;
  sectionTitle?: string;
  sectionDescription?: string;
  dimensionKey?: string;
  dimensionTitle: string;
  prompt: string;
  helperText?: string;
  inputType: 'scale' | 'text' | 'multi-select';
  isRequired?: boolean;
  isSensitive?: boolean;
  visibility?: string;
  collectEvidenceOnExtreme?: boolean;
  options?: EvaluationQuestionOption[];
  sortOrder?: number;
}

export interface EvaluationScaleOption {
  value: number;
  label: string;
}

export interface EvaluationTemplate {
  id: string;
  key: string;
  title: string;
  description: string;
  relationshipType?: string;
  scale?: EvaluationScaleOption[];
  questions: EvaluationQuestion[];
  policy?: {
    showStrengthsNote?: boolean;
    showDevelopmentNote?: boolean;
  };
}

export interface EvaluationAssignmentDetail {
  assignment: EvaluationAssignment;
  template: EvaluationTemplate;
}

export interface EvaluationAnswerPayload {
  questionId: string;
  score: number | null;
  evidenceNote: string;
  textValue: string;
  selectedOptions: string[];
}

export interface SubmitEvaluationPayload {
  assignmentId: string;
  answers: EvaluationAnswerPayload[];
  strengthsNote: string;
  developmentNote: string;
}

export interface EvaluationLibrary {
  scale: EvaluationScaleOption[];
  defaultLibrary: { id: string; name: string; description: string; questionCount: number };
  manualLibrary: { id: string; name: string; description: string; questionCount: number };
  questionGroups: EvaluationTemplate[];
  cycleLibraries: Array<{ id: string; name: string; description: string; sourceType: string; questionCount: number }>;
  customLibraries?: CustomEvaluationLibrary[];
}

export interface CustomLibraryDraft { id: string; fileName: string; createdAt: string; errors: string[]; summary: { templates: number; questions: number; [key: string]: number }; templates: CustomLibraryTemplate[]; }
export interface CustomLibraryTemplate { id?: string; relationshipType: string; key?: string; modelName: string; description: string; policy?: Record<string, unknown>; questions: EvaluationQuestion[]; }
export interface CustomEvaluationLibrary { id: string; name: string; description: string; sourceFileName?: string; createdAt?: string; updatedAt?: string; templateCount: number; questionCount: number; templates: CustomLibraryTemplate[]; }

export interface LibraryQuestionPayload {
  relationshipType: string;
  sectionKey: string;
  sectionTitle: string;
  sectionDescription: string;
  dimensionKey: string;
  dimensionTitle: string;
  prompt: string;
  helperText: string;
  inputType: EvaluationQuestion['inputType'];
  visibility: string;
  sortOrder: number;
  isRequired: boolean;
  collectEvidenceOnExtreme: boolean;
  isSensitive: boolean;
  options: EvaluationQuestionOption[];
}

export interface EvaluationQuestionnaire {
  id: string;
  cycleId: string;
  revieweePersonId: string;
  relationshipType: 'manager' | 'self' | 'peer-same-area';
  sourceLibraryId: string | null;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  questionCount: number;
  visibilityLevel: string;
  versionNumber: number;
  publishedAt: string | null;
  questions: EvaluationQuestionnaireQuestion[];
  accessPolicy?: Record<string, boolean>;
}

export interface EvaluationQuestionnaireQuestion extends EvaluationQuestion {
  questionnaireId: string;
  promptText: string;
  sortOrder: number;
}

export interface QuestionnairePayload {
  cycleId: string;
  revieweePersonId: string;
  relationshipType: EvaluationQuestionnaire['relationshipType'];
  sourceLibraryId: string | null;
  title: string;
  description: string;
  visibilityLevel: string;
  accessPolicy?: Record<string, boolean>;
}

export interface QuestionnaireQuestionPayload {
  sectionKey: string;
  sectionTitle: string;
  sectionDescription: string;
  dimensionKey: string;
  dimensionTitle: string;
  promptText: string;
  helperText: string;
  inputType: EvaluationQuestion['inputType'];
  scaleProfile: string;
  visibility: string;
  sortOrder: number;
  isRequired: boolean;
  collectEvidenceOnExtreme: boolean;
  isSensitive: boolean;
  options: EvaluationQuestionOption[];
}

@Injectable({ providedIn: 'root' })
export class EvaluationsService {
  private readonly api = inject(ApiClient);

  listCycles(): Observable<EvaluationCycle[]> {
    return this.api.get<EvaluationCycle[]>('/api/evaluations/cycles');
  }

  listAssignments(): Observable<EvaluationAssignment[]> {
    return this.api.get<EvaluationAssignment[]>('/api/evaluations/assignments');
  }

  getAssignment(assignmentId: string): Observable<EvaluationAssignmentDetail> {
    return this.api.get<EvaluationAssignmentDetail>(`/api/evaluations/assignments/${assignmentId}`);
  }

  submit(payload: SubmitEvaluationPayload): Observable<unknown> {
    return this.api.post('/api/evaluations/submit', payload);
  }

  getLibrary(): Observable<EvaluationLibrary> { return this.api.get('/api/evaluations/library'); }
  createLibraryQuestion(payload: LibraryQuestionPayload): Observable<EvaluationLibrary> { return this.api.post('/api/evaluations/library/questions', payload); }
  updateLibraryQuestion(id: string, payload: LibraryQuestionPayload): Observable<EvaluationLibrary> { return this.api.patch(`/api/evaluations/library/questions/${id}`, payload); }
  deleteLibraryQuestion(id: string): Observable<EvaluationLibrary> { return this.api.delete(`/api/evaluations/library/questions/${id}`); }
  reorderLibraryQuestions(relationshipType: string, questionIds: string[]): Observable<EvaluationLibrary> { return this.api.post('/api/evaluations/library/questions/reorder', { relationshipType, questionIds }); }

  listQuestionnaires(): Observable<EvaluationQuestionnaire[]> { return this.api.get('/api/evaluations/questionnaires'); }
  createQuestionnaire(payload: QuestionnairePayload): Observable<EvaluationQuestionnaire> { return this.api.post('/api/evaluations/questionnaires', payload); }
  updateQuestionnaire(id: string, payload: QuestionnairePayload): Observable<EvaluationQuestionnaire> { return this.api.patch(`/api/evaluations/questionnaires/${id}`, payload); }
  publishQuestionnaire(id: string): Observable<EvaluationQuestionnaire> { return this.api.post(`/api/evaluations/questionnaires/${id}/publish`); }
  archiveQuestionnaire(id: string): Observable<EvaluationQuestionnaire> { return this.api.post(`/api/evaluations/questionnaires/${id}/archive`); }
  addQuestionnaireQuestion(id: string, payload: QuestionnaireQuestionPayload): Observable<EvaluationQuestionnaire> { return this.api.post(`/api/evaluations/questionnaires/${id}/questions`, payload); }
  updateQuestionnaireQuestion(id: string, payload: QuestionnaireQuestionPayload): Observable<EvaluationQuestionnaire> { return this.api.patch(`/api/evaluations/questionnaire-questions/${id}`, payload); }
  deleteQuestionnaireQuestion(id: string): Observable<EvaluationQuestionnaire> { return this.api.delete(`/api/evaluations/questionnaire-questions/${id}`); }
  reorderQuestionnaireQuestions(id: string, items: Array<{ questionId: string; sortOrder: number }>): Observable<EvaluationQuestionnaire> { return this.api.post(`/api/evaluations/questionnaires/${id}/reorder`, { items }); }

  createCycle(payload: EvaluationCyclePayload): Observable<EvaluationCycle> { return this.api.post('/api/evaluations/cycles', payload); }
  updateCycleStatus(id: string, status: string): Observable<EvaluationCycle> { return this.api.patch(`/api/evaluations/cycles/${id}/status`, { status }); }
  updateCycleConfig(id: string, payload: { isEnabled?: boolean; moduleAvailability?: Record<string, boolean>; transversalConfig?: { defaultReviewersPerPerson: number; unitOverrides: Record<string, number> } }): Observable<EvaluationCycle> { return this.api.patch(`/api/evaluations/cycles/${id}/config`, payload); }
  getCycleParticipants(id: string): Observable<EvaluationCycleStructure> { return this.api.get(`/api/evaluations/cycles/${id}/participants`); }
  notifyDelinquents(id: string): Observable<{ notified: number; assignments?: CycleDelinquent[] }> { return this.api.post(`/api/evaluations/cycles/${id}/notify-delinquents`); }
  forceTransversalPairing(id: string, payload: { reviewerUserId: string; revieweePersonId: string; reason: string }): Observable<EvaluationCycleStructure> { return this.api.post(`/api/evaluations/cycles/${id}/transversal-pairings/force`, payload); }
  blockTransversalPairing(cycleId: string, pairingId: string, reason: string): Observable<EvaluationCycleStructure> { return this.api.post(`/api/evaluations/cycles/${cycleId}/transversal-pairings/${pairingId}/block`, { reason }); }
  listFeedbackRequests(): Observable<EvaluationFeedbackRequest[]> { return this.api.get('/api/evaluations/feedback-requests'); }
  createFeedbackRequest(payload: { cycleId: string; providerPersonIds: string[]; contextNote: string }): Observable<EvaluationFeedbackRequest> { return this.api.post('/api/evaluations/feedback-requests', payload); }
  reviewFeedbackRequest(id: string, status: 'approved' | 'rejected'): Observable<EvaluationFeedbackRequest> { return this.api.patch(`/api/evaluations/feedback-requests/${id}`, { status }); }
  listReceivedFeedback(): Observable<ReceivedManagerFeedback[]> { return this.api.get('/api/evaluations/received-feedback'); }
  acknowledgeFeedback(id: string, status: 'agreed' | 'disagreed', note: string): Observable<ReceivedManagerFeedback> { return this.api.patch(`/api/evaluations/responses/${id}/acknowledgement`, { status, note }); }
  listPerformance360(): Observable<Performance360Review[]> { return this.api.get('/api/evaluations/performance-360'); }
  downloadCustomLibraryTemplate(): Observable<Blob> { return this.api.getBlob('/api/evaluations/custom-libraries/template'); }
  importCustomLibrary(file: File): Observable<CustomLibraryDraft> { const form=new FormData(); form.append('file',file); return this.api.postForm('/api/evaluations/custom-libraries/import',form); }
  publishCustomLibrary(payload: { draftId: string; name: string; description: string }): Observable<CustomEvaluationLibrary> { return this.api.post('/api/evaluations/custom-libraries/publish',payload); }
  updateCustomLibrary(id: string, payload: { name: string; description: string; templates?: CustomLibraryTemplate[] }): Observable<CustomEvaluationLibrary> { return this.api.patch(`/api/evaluations/custom-libraries/${id}`,payload); }
}
