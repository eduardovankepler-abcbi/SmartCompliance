import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/http/api-client.service';

export interface Area {
  id: string;
  name: string;
  managerPersonId?: string | null;
  managerName?: string | null;
  peopleCount?: number;
}

export interface AreaPayload {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AreasService {
  private readonly api = inject(ApiClient);

  list(): Observable<Area[]> {
    return this.api.get<Area[]>('/api/areas');
  }

  create(payload: AreaPayload): Observable<Area> {
    return this.api.post<Area>('/api/areas', payload);
  }

  update(areaId: string, payload: AreaPayload): Observable<Area> {
    return this.api.patch<Area>(`/api/areas/${areaId}`, payload);
  }
}
