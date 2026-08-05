import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { AuditEntry, AuditFilters, AuditService } from './audit.service';

interface AuditCategoryOption {
  value: string;
  label: string;
}

const CATEGORY_OPTIONS: readonly AuditCategoryOption[] = [
  { value: 'user', label: 'Usuarios e acessos' },
  { value: 'registry', label: 'Pessoas e areas' },
  { value: 'competency', label: 'Competencias' },
  { value: 'incident', label: 'Compliance' },
  { value: 'cycle', label: 'Ciclos e avaliacoes' },
  { value: 'feedback_request', label: 'Feedbacks' },
  { value: 'applause', label: 'Aplause' },
  { value: 'development', label: 'Desenvolvimento' },
];

const CATEGORIES_BY_ROLE: Record<string, readonly string[]> = {
  admin: CATEGORY_OPTIONS.map((item) => item.value),
  hr: CATEGORY_OPTIONS.map((item) => item.value),
  compliance: ['incident'],
  manager: ['cycle', 'feedback_request', 'applause', 'development'],
};

@Component({
  selector: 'app-audit-page',
  imports: [DatePipe],
  template: `
    <section class="audit-page" aria-labelledby="audit-title">
      <header class="audit-page__header">
        <div>
          <p>Governanca</p>
          <h1 id="audit-title">Auditoria</h1>
          <span>Eventos operacionais recentes para acompanhamento interno.</span>
        </div>
        <button type="button" (click)="load()" [disabled]="loading()">
          {{ loading() ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </header>

      <section class="audit-page__filters" aria-label="Filtros de auditoria">
        <label>
          Categoria
          <select [value]="category()" (change)="category.set($any($event.target).value)">
            <option value="">Todas permitidas</option>
            @for (option of categoryOptions(); track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </label>
        <label>
          Acao
          <input [value]="action()" (input)="action.set($any($event.target).value)" placeholder="created, updated..." />
        </label>
        <label>
          Ator
          <input [value]="actorUserId()" (input)="actorUserId.set($any($event.target).value)" placeholder="ID do usuario" />
        </label>
        <label>
          De
          <input type="date" [value]="from()" (input)="from.set($any($event.target).value)" />
        </label>
        <label>
          Ate
          <input type="date" [value]="to()" (input)="to.set($any($event.target).value)" />
        </label>
        <button type="button" (click)="applyFilters()">Filtrar</button>
      </section>

      @if (error()) {
        <p class="audit-page__error" role="alert">{{ error() }}</p>
      }

      <section class="audit-page__summary" aria-label="Resumo por categoria">
        @for (item of categorySummary(); track item.category) {
          <article>
            <span>{{ categoryLabel(item.category) }}</span>
            <strong>{{ item.total }}</strong>
          </article>
        }
      </section>

      <section class="audit-page__events" aria-label="Eventos de auditoria">
        @if (loading() && !entries().length) {
          <p class="audit-page__state">Carregando eventos...</p>
        } @else if (entries().length) {
          @for (entry of entries(); track entry.id) {
            <article>
              <header>
                <div>
                  <span>{{ categoryLabel(entry.category) }} · {{ entry.action }}</span>
                  <strong>{{ entry.summary }}</strong>
                </div>
                <time>{{ entry.createdAt | date:'short' }}</time>
              </header>
              <p>{{ entry.detail }}</p>
              <footer>
                <span>{{ entry.actorName }} · {{ entry.actorRoleKey }}</span>
                <span>{{ entry.entityType }} · {{ entry.entityLabel || entry.entityId }}</span>
              </footer>
            </article>
          }
        } @else {
          <p class="audit-page__state">Nenhum evento encontrado para os filtros atuais.</p>
        }
      </section>
    </section>
  `,
  styles: `
    .audit-page { max-width: 1120px; }
    .audit-page__header { display: flex; justify-content: space-between; gap: 20px; }
    .audit-page__header p { margin: 0 0 8px; color: var(--abc-blue); font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 24px; }
    .audit-page__header span, .audit-page__state, .audit-page__events p, footer, time { color: var(--abc-text-muted); }
    button { min-height: 38px; padding: 0 12px; color: var(--abc-on-blue); font-weight: 700; cursor: pointer; background: var(--abc-blue); border: 0; border-radius: 6px; }
    button:disabled { cursor: wait; background: color-mix(in srgb, var(--abc-blue) 45%, var(--abc-surface)); }
    .audit-page__filters, .audit-page__summary, .audit-page__events article { margin-top: 20px; background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; box-shadow: 0 8px 24px color-mix(in srgb, var(--abc-navy) 6%, transparent); }
    .audit-page__filters { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; padding: 16px; align-items: end; }
    label { display: grid; gap: 6px; color: var(--abc-text); font-size: 13px; font-weight: 700; }
    input, select { min-height: 38px; width: 100%; padding: 8px 10px; color: var(--abc-text); font: inherit; background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 6px; }
    .audit-page__error { margin-top: 16px; padding: 12px; color: var(--abc-danger); background: color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface)); border: 1px solid color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border)); border-radius: 8px; }
    .audit-page__summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding: 16px; }
    .audit-page__summary article { padding: 12px; background: var(--abc-surface-muted); border-radius: 8px; }
    .audit-page__summary span, .audit-page__events header span { display: block; color: var(--abc-text-muted); font-size: 12px; }
    .audit-page__summary strong { display: block; margin-top: 6px; color: var(--abc-text); font-size: 22px; }
    .audit-page__events article { padding: 16px; }
    .audit-page__events header, footer { display: flex; justify-content: space-between; gap: 12px; }
    .audit-page__events strong { display: block; margin-top: 4px; color: var(--abc-text); }
    footer { padding-top: 10px; border-top: 1px solid var(--abc-border); font-size: 12px; }
    @media (max-width: 960px) { .audit-page__filters, .audit-page__summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .audit-page__header, .audit-page__events header, footer { flex-direction: column; } .audit-page__filters, .audit-page__summary { grid-template-columns: 1fr; } }
  `,
})
export class AuditPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly audit = inject(AuditService);

  readonly entries = signal<AuditEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly category = signal('');
  readonly action = signal('');
  readonly actorUserId = signal('');
  readonly from = signal('');
  readonly to = signal('');
  readonly categoryOptions = computed(() => {
    const allowed = CATEGORIES_BY_ROLE[this.auth.user()?.roleKey ?? ''] ?? [];
    return CATEGORY_OPTIONS.filter((item) => allowed.includes(item.value));
  });
  readonly categorySummary = computed(() => {
    const totals = new Map<string, number>();
    for (const entry of this.entries()) {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + 1);
    }
    return [...totals.entries()].map(([category, total]) => ({ category, total }));
  });

  ngOnInit(): void {
    void this.load();
  }

  applyFilters(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.entries.set(await firstValueFrom(this.audit.list(this.category() || undefined, 80, this.filters())));
    } catch (error) {
      this.error.set(error instanceof ApiError ? error.message : 'Nao foi possivel carregar a auditoria.');
    } finally {
      this.loading.set(false);
    }
  }

  categoryLabel(category: string): string {
    return CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
  }

  private filters(): AuditFilters {
    return {
      action: this.action().trim(),
      actorUserId: this.actorUserId().trim(),
      from: this.from() ? `${this.from()}T00:00:00.000Z` : '',
      to: this.to() ? `${this.to()}T23:59:59.999Z` : '',
    };
  }
}
