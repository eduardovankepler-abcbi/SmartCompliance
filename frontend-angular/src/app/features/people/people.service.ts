import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export type EmploymentType = 'internal' | 'consultant';
export type WorkMode = 'onsite' | 'hybrid' | 'remote';

export interface Person {
  id: string;
  name: string;
  roleTitle: string;
  area: string;
  workUnit: string | null;
  workMode: WorkMode | null;
  managerPersonId: string | null;
  managerName: string | null;
  areaManagerPersonId: string | null;
  areaManagerName: string | null;
  employmentType: EmploymentType;
}

export interface PersonPayload {
  name: string;
  roleTitle: string;
  area: string;
  workUnit: string;
  workMode: WorkMode;
  managerPersonId: string | null;
  isAreaManager: 'yes' | 'no';
  employmentType: EmploymentType;
}

@Injectable({ providedIn: 'root' })
export class PeopleService {
  private readonly api = inject(ApiClient);

  list(): Observable<Person[]> {
    return this.api.get<Person[]>('/api/people');
  }

  create(payload: PersonPayload): Observable<Person> {
    return this.api.post<Person>('/api/people', payload);
  }

  update(personId: string, payload: PersonPayload): Observable<Person> {
    return this.api.patch<Person>(`/api/people/${personId}`, payload);
  }
}
