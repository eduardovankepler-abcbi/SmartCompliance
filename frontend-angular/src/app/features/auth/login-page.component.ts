import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-page">
      <form class="login-panel" aria-labelledby="login-title" [formGroup]="form" (ngSubmit)="submit()">
        <div class="login-panel__brand-card">
          <img src="logo_abc_app.png" alt="abc technology group" />
        </div>
        <p class="login-panel__product">SmartCompliance</p>
        <h1 id="login-title">Acessar workspace</h1>
        <p class="login-panel__intro">Use suas credenciais corporativas para continuar.</p>

        @if (errorMessage()) {
          <p class="login-panel__error" role="alert">{{ errorMessage() }}</p>
        }

        <label>
          E-mail
          <input type="email" autocomplete="email" formControlName="email" />
        </label>

        <label>
          Senha
          <input type="password" autocomplete="current-password" formControlName="password" />
        </label>

        <button type="submit" [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Acessando...' : 'Acessar' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    .login-page {
      display: grid;
      min-height: 100vh;
      padding: 24px;
      background: var(--abc-surface-muted);
      place-items: center;
    }

    .login-panel {
      width: min(100%, 424px);
      padding: 32px;
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: 12px;
      box-shadow: 0 16px 40px rgb(15 23 42 / 8%);
    }

    .login-panel__brand-card {
      padding: 12px 14px;
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: var(--abc-radius);
    }

    .login-panel__brand-card img {
      display: block;
      width: 100%;
      height: 52px;
      object-fit: contain;
    }

    .login-panel__product {
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

    .login-panel__intro {
      margin: 8px 0 0;
      color: var(--abc-text-muted);
      line-height: 1.5;
    }

    .login-panel__error {
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
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigateByUrl('/app');
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError ? error.message : 'Nao foi possivel iniciar a sessao.',
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
