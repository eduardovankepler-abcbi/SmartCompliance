import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client.service';

export interface AuditEntry {
  id: string;
  category: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  actorUserId: string | null;
  actorName: string;
  actorRoleKey: string;
  summary: string;
  detail: string;
  createdAt: string;
}

export interface AuditFilters {
  category?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api=inject(ApiClient);
  list(category?: string, limit=6, filters: AuditFilters = {}):Observable<AuditEntry[]>{
    const p=new URLSearchParams({limit:String(limit)});
    if(category)p.set('category',category);
    for (const [key, value] of Object.entries(filters)) {
      if (value) p.set(key, value);
    }
    return this.api.get<AuditEntry[]>(`/api/audit-trail?${p}`);
  }
}
