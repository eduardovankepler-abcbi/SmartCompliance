import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export type ApplauseStatus = 'Validado' | 'Em revisao' | 'Arquivado';

export interface ApplauseEntry {
  id: string;
  senderPersonId: string;
  senderName: string;
  receiverPersonId: string;
  receiverName: string;
  category: string;
  impact: string;
  contextNote: string;
  createdAt: string;
  status: ApplauseStatus;
}

export interface ApplauseRecipient {
  id: string;
  name: string;
  roleTitle: string;
  area: string;
  workUnit: string | null;
  workMode: string | null;
  managerPersonId: string | null;
  managerName: string | null;
  areaManagerPersonId: string | null;
  areaManagerName: string | null;
  employmentType: string;
}

export interface ApplausePayload {
  receiverPersonId: string;
  category: string;
  impact: string;
  contextNote: string;
}

@Injectable({ providedIn: 'root' })
export class ApplauseService {
  private readonly api = inject(ApiClient);

  list(): Observable<ApplauseEntry[]> {
    return this.api.get<ApplauseEntry[]>('/api/applause');
  }

  recipients(): Observable<ApplauseRecipient[]> {
    return this.api.get<ApplauseRecipient[]>('/api/applause/recipients');
  }

  create(payload: ApplausePayload): Observable<ApplauseEntry> {
    return this.api.post<ApplauseEntry>('/api/applause', payload);
  }

  update(
    applauseId: string,
    payload: ApplausePayload & { status: ApplauseStatus },
  ): Observable<ApplauseEntry> {
    return this.api.patch<ApplauseEntry>(`/api/applause/${applauseId}`, payload);
  }
}
