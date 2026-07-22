import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ApiError } from '../../core/http/api-error';
import { Area, AreasService } from './areas.service';

@Component({
  selector: 'app-areas-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="areas" aria-labelledby="areas-title">
      <header class="areas__header">
        <div>
          <p class="areas__eyebrow">Cadastro</p>
          <h1 id="areas-title">Areas</h1>
          <p>Organize as areas disponiveis para a estrutura da organizacao.</p>
        </div>
        <button type="button" class="areas__action" (click)="startCreate()">Nova area</button>
      </header>

      @if (errorMessage()) {
        <p class="areas__error" role="alert">{{ errorMessage() }}</p>
      }

      @if (isEditing()) {
        <form class="areas__form" [formGroup]="form" (ngSubmit)="save()">
          <label>
            Nome da area
            <input formControlName="name" autocomplete="off" />
          </label>
          @if (validationMessage()) {
            <p class="areas__validation" role="alert">{{ validationMessage() }}</p>
          }
          <div class="areas__form-actions">
            <button type="button" class="areas__secondary" (click)="cancelEdit()">Cancelar</button>
            <button type="submit" [disabled]="isSaving()">
              {{ isSaving() ? 'Salvando...' : selectedArea() ? 'Salvar alteracoes' : 'Cadastrar area' }}
            </button>
          </div>
        </form>
      }

      @if (isLoading()) {
        <p class="areas__state">Carregando areas...</p>
      } @else if (areas().length === 0) {
        <p class="areas__state">Nenhuma area cadastrada.</p>
      } @else {
        <div class="areas__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Area</th>
                <th>Lider</th>
                <th>Pessoas</th>
                <th><span class="visually-hidden">Acoes</span></th>
              </tr>
            </thead>
            <tbody>
              @for (area of areas(); track area.id) {
                <tr>
                  <td>{{ area.name }}</td>
                  <td>{{ area.managerName || '-' }}</td>
                  <td>{{ area.peopleCount ?? 0 }}</td>
                  <td><button type="button" class="areas__secondary" (click)="startEdit(area)">Editar</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .areas {
      max-width: 960px;
    }

    .areas__header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 24px;
    }

    .areas__eyebrow {
      margin: 0 0 8px;
      color: #175cd3;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    .areas__header p:not(.areas__eyebrow) {
      color: #475467;
    }

    button {
      min-height: 36px;
      padding: 0 12px;
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

    .areas__secondary {
      color: #344054;
      background: #ffffff;
      border: 1px solid #98a2b3;
    }

    .areas__error,
    .areas__form,
    .areas__table-wrap {
      margin-top: 24px;
      background: #ffffff;
      border: 1px solid #d0d5dd;
      border-radius: 8px;
    }

    .areas__error,
    .areas__validation {
      padding: 12px;
      color: #b42318;
      background: #fef3f2;
      border-color: #fecdca;
    }

    .areas__validation {
      margin: 0;
      border: 1px solid #fecdca;
      border-radius: 8px;
    }

    .areas__form {
      display: grid;
      gap: 16px;
      padding: 20px;
    }

    label {
      display: grid;
      gap: 6px;
      color: #344054;
      font-weight: 600;
    }

    input {
      min-height: 40px;
      padding: 8px 10px;
      border: 1px solid #98a2b3;
      border-radius: 6px;
    }

    .areas__form-actions {
      display: flex;
      gap: 8px;
      justify-content: end;
    }

    .areas__state {
      margin: 24px 0;
      color: #475467;
    }

    .areas__table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #eaecf0;
    }

    th {
      color: #475467;
      font-size: 12px;
      text-transform: uppercase;
    }

    td:last-child,
    th:last-child {
      width: 1%;
      white-space: nowrap;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      .areas__header {
        align-items: stretch;
        flex-direction: column;
      }
    }
  `,
})
export class AreasPageComponent implements OnInit {
  private readonly areasService = inject(AreasService);
  private readonly formBuilder = inject(FormBuilder);

  readonly areas = signal<Area[]>([]);
  readonly errorMessage = signal('');
  readonly isEditing = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly selectedArea = signal<Area | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
  });

  ngOnInit(): void {
    void this.loadAreas();
  }

  startCreate(): void {
    this.errorMessage.set('');
    this.selectedArea.set(null);
    this.form.reset({ name: '' });
    this.isEditing.set(true);
  }

  startEdit(area: Area): void {
    this.errorMessage.set('');
    this.selectedArea.set(area);
    this.form.reset({ name: area.name });
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.selectedArea.set(null);
    this.form.reset({ name: '' });
  }

  validationMessage(): string {
    const name = this.form.getRawValue().name.trim();
    if (!name) return 'Informe o nome da area.';
    if (name.length > 120) return 'O nome da area deve ter no maximo 120 caracteres.';
    return '';
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSaving.set(true);

    try {
      const payload = { name: this.form.getRawValue().name };
      const area = this.selectedArea();
      if (area) {
        await firstValueFrom(this.areasService.update(area.id, payload));
      } else {
        await firstValueFrom(this.areasService.create(payload));
      }
      this.cancelEdit();
      await this.loadAreas();
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError ? error.message : 'Nao foi possivel salvar a area.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadAreas(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const areas = await firstValueFrom(this.areasService.list());
      this.areas.set(areas);
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiError ? error.message : 'Nao foi possivel carregar as areas.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
