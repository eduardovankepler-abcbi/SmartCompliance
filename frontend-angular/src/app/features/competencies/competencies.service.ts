import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export type CompetencyStatus = 'active' | 'inactive';

export interface Competency {
  id: string;
  name: string;
  key: string;
  description: string;
  status: CompetencyStatus;
}

export interface CompetencyPayload {
  name: string;
  key: string;
  description: string;
  status: CompetencyStatus;
}

@Injectable({ providedIn: 'root' })
export class CompetenciesService {
  private readonly api = inject(ApiClient);

  list(): Observable<Competency[]> {
    return this.api.get<Competency[]>('/api/competencies');
  }

  create(payload: CompetencyPayload): Observable<Competency> {
    return this.api.post<Competency>('/api/competencies', payload);
  }

  update(competencyId: string, payload: CompetencyPayload): Observable<Competency> {
    return this.api.patch<Competency>(`/api/competencies/${competencyId}`, payload);
  }
}
