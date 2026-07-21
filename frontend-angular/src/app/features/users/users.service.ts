import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../core/http/api-client.service';

export type UserRoleKey = 'admin' | 'hr' | 'manager' | 'employee' | 'compliance';
export type UserStatus = 'active' | 'inactive';
export interface AdminUser { id: string; personId: string; personName: string; personArea: string; personRoleTitle?: string; personWorkUnit?: string; personWorkMode?: string; managerName?: string; areaManagerName?: string; email: string; roleKey: UserRoleKey; status: UserStatus; }
export interface CreateUserPayload { personId: string; email: string; password: string; roleKey: UserRoleKey; status: UserStatus; }
export interface UpdateUserPayload { email: string; password: string; roleKey: UserRoleKey; status: UserStatus; }

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiClient);
  list(): Observable<AdminUser[]> { return this.api.get<AdminUser[]>('/api/users'); }
  create(payload: CreateUserPayload): Observable<AdminUser> { return this.api.post<AdminUser>('/api/users', payload); }
  update(id: string, payload: UpdateUserPayload): Observable<AdminUser> { return this.api.patch<AdminUser>(`/api/users/${id}`, payload); }
}
