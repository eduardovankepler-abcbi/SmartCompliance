import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClient } from '../http/api-client.service';
import { TokenStorageService } from './token-storage.service';
import { AuthUser, LoginResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(null);
  readonly isRestoringSession = signal(true);

  private restorePromise: Promise<void> | null = null;

  constructor(
    private readonly api: ApiClient,
    private readonly tokenStorage: TokenStorageService,
  ) {}

  restoreSession(): Promise<void> {
    if (!this.restorePromise) {
      this.restorePromise = this.loadSession();
    }

    return this.restorePromise;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await firstValueFrom(
      this.api.post<LoginResponse>('/api/auth/login', { email, password }),
    );

    this.tokenStorage.setToken(response.token);
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
    this.tokenStorage.clearToken();
    this.user.set(null);
  }

  private async loadSession(): Promise<void> {
    if (!this.tokenStorage.getToken()) {
      this.isRestoringSession.set(false);
      return;
    }

    try {
      const user = await firstValueFrom(this.api.get<AuthUser>('/api/auth/me'));
      this.user.set(user);
    } catch {
      this.tokenStorage.clearToken();
      this.user.set(null);
    } finally {
      this.isRestoringSession.set(false);
    }
  }
}
