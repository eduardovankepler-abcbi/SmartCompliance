import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import {
  DashboardOverview,
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

@Component({
  selector: 'app-dashboard-page',
  imports: [DashboardBarChartComponent, DashboardDonutMetricComponent, DashboardLineChartComponent],
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
            <article><span>Novo ciclo</span><strong>Abrir operacao de avaliacoes</strong></article>
            <article><span>Ver incidentes</span><strong>Acompanhar fila ativa</strong></article>
            <article><span>Novo usuario</span><strong>Provisionar acesso</strong></article>
            <article><span>Nova pessoa</span><strong>Atualizar estrutura</strong></article>
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
              <strong>{{ openIncidentsLabel(currentOverview) }}</strong>
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
    .dashboard__eyebrow { margin: 0 0 8px; color: #175cd3; font-size: 13px; font-weight: 700; text-transform: uppercase; }
    h1 { margin: 0; font-size: 24px; }
    .dashboard__header p:not(.dashboard__eyebrow), .dashboard__state { color: #475467; }
    button { min-height: 36px; padding: 0 12px; color: #fff; font-weight: 600; cursor: pointer; background: #175cd3; border: 0; border-radius: 6px; }
    button:disabled { cursor: wait; background: #84adff; }
    .dashboard__filters { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; padding: 16px; background: #111827; border: 1px solid #253044; border-radius: 8px; }
    label { display: grid; gap: 6px; min-width: 210px; color: #cbd5e1; font-size: 14px; font-weight: 600; }
    select { min-height: 40px; padding: 8px 10px; color: #f8fafc; font: inherit; background: #0b1220; border: 1px solid #334155; border-radius: 6px; }
    .dashboard__error { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 24px; padding: 12px 16px; color: #b42318; background: #fef3f2; border: 1px solid #fecdca; border-radius: 8px; }
    .dashboard__error p { margin: 0; }
    .dashboard__secondary { color: #344054; background: #fff; border: 1px solid #98a2b3; }
    .dashboard__state { margin: 32px 0; }
    .dashboard__command { display: grid; gap: 14px; margin-top: 24px; padding: 18px; color: #e4e7ec; background: linear-gradient(135deg, #111827, #182230); border: 1px solid #253044; border-radius: 8px; }
    .dashboard__command-heading { display: flex; justify-content: space-between; gap: 16px; }
    .dashboard__command-heading span, .dashboard__quick-actions span, .dashboard__recommendations header span { color: #f97066; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .dashboard__command-heading h2 { margin: 4px 0; color: #f8fafc; font-size: 20px; }
    .dashboard__command-heading p, .dashboard__command-heading small { color: #98a2b3; }
    .dashboard__read-switch, .dashboard__tabs { display: grid; gap: 8px; }
    .dashboard__read-switch { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dashboard__read-switch button { background: #1d4ed8; }
    .dashboard__read-switch .dashboard__ghost { color: #f8fafc; background: #0b1220; border: 1px solid #253044; }
    .dashboard__quick-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .dashboard__quick-actions article { padding: 12px; background: #0f172a; border: 1px solid #253044; border-radius: 8px; }
    .dashboard__quick-actions strong { display: block; margin-top: 5px; color: #f8fafc; font-size: 13px; }
    .dashboard__tabs { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .dashboard__tabs span { min-height: 28px; padding: 6px 10px; color: #f8fafc; text-align: center; background: #334155; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .dashboard__tabs span:first-child { background: #1d4ed8; }
    .dashboard__scope, .dashboard__cards, .dashboard__summary { display: grid; gap: 16px; margin-top: 24px; }
    .dashboard__scope { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .dashboard__scope div, .dashboard__card, .dashboard__summary article { padding: 16px; background: #111827; border: 1px solid #253044; border-radius: 8px; }
    .dashboard__scope span, .dashboard__card span, .dashboard__summary span { display: block; color: #98a2b3; font-size: 12px; }
    .dashboard__scope strong { display: block; margin-top: 6px; color: #f8fafc; }
    .dashboard__executive { margin-top: 24px; padding: 18px; color: #e4e7ec; background: #101828; border: 1px solid #344054; border-radius: 8px; }
    .dashboard__executive header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .dashboard__executive header span, .dashboard__executive-grid span { display: block; color: #84adff; font-size: 12px; font-weight: 700; }
    .dashboard__executive-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .dashboard__executive-grid article, .dashboard__priorities article { padding: 14px; background: #182230; border: 1px solid #344054; border-radius: 8px; }
    .dashboard__executive-grid strong { display: block; color: #fff; font-size: 24px; }
    .dashboard__priorities { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
    .dashboard__cards { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .dashboard__card strong { display: block; margin: 10px 0 6px; color: #f8fafc; font-size: 26px; }
    .dashboard__card small { color: #cbd5e1; line-height: 1.4; }
    .dashboard__summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .dashboard__summary strong { display: block; margin-top: 8px; color: #f8fafc; font-size: 22px; }
    .dashboard__charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
    .dashboard__chart-card { min-height: 230px; padding: 18px; color: #e4e7ec; background: #111827; border: 1px solid #253044; border-radius: 8px; }
    .dashboard__chart-card--wide { grid-column: 1 / -1; }
    .dashboard__chart-card header { margin-bottom: 20px; }
    .dashboard__chart-card header span { color: #84adff; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    h2 { margin: 4px 0 0; color: #f8fafc; font-size: 17px; }
    .dashboard__donuts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .dashboard__recommendations { display: grid; gap: 16px; margin-top: 24px; }
    .dashboard__recommendations article { padding: 18px; color: #e4e7ec; background: #111827; border: 1px solid #253044; border-radius: 8px; }
    .dashboard__comparison-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
    .dashboard__comparison-grid div { padding: 14px; background: #0f172a; border: 1px solid #253044; border-radius: 8px; }
    .dashboard__comparison-grid span, .dashboard__comparison-grid small { display: block; color: #98a2b3; }
    .dashboard__comparison-grid strong { display: block; margin: 6px 0; color: #f8fafc; }
    .dashboard__updating { margin: 12px 0 0; color: #475467; font-size: 14px; }
    @media (max-width: 960px) { .dashboard__cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } .dashboard__summary, .dashboard__charts, .dashboard__executive-grid, .dashboard__priorities, .dashboard__quick-actions, .dashboard__comparison-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .dashboard__header, .dashboard__error, .dashboard__executive header, .dashboard__command-heading { align-items: stretch; flex-direction: column; } .dashboard__scope, .dashboard__cards, .dashboard__summary, .dashboard__charts, .dashboard__donuts, .dashboard__executive-grid, .dashboard__priorities, .dashboard__read-switch, .dashboard__quick-actions, .dashboard__tabs, .dashboard__comparison-grid { grid-template-columns: 1fr; } .dashboard__chart-card--wide { grid-column: auto; } label { width: 100%; } }
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

  openIncidentsLabel(overview: DashboardOverview): string {
    return String(overview.cards.find((card) => card.label.toLocaleLowerCase().includes('incidente'))?.value || '0');
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
