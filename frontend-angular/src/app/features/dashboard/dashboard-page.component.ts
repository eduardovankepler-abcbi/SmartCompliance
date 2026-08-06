import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { AppSectionKey, getNavigationSection } from '../../core/navigation/navigation.config';
import {
  DashboardOperationalAlert,
  DashboardOverview,
  DashboardRiskSummary,
  DashboardService,
  DashboardTimeGrouping,
} from './dashboard.service';
import { DashboardBarChartComponent, DashboardChartDatum } from './charts/dashboard-bar-chart.component';
import { DashboardDonutMetricComponent } from './charts/dashboard-donut-metric.component';
import { DashboardLineChartComponent } from './charts/dashboard-line-chart.component';

interface TimeGroupingOption {
  value: DashboardTimeGrouping;
  label: string;
}

interface DashboardQuickAction {
  sectionKey: AppSectionKey;
  label: string;
  detail: string;
  path: string[];
}

const dashboardQuickActions: readonly DashboardQuickAction[] = [
  {
    sectionKey: 'evaluations',
    label: 'Avaliacoes',
    detail: 'Abrir operacao de avaliacoes',
    path: ['/app', 'evaluations'],
  },
  {
    sectionKey: 'compliance',
    label: 'Incidentes',
    detail: 'Acompanhar fila ativa',
    path: ['/app', 'compliance'],
  },
  {
    sectionKey: 'audit',
    label: 'Auditoria',
    detail: 'Consultar trilha operacional',
    path: ['/app', 'audit'],
  },
  {
    sectionKey: 'users',
    label: 'Usuarios',
    detail: 'Provisionar acesso',
    path: ['/app', 'users'],
  },
  {
    sectionKey: 'people',
    label: 'Pessoas',
    detail: 'Atualizar estrutura',
    path: ['/app', 'people'],
  },
];

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, DashboardBarChartComponent, DashboardDonutMetricComponent, DashboardLineChartComponent],
  template: `
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header class="dashboard__header">
        <div>
          <p class="dashboard__eyebrow">Workspace</p>
          <h1 id="dashboard-title">Dashboard</h1>
          <p>{{ overview()?.notice || 'Acompanhe os principais indicadores do seu escopo.' }}</p>
        </div>
        <button type="button" class="dashboard__refresh" (click)="loadOverview()" [disabled]="isLoading()">
          {{ isLoading() ? 'Atualizando...' : 'Atualizar dados' }}
        </button>
      </header>

      <section class="dashboard__filters" aria-label="Filtros do dashboard">
        @if (canFilterByArea()) {
          <label>
            Area
            <select [value]="areaFilter()" (change)="changeArea($any($event.target).value)">
              <option value="all">Todas as areas</option>
              @for (area of overview()?.areaOptions ?? []; track area) {
                <option [value]="area">{{ area }}</option>
              }
            </select>
          </label>
        }
        <label>
          Consolidar por
          <select [value]="timeGrouping()" (change)="changeTimeGrouping($any($event.target).value)">
            @for (option of timeGroupingOptions; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </label>
      </section>

      @if (errorMessage()) {
        <div class="dashboard__error" role="alert">
          <p>{{ errorMessage() }}</p>
          <button type="button" class="dashboard__secondary" (click)="loadOverview()">Tentar novamente</button>
        </div>
      }

      @if (isLoading() && !overview()) {
        <p class="dashboard__state">Carregando indicadores...</p>
      } @else if (overview(); as currentOverview) {
        <section class="dashboard__command" aria-label="Resumo estrategico do dashboard">
          <div class="dashboard__command-heading">
            <div>
              <span>Painel do administrador</span>
              <h2>Resumo estrategico da operacao</h2>
              <p>Leitura consolidada para RH, compliance e lideranca.</p>
            </div>
            <small>{{ currentOverview.scopeLabel }}</small>
          </div>
          <div class="dashboard__read-switch" aria-label="Modos de leitura">
            <button type="button">Leitura executiva</button>
            <button type="button" class="dashboard__ghost">Leitura analitica</button>
          </div>
          <div class="dashboard__quick-actions" aria-label="Acoes rapidas do dashboard">
            @for (action of quickActions(); track action.label) {
              <a
                [routerLink]="action.path"
                [attr.aria-label]="'Abrir ' + action.label"
              >
                <span>{{ action.label }}</span>
                <strong>{{ action.detail }}</strong>
              </a>
            }
          </div>
          <div class="dashboard__tabs" aria-label="Abas de leitura">
            <span>Visao Executiva</span>
            <span>Resultados</span>
            <span>Desempenho 360</span>
            <span>Pessoas e Areas</span>
            <span>Compliance e Riscos</span>
          </div>
        </section>

        <section class="dashboard__scope" aria-label="Escopo atual">
          <div>
            <span>Escopo atual</span>
            <strong>{{ currentOverview.scopeLabel }}</strong>
          </div>
          <div>
            <span>Modo de leitura</span>
            <strong>{{ currentOverview.mode === 'team' ? 'Equipe direta' : 'Consolidado organizacional' }}</strong>
          </div>
        </section>

        <section class="dashboard__executive" aria-label="Leitura executiva">
          <header>
            <div>
              <span>Painel executivo</span>
              <h2>Central de prioridades</h2>
            </div>
            <small>O que merece atencao agora</small>
          </header>
          <div class="dashboard__executive-grid">
            <article class="dashboard__decision">
              <span>Saude 360</span>
              <strong>{{ healthScoreLabel(currentOverview) }}</strong>
              <small>{{ currentOverview.performanceHealth?.confidenceLabel || 'Leitura consolidada' }}</small>
            </article>
            <article>
              <span>Assignments pendentes</span>
              <strong>{{ currentOverview.scopeSummary.pendingAssignments }}</strong>
              <small>{{ pendingAssignmentsLabel(currentOverview) }}</small>
            </article>
            <article>
              <span>Incidentes abertos</span>
              <strong>{{ riskSummary(currentOverview).openIncidents }}</strong>
              <small>Casos em acompanhamento</small>
            </article>
            <article>
              <span>Desenvolvimento</span>
              <strong>{{ currentOverview.scopeSummary.developmentRecords }}</strong>
              <small>Registros considerados no recorte</small>
            </article>
          </div>
          <div class="dashboard__priorities">
            <article>
              <strong>{{ primaryPriorityTitle(currentOverview) }}</strong>
              <p>{{ primaryPriorityDetail(currentOverview) }}</p>
            </article>
            <article>
              <strong>{{ secondaryPriorityTitle(currentOverview) }}</strong>
              <p>{{ secondaryPriorityDetail(currentOverview) }}</p>
            </article>
          </div>
          <div class="dashboard__alerts" aria-label="Alertas operacionais">
            <header>
              <div>
                <span>Riscos operacionais</span>
                <h2>Alertas para acompanhamento</h2>
              </div>
              <small>{{ operationalAlerts(currentOverview).length }} ativos</small>
            </header>
            @if (operationalAlerts(currentOverview).length) {
              <div class="dashboard__priorities">
                @for (alert of operationalAlerts(currentOverview); track alert.key) {
                  <article
                    class="dashboard__alert"
                    [class.dashboard__alert--critical]="alert.tone === 'critical'"
                    [class.dashboard__alert--warning]="alert.tone === 'warning'"
                    [class.dashboard__alert--positive]="alert.tone === 'positive'"
                    [class.dashboard__alert--support]="alert.tone === 'support'"
                  >
                    <span>{{ alert.label }}</span>
                    <strong>{{ alert.value }}</strong>
                    <small>{{ alert.detail }}</small>
                  </article>
                }
              </div>
            } @else {
              <p class="dashboard__no-alerts">Sem alertas operacionais criticos no recorte atual.</p>
            }
          </div>
        </section>

        <section class="dashboard__cards" aria-label="Indicadores principais">
          @for (card of currentOverview.cards; track card.label) {
            <article class="dashboard__card">
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
              <small>{{ card.trend }}</small>
            </article>
          }
        </section>

        <section class="dashboard__summary" aria-label="Resumo operacional">
          <article>
            <span>Pessoas no recorte</span>
            <strong>{{ currentOverview.scopeSummary.peopleCount }}</strong>
          </article>
          <article>
            <span>Assignments pendentes</span>
            <strong>{{ currentOverview.scopeSummary.pendingAssignments }}</strong>
          </article>
          <article>
            <span>Assignments concluidos</span>
            <strong>{{ currentOverview.scopeSummary.submittedAssignments }}</strong>
          </article>
          <article>
            <span>Registros de desenvolvimento</span>
            <strong>{{ currentOverview.scopeSummary.developmentRecords }}</strong>
          </article>
        </section>

        <section class="dashboard__charts" aria-label="Indicadores analiticos">
          <article class="dashboard__chart-card dashboard__chart-card--line">
            <header><span>Pulso do ciclo</span><h2>Adesao por periodo</h2></header>
            <app-dashboard-line-chart [items]="timelineItems()" ariaLabel="Adesao ao ciclo por periodo" [valueMax]="100" />
          </article>
          <article class="dashboard__chart-card">
            <header><span>Cobertura</span><h2>Indicadores de cobertura</h2></header>
            <div class="dashboard__donuts">
              @for (metric of currentOverview.donutMetrics; track metric.key) {
                <app-dashboard-donut-metric [metric]="metric" />
              }
            </div>
          </article>
          <article class="dashboard__chart-card">
            <header><span>Avaliacoes</span><h2>Status dos assignments</h2></header>
            <app-dashboard-bar-chart [items]="assignmentStatusItems()" ariaLabel="Status dos assignments" />
          </article>
          <article class="dashboard__chart-card">
            <header><span>Desenvolvimento</span><h2>Registros por tipo</h2></header>
            <app-dashboard-bar-chart [items]="developmentItems()" ariaLabel="Registros de desenvolvimento por tipo" />
          </article>
          <article class="dashboard__chart-card dashboard__chart-card--wide">
            <header><span>Satisfacao</span><h2>Media por area</h2></header>
            <app-dashboard-bar-chart [items]="satisfactionItems()" ariaLabel="Satisfacao media por area" [valueMax]="5" />
          </article>
        </section>

        <section class="dashboard__recommendations" aria-label="Comparativos e acoes recomendadas">
          <article>
            <header><span>Comparativo</span><h2>Comparativos do periodo</h2></header>
            <div class="dashboard__comparison-grid">
              <div><span>Area critica</span><strong>{{ currentOverview.performanceHealth?.lowestArea?.area || 'Sem area critica' }}</strong><small>{{ currentOverview.performanceHealth?.lowestArea?.scoreLabel || 'Sem leitura suficiente' }}</small></div>
              <div><span>Melhor leitura do recorte</span><strong>{{ bestSatisfactionArea() }}</strong><small>{{ bestSatisfactionScore() }}</small></div>
              <div><span>Ritmo operacional</span><strong>{{ currentOverview.scopeSummary.submittedAssignments }}/{{ currentOverview.scopeSummary.totalAssignments }}</strong><small>{{ currentOverview.scopeSummary.pendingAssignments }} pendentes ainda exigem acompanhamento</small></div>
            </div>
          </article>
          <article>
            <header><span>Profilaxia</span><h2>Acoes recomendadas</h2></header>
            <div class="dashboard__comparison-grid">
              <div><span>Apoiar tecnologia</span><strong>{{ healthScoreLabel(currentOverview) }} em leituras agregadas</strong><small>Abrir escuta breve com lideranca da area.</small></div>
              <div><span>Direcionamento sem alarme</span><strong>{{ currentOverview.scopeSummary.pendingAssignments }} leituras pedem acompanhamento</strong><small>Priorizar planos curtos e evidencias simples.</small></div>
            </div>
          </article>
        </section>

        @if (isLoading()) {
          <p class="dashboard__updating" aria-live="polite">Atualizando indicadores...</p>
        }
      } @else if (!errorMessage()) {
        <p class="dashboard__state">Nenhum dado de dashboard disponivel para o escopo atual.</p>
      }
    </section>
  `,
  styles: `
    .dashboard { max-width: 1120px; }
    .dashboard__header { display: flex; align-items: start; justify-content: space-between; gap: 24px; }
    .dashboard__eyebrow { margin: 0 0 8px; color: var(--abc-blue); font-size: 13px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 24px; }
    .dashboard__header p:not(.dashboard__eyebrow), .dashboard__state { color: var(--abc-text-muted); }
    button { min-height: 36px; padding: 0 12px; color: var(--abc-on-blue); font-weight: 600; cursor: pointer; background: var(--abc-blue); border: 0; border-radius: 6px; }
    button:disabled { cursor: wait; background: color-mix(in srgb, var(--abc-blue) 45%, var(--abc-surface)); }
    .dashboard__filters { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; padding: 16px; background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; box-shadow: 0 10px 30px color-mix(in srgb, var(--abc-navy) 8%, transparent); }
    label { display: grid; gap: 6px; min-width: 210px; color: var(--abc-text); font-size: 14px; font-weight: 600; }
    select { min-height: 40px; padding: 8px 10px; color: var(--abc-text); font: inherit; background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 6px; }
    .dashboard__error { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 24px; padding: 12px 16px; color: var(--abc-danger); background: color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface)); border: 1px solid color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border)); border-radius: 8px; }
    .dashboard__error p { margin: 0; }
    .dashboard__secondary { color: var(--abc-text); background: var(--abc-surface); border: 1px solid var(--abc-text-muted); }
    .dashboard__state { margin: 32px 0; }
    .dashboard__command { display: grid; gap: 14px; margin-top: 24px; padding: 18px; color: var(--abc-text); background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; box-shadow: 0 10px 30px color-mix(in srgb, var(--abc-navy) 8%, transparent); }
    .dashboard__command-heading { display: flex; justify-content: space-between; gap: 16px; }
    .dashboard__command-heading span, .dashboard__quick-actions span, .dashboard__recommendations header span { color: var(--abc-danger); font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .dashboard__command-heading h2 { margin: 4px 0; color: var(--abc-text); font-size: 20px; }
    .dashboard__command-heading p, .dashboard__command-heading small { color: var(--abc-text-muted); }
    .dashboard__read-switch, .dashboard__tabs { display: grid; gap: 8px; }
    .dashboard__read-switch { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dashboard__read-switch button { background: var(--abc-blue-dark); }
    .dashboard__read-switch .dashboard__ghost { color: var(--abc-text); background: var(--abc-surface-muted); border: 1px solid var(--abc-border); }
    .dashboard__quick-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .dashboard__quick-actions a { padding: 12px; color: inherit; text-decoration: none; background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-radius: 8px; }
    .dashboard__quick-actions strong { display: block; margin-top: 5px; color: var(--abc-text); font-size: 13px; }
    .dashboard__tabs { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .dashboard__tabs span { min-height: 28px; padding: 6px 10px; color: var(--abc-text-muted); text-align: center; background: var(--abc-surface-muted); border-radius: 6px; font-size: 12px; font-weight: 700; }
    .dashboard__tabs span:first-child { color: var(--abc-on-blue); background: var(--abc-blue); }
    .dashboard__scope, .dashboard__cards, .dashboard__summary { display: grid; gap: 16px; margin-top: 24px; }
    .dashboard__scope { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dashboard__scope div, .dashboard__card, .dashboard__summary article { padding: 16px; background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; box-shadow: 0 8px 24px color-mix(in srgb, var(--abc-navy) 6%, transparent); }
    .dashboard__scope span, .dashboard__card span, .dashboard__summary span { display: block; color: var(--abc-text-muted); font-size: 12px; }
    .dashboard__scope strong { display: block; margin-top: 6px; color: var(--abc-text); }
    .dashboard__executive { margin-top: 24px; padding: 18px; color: var(--abc-text); background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; box-shadow: 0 10px 30px color-mix(in srgb, var(--abc-navy) 8%, transparent); }
    .dashboard__executive header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .dashboard__executive header span, .dashboard__executive-grid span { display: block; color: var(--abc-blue-dark); font-size: 12px; font-weight: 700; }
    .dashboard__executive-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .dashboard__executive-grid article, .dashboard__priorities article { padding: 14px; background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-radius: 8px; }
    .dashboard__executive-grid strong { display: block; color: var(--abc-text); font-size: 24px; }
    .dashboard__priorities { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
    .dashboard__alerts { margin-top: 12px; padding-top: 14px; border-top: 1px solid var(--abc-border); }
    .dashboard__alert { border-left: 4px solid var(--abc-blue); }
    .dashboard__alert--critical { border-left-color: var(--abc-danger); }
    .dashboard__alert--warning { border-left-color: color-mix(in srgb, var(--abc-danger) 60%, #f5b84b); }
    .dashboard__alert span, .dashboard__alert small { display: block; color: var(--abc-text-muted); }
    .dashboard__alert strong { display: block; margin: 6px 0; font-size: 22px; }
    .dashboard__no-alerts { color: var(--abc-text-muted); }
    .dashboard__cards { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .dashboard__card strong { display: block; margin: 10px 0 6px; color: var(--abc-text); font-size: 26px; }
    .dashboard__card small { color: var(--abc-text-muted); line-height: 1.4; }
    .dashboard__summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .dashboard__summary strong { display: block; margin-top: 8px; color: var(--abc-text); font-size: 22px; }
    .dashboard__charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
    .dashboard__chart-card { min-height: 230px; padding: 18px; color: var(--abc-text); background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; box-shadow: 0 8px 24px color-mix(in srgb, var(--abc-navy) 6%, transparent); }
    .dashboard__chart-card--wide { grid-column: 1 / -1; }
    .dashboard__chart-card header { margin-bottom: 20px; }
    .dashboard__chart-card header span { color: var(--abc-blue-dark); font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h2 { margin: 4px 0 0; color: var(--abc-text); font-size: 17px; }
    .dashboard__donuts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .dashboard__recommendations { display: grid; gap: 16px; margin-top: 24px; }
    .dashboard__recommendations article { padding: 18px; color: var(--abc-text); background: var(--abc-surface); border: 1px solid var(--abc-border); border-radius: 8px; box-shadow: 0 8px 24px color-mix(in srgb, var(--abc-navy) 6%, transparent); }
    .dashboard__comparison-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
    .dashboard__comparison-grid div { padding: 14px; background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-radius: 8px; }
    .dashboard__comparison-grid span, .dashboard__comparison-grid small { display: block; color: var(--abc-text-muted); }
    .dashboard__comparison-grid strong { display: block; margin: 6px 0; color: var(--abc-text); }
    .dashboard__updating { margin: 12px 0 0; color: var(--abc-text-muted); font-size: 14px; }
    @media (max-width: 960px) { .dashboard__cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } .dashboard__summary, .dashboard__charts, .dashboard__executive-grid, .dashboard__priorities, .dashboard__quick-actions, .dashboard__comparison-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .dashboard__header, .dashboard__error, .dashboard__executive header, .dashboard__alerts header, .dashboard__command-heading { align-items: stretch; flex-direction: column; } .dashboard__scope, .dashboard__cards, .dashboard__summary, .dashboard__charts, .dashboard__donuts, .dashboard__executive-grid, .dashboard__priorities, .dashboard__read-switch, .dashboard__quick-actions, .dashboard__tabs, .dashboard__comparison-grid { grid-template-columns: 1fr; } .dashboard__chart-card--wide { grid-column: auto; } label { width: 100%; } }
  `,
})
export class DashboardPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private requestId = 0;

  readonly overview = signal<DashboardOverview | null>(null);
  readonly errorMessage = signal('');
  readonly isLoading = signal(true);
  readonly areaFilter = signal('all');
  readonly timeGrouping = signal<DashboardTimeGrouping>('semester');
  readonly canFilterByArea = computed(() => {
    const roleKey = this.auth.user()?.roleKey;
    return roleKey === 'admin' || roleKey === 'hr';
  });
  readonly quickActions = computed(() => {
    const roleKey = this.auth.user()?.roleKey ?? '';
    return dashboardQuickActions.filter((action) => getNavigationSection(action.sectionKey)?.roles.includes(roleKey));
  });
  readonly timeGroupingOptions: readonly TimeGroupingOption[] = [
    { value: 'cycle', label: 'Ciclo' },
    { value: 'semester', label: 'Semestre' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Ano' },
  ];
  readonly timelineItems = computed<DashboardChartDatum[]>(() =>
    (this.overview()?.cycleTimeline ?? []).map((item) => ({
      label: item.label,
      value: item.adherencePercentage,
      valueLabel: `${item.adherencePercentage}%`,
    })),
  );
  readonly assignmentStatusItems = computed<DashboardChartDatum[]>(() =>
    (this.overview()?.assignmentStatus ?? []).map((item) => ({
      label: item.label,
      value: item.total,
      valueLabel: String(item.total),
    })),
  );
  readonly developmentItems = computed<DashboardChartDatum[]>(() =>
    (this.overview()?.developmentByType ?? []).map((item) => ({
      label: item.type,
      value: item.total,
      valueLabel: String(item.total),
    })),
  );
  readonly satisfactionItems = computed<DashboardChartDatum[]>(() =>
    (this.overview()?.satisfactionByArea ?? []).map((item) => ({
      label: item.area,
      value: item.scoreValue,
      valueLabel: item.score,
    })),
  );

  healthScoreLabel(overview: DashboardOverview): string {
    return overview.performanceHealth?.averageScoreLabel || overview.cards[0]?.value || '-';
  }

  pendingAssignmentsLabel(overview: DashboardOverview): string {
    const total = overview.scopeSummary.totalAssignments;
    if (!total) return 'Sem assignments distribuidos no recorte';
    return `${Math.round((overview.scopeSummary.pendingAssignments / total) * 100)}% do total`;
  }

  riskSummary(overview: DashboardOverview): DashboardRiskSummary {
    return overview.riskSummary ?? {
      openIncidents: Number(overview.cards.find((card) => card.label.toLocaleLowerCase().includes('incidente'))?.value || 0),
      overdueIncidents: 0,
      unassignedIncidents: 0,
      pendingAssignments: overview.scopeSummary.pendingAssignments,
      blockedDevelopmentPlans: 0,
      notStartedDevelopmentPlans: 0,
      pendingLearningEvents: 0,
    };
  }

  operationalAlerts(overview: DashboardOverview): DashboardOperationalAlert[] {
    return overview.operationalAlerts ?? [];
  }

  primaryPriorityTitle(overview: DashboardOverview): string {
    return overview.scopeSummary.pendingAssignments > 0 ? 'Reduzir pendencias de avaliacao' : 'Manter ritmo de acompanhamento';
  }

  primaryPriorityDetail(overview: DashboardOverview): string {
    return overview.scopeSummary.pendingAssignments > 0
      ? `${overview.scopeSummary.pendingAssignments} assignments ainda exigem acompanhamento no recorte atual.`
      : 'Nao ha pendencias de avaliacao no recorte atual.';
  }

  secondaryPriorityTitle(overview: DashboardOverview): string {
    return overview.performanceHealth?.lowestArea ? 'Area critica de desempenho' : 'Desenvolvimento e reconhecimento';
  }

  secondaryPriorityDetail(overview: DashboardOverview): string {
    const lowestArea = overview.performanceHealth?.lowestArea;
    if (lowestArea) return `${lowestArea.area}: ${lowestArea.scoreLabel} na leitura 360.`;
    return `${overview.scopeSummary.developmentRecords} registros de desenvolvimento e ${overview.scopeSummary.applauseEntries} reconhecimentos no recorte.`;
  }

  bestSatisfactionArea(): string {
    const best = [...(this.overview()?.satisfactionByArea ?? [])].sort((left, right) => right.scoreValue - left.scoreValue)[0];
    return best?.area || 'Sem dados';
  }

  bestSatisfactionScore(): string {
    const best = [...(this.overview()?.satisfactionByArea ?? [])].sort((left, right) => right.scoreValue - left.scoreValue)[0];
    return best ? `${best.score} de media no recorte` : 'Sem leitura suficiente';
  }

  ngOnInit(): void {
    void this.loadOverview();
  }

  changeArea(area: string): void {
    if (!this.canFilterByArea()) {
      return;
    }

    this.areaFilter.set(area);
    void this.loadOverview();
  }

  changeTimeGrouping(value: DashboardTimeGrouping): void {
    this.timeGrouping.set(value);
    void this.loadOverview();
  }

  async loadOverview(): Promise<void> {
    const requestId = ++this.requestId;
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const overview = await firstValueFrom(
        this.dashboardService.getOverview({
          area: this.canFilterByArea() && this.areaFilter() !== 'all' ? this.areaFilter() : null,
          timeGrouping: this.timeGrouping(),
        }),
      );
      if (requestId === this.requestId) {
        if (
          this.canFilterByArea() &&
          this.areaFilter() !== 'all' &&
          !overview.areaOptions.includes(this.areaFilter())
        ) {
          this.areaFilter.set('all');
          void this.loadOverview();
          return;
        }
        this.overview.set(overview);
      }
    } catch (error) {
      if (requestId === this.requestId) {
        this.errorMessage.set(
          error instanceof ApiError ? error.message : 'Nao foi possivel carregar o dashboard.',
        );
      }
    } finally {
      if (requestId === this.requestId) {
        this.isLoading.set(false);
      }
    }
  }
}
