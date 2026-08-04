import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export type IncidentAnonymity = 'anonymous' | 'identified';
export type IncidentStatus = 'Em triagem' | 'Em apuracao' | 'Aguardando retorno' | 'Concluido';

export interface Incident {
  id: string;
  protocol: string;
  title: string;
  category: string;
  classification: string;
  status: IncidentStatus;
  anonymity: IncidentAnonymity;
  reporterLabel: string;
  responsibleArea: string;
  assignedPersonId: string | null;
  assignedPersonName: string;
  assignedTo: string;
  areaManagerPersonId: string | null;
  areaManagerName: string;
  description: string;
  createdAt: string;
  dueAt: string | null;
  closedAt: string | null;
  closureNote: string;
}

export interface CreateIncidentPayload {
  title: string;
  category: string;
  classification: string;
  anonymity: IncidentAnonymity;
  reporterLabel: string;
  responsibleArea: string;
  assignedPersonId: string | null;
  description: string;
}

export interface UpdateIncidentPayload {
  classification: string;
  status: IncidentStatus;
  responsibleArea: string;
  assignedPersonId: string | null;
  closureNote: string;
}

@Injectable({ providedIn: 'root' })
export class IncidentsService {
  private readonly api = inject(ApiClient);
  list(): Observable<Incident[]> { return this.api.get<Incident[]>('/api/incidents'); }
  create(payload: CreateIncidentPayload): Observable<Incident> { return this.api.post<Incident>('/api/incidents', payload); }
  update(id: string, payload: UpdateIncidentPayload): Observable<Incident> { return this.api.patch<Incident>(`/api/incidents/${id}`, payload); }
}
