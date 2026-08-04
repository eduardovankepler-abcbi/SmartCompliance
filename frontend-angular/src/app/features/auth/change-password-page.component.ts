import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';

@Component({
  selector: 'app-change-password-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="password-page">
      <form class="password-panel" aria-labelledby="password-title" [formGroup]="form" (ngSubmit)="submit()">
        <div class="password-panel__brand-card">
          <img src="logo_abc_app.png" alt="abc technology group" />
        </div>
        <p class="password-panel__product">SmartCompliance</p>
        <h1 id="password-title">Atualizar senha</h1>
        <p class="password-panel__intro">Defina uma senha permanente para continuar.</p>

        @if (errorMessage()) {
          <p class="password-panel__error" role="alert">{{ errorMessage() }}</p>
        }

        <label>
          Senha atual
          <input type="password" autocomplete="current-password" formControlName="currentPassword" />
        </label>

        <label>
          Nova senha
          <input type="password" autocomplete="new-password" formControlName="nextPassword" />
        </label>

        <label>
          Confirmar nova senha
          <input type="password" autocomplete="new-password" formControlName="confirmPassword" />
        </label>

        <button type="submit" [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Atualizando...' : 'Atualizar senha' }}
        </button>

        <button class="password-panel__logout" type="button" (click)="logout()">
          Sair
        </button>
      </form>
    </main>
  `,
  styles: `
    .password-page {
      display: grid;
      min-height: 100vh;
      padding: 24px;
      background: var(--abc-surface-muted);
      place-items: center;
    }

    .password-panel {
      width: min(100%, 424px);
      padding: 32px;
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: 12px;
      box-shadow: 0 16px 40px rgb(15 23 42 / 8%);
    }

    .password-panel__brand-card {
      padding: 12px 14px;
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: var(--abc-radius);
    }

    .password-panel__brand-card img {
      display: block;
      width: 100%;
      height: 52px;
      object-fit: contain;
    }

    .password-panel__product {
      margin: 16px 0 4px;
      color: var(--abc-blue-dark);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--abc-text);
      font-size: 24px;
      font-weight: 800;
      line-height: 1.2;
    }

    .password-panel__intro {
      margin: 8px 0 0;
      color: var(--abc-text-muted);
      line-height: 1.5;
    }

    .password-panel__error {
      margin: 18px 0 0;
      padding: 10px 12px;
      color: var(--abc-danger);
      background: color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface));
      border: 1px solid color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border));
      border-radius: var(--abc-radius);
    }

    label {
      display: grid;
      gap: 6px;
      margin-top: 16px;
      color: var(--abc-text);
      font-size: 14px;
      font-weight: 700;
    }

    input {
      width: 100%;
      min-height: 42px;
      padding: 9px 11px;
      color: var(--abc-text);
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: var(--abc-radius);
    }

    input:focus {
      outline: 2px solid var(--abc-blue);
      outline-offset: 1px;
      border-color: var(--abc-blue);
    }

    button {
      width: 100%;
      min-height: 42px;
      margin-top: 24px;
      color: var(--abc-on-blue);
      font-weight: 700;
      cursor: pointer;
      background: var(--abc-blue);
      border: 0;
      border-radius: var(--abc-radius);
    }

    button:hover:not(:disabled) {
      background: var(--abc-blue-dark);
    }

    button:disabled {
      cursor: wait;
      opacity: 0.72;
    }

    .password-panel__logout {
      margin-top: 10px;
      color: var(--abc-text);
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
    }
  `,
})
export class ChangePasswordPageComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    nextPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, nextPassword, confirmPassword } = this.form.getRawValue();
    if (nextPassword !== confirmPassword) {
      this.errorMessage.set('A confirmacao deve ser igual a nova senha.');
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      await this.auth.changePassword(currentPassword, nextPassword);
      await this.router.navigateByUrl('/app');
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError ? error.message : 'Nao foi possivel atualizar a senha.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
