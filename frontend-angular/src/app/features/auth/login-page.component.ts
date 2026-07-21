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
        <p class="login-panel__brand">Smart Compliance</p>
        <h1 id="login-title">Acessar</h1>
        <p class="login-panel__intro">Use suas credenciais corporativas.</p>

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
      place-items: center;
    }

    .login-panel {
      width: min(100%, 400px);
      padding: 32px;
      background: #ffffff;
      border: 1px solid #d0d5dd;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgb(16 24 40 / 8%);
    }

    .login-panel__brand {
      margin: 0 0 24px;
      color: #344054;
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    .login-panel__intro {
      color: #475467;
      line-height: 1.5;
    }

    .login-panel__error {
      padding: 10px 12px;
      color: #b42318;
      background: #fef3f2;
      border: 1px solid #fecdca;
      border-radius: 6px;
    }

    label {
      display: grid;
      gap: 6px;
      margin-top: 16px;
      color: #344054;
      font-weight: 600;
    }

    input {
      width: 100%;
      min-height: 40px;
      padding: 8px 10px;
      color: #1d2939;
      background: #ffffff;
      border: 1px solid #98a2b3;
      border-radius: 6px;
    }

    input:focus {
      outline: 2px solid #84adff;
      outline-offset: 1px;
      border-color: #175cd3;
    }

    button {
      width: 100%;
      min-height: 40px;
      margin-top: 24px;
      color: #ffffff;
      font-weight: 600;
      cursor: pointer;
      background: #175cd3;
      border: 0;
      border-radius: 6px;
    }

    button:disabled {
      cursor: wait;
      background: #84adff;
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
