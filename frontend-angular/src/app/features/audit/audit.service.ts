import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client.service';

export interface AuditEntry { id: string; summary: string; detail: string; actorName: string; actorRoleKey: string; createdAt: string; }
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api=inject(ApiClient);
  list(category: string, limit=6, filters: { entityType?: string; entityId?: string } = {}):Observable<AuditEntry[]>{
    const p=new URLSearchParams({category,limit:String(limit)});
    if(filters.entityType)p.set('entityType',filters.entityType);
    if(filters.entityId)p.set('entityId',filters.entityId);
    return this.api.get<AuditEntry[]>(`/api/audit-trail?${p}`);
  }
}
