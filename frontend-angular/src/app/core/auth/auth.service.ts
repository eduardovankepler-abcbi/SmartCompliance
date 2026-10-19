import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClient } from '../http/api-client.service';
import { AuthUser, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(null);
  readonly isRestoringSession = signal(true);

  private restorePromise: Promise<void> | null = null;

  constructor(
    private readonly api: ApiClient,
  ) {}

  restoreSession(): Promise<void> {
    if (!this.restorePromise || !this.user()) {
      this.restorePromise = this.loadSession();
    }

    return this.restorePromise;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/api/auth/login', { email, password }),
    );

    this.user.set(response.user);
    return response.user;
  }

  async changePassword(currentPassword: string, nextPassword: string): Promise<AuthUser> {
    const user = await firstValueFrom(
      this.api.post<AuthUser>('/api/auth/change-password', { currentPassword, nextPassword }),
    );

    this.user.set(user);
    return user;
  }

  logout(): void {
    void firstValueFrom(this.api.post<void>('/api/auth/logout')).catch(() => undefined);
    this.user.set(null);
  }

  private async loadSession(): Promise<void> {
    try {
      const user = await firstValueFrom(this.api.get<AuthUser>('/api/auth/me'));
      this.user.set(user);
    } catch {
      this.user.set(null);
    } finally {
      this.isRestoringSession.set(false);
    }
  }
}
