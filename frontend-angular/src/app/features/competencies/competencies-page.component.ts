import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../core/http/api-error';
import { AuthService } from '../../core/auth/auth.service';
import {
  Competency,
  CompetencyPayload,
  CompetenciesService,
} from './competencies.service';

@Component({
  selector: 'app-competencies-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="competencies" aria-labelledby="competencies-title">
      <header class="competencies__header">
        <div>
          <p class="competencies__eyebrow">Cadastro</p>
          <h1 id="competencies-title">Competencias</h1>
          <p>Gerencie as competencias usadas nos fluxos de desenvolvimento e avaliacao.</p>
        </div>
        @if (canManage()) {
          <button type="button" (click)="startCreate()">Nova competencia</button>
        }
      </header>

      @if (errorMessage()) {
        <p class="competencies__error" role="alert">{{ errorMessage() }}</p>
      }

      @if (isEditing()) {
        <form class="competencies__form" [formGroup]="form" (ngSubmit)="save()">
          <label>
            Nome da competencia
            <input formControlName="name" autocomplete="off" />
          </label>
          <label>
            Chave
            <input formControlName="key" autocomplete="off" />
          </label>
          <label>
            Status
            <select formControlName="status">
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </label>
          <label class="competencies__description">
            Descricao
            <textarea formControlName="description" rows="4"></textarea>
          </label>
          @if (validationMessage()) {
            <p class="competencies__validation" role="alert">{{ validationMessage() }}</p>
          }
          <div class="competencies__form-actions">
            <button type="button" class="competencies__secondary" (click)="cancelEdit()">
              Cancelar
            </button>
            <button type="submit" [disabled]="isSaving()">
              {{ isSaving() ? 'Salvando...' : selectedCompetency() ? 'Salvar alteracoes' : 'Cadastrar competencia' }}
            </button>
          </div>
        </form>
      }

      @if (isLoading()) {
        <p class="competencies__state">Carregando competencias...</p>
      } @else if (competencies().length === 0) {
        <p class="competencies__state">Nenhuma competencia cadastrada.</p>
      } @else {
        <div class="competencies__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Competencia</th>
                <th>Chave</th>
                <th>Status</th>
                @if (canManage()) {
                  <th><span class="visually-hidden">Acoes</span></th>
                }
              </tr>
            </thead>
            <tbody>
              @for (competency of competencies(); track competency.id) {
                <tr>
                  <td>
                    <strong>{{ competency.name }}</strong>
                    @if (competency.description) {
                      <small>{{ competency.description }}</small>
                    }
                  </td>
                  <td>{{ competency.key || '-' }}</td>
                  <td>
                    <span class="competencies__status" [class.competencies__status--inactive]="competency.status === 'inactive'">
                      {{ competency.status === 'active' ? 'Ativa' : 'Inativa' }}
                    </span>
                  </td>
                  @if (canManage()) {
                    <td>
                      <button type="button" class="competencies__secondary" (click)="startEdit(competency)">
                        Editar
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .competencies { max-width: 960px; }
    .competencies__header { display: flex; align-items: start; justify-content: space-between; gap: 24px; }
    .competencies__eyebrow { margin: 0 0 8px; color: var(--abc-blue); font-size: 13px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 24px; }
    .competencies__header p:not(.competencies__eyebrow), .competencies__state { color: var(--abc-text-muted); }
    button { min-height: 36px; padding: 0 12px; color: var(--abc-surface); font-weight: 600; cursor: pointer; background: var(--abc-blue); border: 0; border-radius: 6px; }
    button:disabled { cursor: wait; background: color-mix(in srgb, var(--abc-blue) 45%, var(--abc-surface)); }
    .competencies__secondary { color: var(--abc-text); background: var(--abc-surface); border: 1px solid var(--abc-text-muted); }
    .competencies__error, .competencies__form, .competencies__table-wrap { margin-top: 24px; background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; }
    .competencies__error, .competencies__validation { padding: 12px; color: var(--abc-danger); background: color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface)); border-color: color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border)); }
    .competencies__validation { grid-column: 1 / -1; margin: 0; border: 1px solid color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border)); border-radius: 8px; }
    .competencies__form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 20px; }
    label { display: grid; gap: 6px; color: var(--abc-text); font-weight: 600; }
    input, select, textarea { box-sizing: border-box; width: 100%; min-height: 40px; padding: 8px 10px; border: 1px solid var(--abc-text-muted); border-radius: 6px; font: inherit; }
    textarea { resize: vertical; }
    .competencies__description, .competencies__form-actions { grid-column: 1 / -1; }
    .competencies__form-actions { display: flex; gap: 8px; justify-content: end; }
    .competencies__state { margin: 24px 0; }
    .competencies__table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--abc-border); }
    th { color: var(--abc-text-muted); font-size: 12px; text-transform: uppercase; }
    td strong, td small { display: block; }
    td small { margin-top: 4px; color: var(--abc-text-muted); }
    td:last-child, th:last-child { width: 1%; white-space: nowrap; }
    .competencies__status { display: inline-block; padding: 3px 8px; color: var(--abc-success); font-size: 12px; font-weight: 700; background: color-mix(in srgb, var(--abc-success) 9%, var(--abc-surface)); border-radius: 999px; }
    .competencies__status--inactive { color: var(--abc-text-muted); background: var(--abc-surface-muted); }
    .visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    @media (max-width: 640px) { .competencies__header { align-items: stretch; flex-direction: column; } .competencies__form { grid-template-columns: 1fr; } }
  `,
})
export class CompetenciesPageComponent implements OnInit {
  private readonly competenciesService = inject(CompetenciesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly competencies = signal<Competency[]>([]);
  readonly errorMessage = signal('');
  readonly isEditing = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly selectedCompetency = signal<Competency | null>(null);
  readonly canManage = computed(() => {
    const roleKey = this.auth.user()?.roleKey;
    return roleKey === 'admin' || roleKey === 'hr';
  });
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    key: ['', [Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
    status: ['active' as CompetencyPayload['status']],
  });

  ngOnInit(): void {
    void this.loadCompetencies();
  }

  startCreate(): void {
    if (!this.canManage()) {
      return;
    }

    this.errorMessage.set('');
    this.selectedCompetency.set(null);
    this.form.reset({ name: '', key: '', description: '', status: 'active' });
    this.isEditing.set(true);
  }

  startEdit(competency: Competency): void {
    if (!this.canManage()) {
      return;
    }

    this.errorMessage.set('');
    this.selectedCompetency.set(competency);
    this.form.reset({
      name: competency.name,
      key: competency.key,
      description: competency.description,
      status: competency.status,
    });
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.selectedCompetency.set(null);
    this.form.reset({ name: '', key: '', description: '', status: 'active' });
  }

  validationMessage(): string {
    const value = this.form.getRawValue();
    if (!value.name.trim()) return 'Informe o nome da competencia.';
    if (value.name.trim().length > 120) return 'O nome da competencia deve ter no maximo 120 caracteres.';
    if (value.key.trim().length > 120) return 'A chave deve ter no maximo 120 caracteres.';
    if (value.description.trim().length > 1000) return 'A descricao deve ter no maximo 1000 caracteres.';
    return '';
  }

  async save(): Promise<void> {
    if (!this.canManage() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSaving.set(true);

    try {
      const payload = this.form.getRawValue();
      const competency = this.selectedCompetency();
      if (competency) {
        await firstValueFrom(this.competenciesService.update(competency.id, payload));
      } else {
        await firstValueFrom(this.competenciesService.create(payload));
      }
      this.cancelEdit();
      await this.loadCompetencies();
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError ? error.message : 'Nao foi possivel salvar a competencia.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadCompetencies(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      this.competencies.set(await firstValueFrom(this.competenciesService.list()));
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError ? error.message : 'Nao foi possivel carregar as competencias.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
