import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { AppSectionKey, getNavigationSection } from '../../core/navigation/navigation.config';
import {
  DashboardOperationalAlert,
  DashboardOverview,
  DashboardQuestionDistribution,
  DashboardResponseDistribution,
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

interface DashboardQuestionCategoryGroup {
  category: string;
  questions: DashboardQuestionDistribution[];
  totalAnswers: number;
  averageScoreLabel: string;
}

interface DashboardRelationshipQuestionGroup {
  relationshipType: string;
  relationshipLabel: string;
  totalResponses: number;
  totalEligibleResponses: number;
  categories: DashboardQuestionCategoryGroup[];
}

const dashboardQuickActions: readonly DashboardQuickAction[] = [
  {
    sectionKey: 'evaluations',
    label: 'Avaliacoes',
    detail: 'Respostas e ciclos',
    path: ['/app', 'evaluations'],
  },
  {
    sectionKey: 'development',
    label: 'PDI',
    detail: 'Planos e trilhas',
    path: ['/app', 'development'],
  },
  {
    sectionKey: 'compliance',
    label: 'Compliance',
    detail: 'Issues e inconformidades',
    path: ['/app', 'compliance'],
  },
  {
    sectionKey: 'applause',
    label: 'Aplause',
    detail: 'Reconhecimentos recebidos',
    path: ['/app', 'applause'],
  },
  {
    sectionKey: 'people',
    label: 'Pessoas',
    detail: 'Estrutura de equipes',
    path: ['/app', 'people'],
  },
];

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, DashboardBarChartComponent, DashboardDonutMetricComponent, DashboardLineChartComponent],
  template: `
    <section class="dashboard" aria-labelledby="dashboard-title">
      <header class="dashboard__hero">
        <div class="dashboard__brand">
          <span class="dashboard__brand-mark">SC</span>
          <div>
            <p>Smart Compliance</p>
            <h1 id="dashboard-title">Gestao Executiva</h1>
            <span>{{ overview()?.notice || 'Visao consolidada de pessoas, avaliacao, desenvolvimento e riscos.' }}</span>
          </div>
        </div>
        <div class="dashboard__hero-actions">
          <div class="dashboard__stamp">
            <span>Escopo</span>
            <strong>{{ overview()?.scopeLabel || 'Carregando' }}</strong>
          </div>
          <button type="button" class="dashboard__refresh" (click)="loadOverview()" [disabled]="isLoading()">
            {{ isLoading() ? 'Atualizando...' : 'Atualizar' }}
          </button>
        </div>
      </header>

      @if (overview(); as currentOverview) {
        <nav class="dashboard__nav" aria-label="Navegacao do dashboard">
          <strong>Navegacao</strong>
          <a href="#avaliacoes">Avaliacoes</a>
          <a [routerLink]="['/app/dashboard/pdi']">PDI</a>
          <a [routerLink]="['/app/dashboard/compliance']">Compliance</a>
          <a [routerLink]="['/app/dashboard/applause']">Aplause</a>
          <a href="#governanca">Governanca</a>
        </nav>

        <section class="dashboard__filters" aria-label="Filtros do dashboard">
          @if (canFilterByArea()) {
            <label>
              Area
              <select [value]="areaFilter()" (change)="changeArea($any($event.target).value)">
                <option value="all">Todas as areas</option>
                @for (area of currentOverview.areaOptions; track area) {
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
          <div class="dashboard__filter-note">
            <span>Modelo de governanca</span>
            <strong>{{ governanceLabel(currentOverview) }}</strong>
          </div>
        </section>

        @if (errorMessage()) {
          <div class="dashboard__error" role="alert">
            <p>{{ errorMessage() }}</p>
            <button type="button" class="dashboard__secondary" (click)="loadOverview()">Tentar novamente</button>
          </div>
        }

        <section class="dashboard__kpis" aria-label="Indicadores principais">
          @for (card of currentOverview.cards; track card.label) {
            <article>
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
              <small>{{ card.trend }}</small>
            </article>
          }
        </section>

        <section class="dashboard__board" aria-label="Painel executivo">
          <article class="dashboard__panel dashboard__panel--wide" id="avaliacoes">
            <header>
              <div>
                <span>Avaliacoes</span>
                <h2>Respostas de avaliacao</h2>
              </div>
              <small>{{ currentOverview.scopeSummary.submittedAssignments }}/{{ currentOverview.scopeSummary.totalAssignments }} concluidas</small>
            </header>
            <div class="dashboard__split">
              <app-dashboard-line-chart [items]="timelineItems()" ariaLabel="Adesao ao ciclo por periodo" [valueMax]="100" />
              <div class="dashboard__stack">
                <app-dashboard-bar-chart [items]="evaluationResultItems()" ariaLabel="Resultado por relacionamento" [valueMax]="100" />
                <div class="dashboard__mini-list">
                  @for (highlight of currentOverview.evaluationHighlights; track highlight) {
                    <p>{{ highlight }}</p>
                  }
                </div>
              </div>
            </div>

            <section class="dashboard__question-analysis" aria-label="Analise das respostas por pergunta">
              <div class="dashboard__question-analysis-head">
                <div>
                  <span>Analise por categoria</span>
                  <h3>Perguntas e respostas</h3>
                </div>
                <small>{{ evaluationQuestionCount() }} perguntas no recorte</small>
              </div>

              @if (evaluationQuestionGroups().length) {
                @for (relationship of evaluationQuestionGroups(); track relationship.relationshipType) {
                  <article class="dashboard__relationship-analysis">
                    <header>
                      <div>
                        <span>Modalidade</span>
                        <h4>{{ relationship.relationshipLabel }}</h4>
                      </div>
                      <small>{{ relationship.totalResponses }}/{{ relationship.totalEligibleResponses }} respostas</small>
                    </header>

                    <div class="dashboard__category-list">
                      @for (category of relationship.categories; track category.category) {
                        <section class="dashboard__category">
                          <div class="dashboard__category-head">
                            <div>
                              <span>Categoria</span>
                              <strong>{{ category.category }}</strong>
                            </div>
                            <small>{{ category.questions.length }} perguntas · {{ category.totalAnswers }} respostas · media {{ category.averageScoreLabel }}</small>
                          </div>

                          <div class="dashboard__question-grid">
                            @for (question of category.questions; track questionTrackKey(question)) {
                              <article class="dashboard__question-card">
                                <div class="dashboard__question-card-head">
                                  <strong>{{ question.questionPrompt }}</strong>
                                  <span>{{ question.totalAnswers || 0 }} resp.</span>
                                </div>
                                @if (!(question.totalAnswers || question.answeredCount || 0)) {
                                  <small class="dashboard__zero-badge">Sem respostas ainda</small>
                                }

                                @if (question.protected) {
                                  <div class="dashboard__question-empty">
                                    <strong>Detalhe protegido</strong>
                                    <span>A pergunta entra nos totais, mas o detalhamento foi ocultado por privacidade.</span>
                                  </div>
                                } @else if (question.options.length) {
                                  <div class="dashboard__option-list">
                                    @for (option of question.options; track option.value) {
                                      <div class="dashboard__option-row">
                                        <div class="dashboard__option-label">
                                          <span>{{ option.label }}</span>
                                          <strong>{{ option.total }} · {{ option.percentage }}%</strong>
                                        </div>
                                        <div class="dashboard__option-track">
                                          <span [style.width.%]="option.percentage"></span>
                                        </div>
                                      </div>
                                    }
                                  </div>
                                } @else {
                                  <div class="dashboard__question-empty">
                                    <strong>{{ (question.totalAnswers || question.answeredCount || 0) ? 'Sem distribuicao' : 'Sem respostas ainda' }}</strong>
                                    <span>
                                      {{
                                        (question.totalAnswers || question.answeredCount || 0)
                                          ? 'Esta pergunta nao possui alternativas agregaveis para grafico.'
                                          : 'A estrutura ja esta pronta; os indicadores serao preenchidos quando houver respostas.'
                                      }}
                                    </span>
                                  </div>
                                }
                              </article>
                            }
                          </div>
                        </section>
                      }
                    </div>
                  </article>
                }
              } @else {
                <div class="dashboard__question-empty">
                  <strong>Sem perguntas esperadas no recorte</strong>
                  <span>Publique questionarios ou distribua assignments para habilitar a analise por pergunta.</span>
                </div>
              }
            </section>
          </article>

          <article class="dashboard__panel">
            <header>
              <div>
                <span>Cobertura</span>
                <h2>Indicadores do recorte</h2>
              </div>
            </header>
            <div class="dashboard__donuts">
              @for (metric of currentOverview.donutMetrics; track metric.key) {
                <app-dashboard-donut-metric [metric]="metric" />
              }
            </div>
          </article>

          <article class="dashboard__panel" id="pdi">
            <header>
              <div>
                <span>Desenvolvimento</span>
                <h2>Evolucao mediante PDI</h2>
              </div>
              <small>{{ currentOverview.scopeSummary.developmentRecords }} registros</small>
            </header>
            <app-dashboard-bar-chart [items]="developmentItems()" ariaLabel="Registros de desenvolvimento por tipo" />
            <div class="dashboard__risk-strip">
              @for (item of pdiRiskItems(currentOverview); track item.label) {
                <div>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              }
            </div>
          </article>

          <article class="dashboard__panel" id="compliance">
            <header>
              <div>
                <span>Compliance</span>
                <h2>Issues e inconformidades</h2>
              </div>
              <small>{{ riskSummary(currentOverview).openIncidents }} abertos</small>
            </header>
            <app-dashboard-bar-chart [items]="complianceItems(currentOverview)" ariaLabel="Indicadores de compliance" />
            @if (operationalAlerts(currentOverview).length) {
              <div class="dashboard__alerts">
                @for (alert of operationalAlerts(currentOverview); track alert.key) {
                  <article
                    [class.dashboard__alert--critical]="alert.tone === 'critical'"
                    [class.dashboard__alert--warning]="alert.tone === 'warning'"
                    [class.dashboard__alert--positive]="alert.tone === 'positive'"
                  >
                    <span>{{ alert.label }}</span>
                    <strong>{{ alert.value }}</strong>
                    <small>{{ alert.detail }}</small>
                  </article>
                }
              </div>
            } @else {
              <p class="dashboard__empty">Sem alertas criticos no recorte atual.</p>
            }
          </article>

          <article class="dashboard__panel" id="applause">
            <header>
              <div>
                <span>Aplause</span>
                <h2>Reconhecimentos recebidos</h2>
              </div>
              <small>{{ currentOverview.scopeSummary.applauseEntries }} registros</small>
            </header>
            <div class="dashboard__applause">
              <strong>{{ currentOverview.scopeSummary.applauseEntries }}</strong>
              <span>Aplouses recebidos no escopo</span>
              <p>{{ applauseCoverageLabel(currentOverview) }}</p>
            </div>
          </article>

          <article class="dashboard__panel dashboard__panel--wide">
            <header>
              <div>
                <span>Pessoas e areas</span>
                <h2>Media de satisfacao</h2>
              </div>
              <small>{{ bestSatisfactionScore() }}</small>
            </header>
            <app-dashboard-bar-chart [items]="satisfactionItems()" ariaLabel="Satisfacao media por area" [valueMax]="5" />
          </article>

          <article class="dashboard__panel dashboard__panel--wide" id="governanca">
            <header>
              <div>
                <span>Governanca</span>
                <h2>{{ modeLabel(currentOverview) }}</h2>
              </div>
              <small>{{ currentOverview.scopeLabel }}</small>
            </header>
            <div class="dashboard__governance-grid">
              @for (action of quickActions(); track action.label) {
                <a [routerLink]="action.path" [attr.aria-label]="'Abrir ' + action.label">
                  <span>{{ action.label }}</span>
                  <strong>{{ action.detail }}</strong>
                </a>
              }
            </div>
          </article>
        </section>

        @if (isLoading()) {
          <p class="dashboard__updating" aria-live="polite">Atualizando indicadores...</p>
        }
      } @else {
        @if (errorMessage()) {
          <div class="dashboard__error" role="alert">
            <p>{{ errorMessage() }}</p>
            <button type="button" class="dashboard__secondary" (click)="loadOverview()">Tentar novamente</button>
          </div>
        } @else {
          <p class="dashboard__state">Carregando indicadores...</p>
        }
      }
    </section>
  `,
  styles: `
    .dashboard { display: grid; gap: 14px; max-width: 1280px; }
    .dashboard__hero, .dashboard__nav, .dashboard__filters, .dashboard__panel, .dashboard__kpis article {
      color: var(--abc-text);
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: 8px;
      box-shadow: 0 10px 28px color-mix(in srgb, var(--abc-navy) 7%, transparent);
    }
    .dashboard__hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 18px;
      background: var(--abc-navy);
      color: var(--abc-on-blue);
    }
    .dashboard__brand { display: flex; align-items: center; gap: 16px; min-width: 0; }
    .dashboard__brand-mark {
      display: grid;
      width: 58px;
      height: 58px;
      flex: 0 0 auto;
      place-items: center;
      color: var(--abc-blue);
      font-size: 24px;
      font-weight: 900;
      border-right: 1px solid rgb(255 255 255 / 22%);
    }
    .dashboard__brand p, .dashboard__brand span, .dashboard__stamp span, .dashboard__hero small {
      margin: 0;
      color: rgb(248 250 252 / 72%);
    }
    h1 { margin: 0; font-size: 30px; line-height: 1.1; }
    h2 { margin: 3px 0 0; font-size: 17px; line-height: 1.2; }
    .dashboard__hero-actions { display: flex; align-items: center; gap: 12px; }
    .dashboard__stamp {
      min-width: 170px;
      padding: 10px 12px;
      background: rgb(255 255 255 / 10%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 8px;
    }
    .dashboard__stamp span, .dashboard__stamp strong { display: block; }
    .dashboard__stamp strong { margin-top: 2px; font-size: 14px; }
    button {
      min-height: 38px;
      padding: 0 14px;
      color: var(--abc-on-blue);
      font-weight: 800;
      background: var(--abc-blue);
      border: 0;
      border-radius: 6px;
    }
    button:disabled { cursor: wait; opacity: 0.65; }
    .dashboard__secondary { color: var(--abc-text); background: var(--abc-surface); border: 1px solid var(--abc-border); }
    .dashboard__nav {
      display: grid;
      grid-template-columns: auto repeat(5, minmax(0, 1fr));
      gap: 8px;
      align-items: center;
      padding: 10px 12px;
    }
    .dashboard__nav strong {
      color: var(--abc-text);
      font-size: 13px;
      text-transform: uppercase;
    }
    .dashboard__nav a, .dashboard__governance-grid a {
      min-height: 36px;
      padding: 9px 12px;
      color: inherit;
      text-align: center;
      text-decoration: none;
      background: var(--abc-surface-muted);
      border: 1px solid var(--abc-border);
      border-radius: 6px;
      font-weight: 800;
    }
    .dashboard__nav a:first-of-type { color: var(--abc-on-blue); background: var(--abc-blue); border-color: var(--abc-blue); box-shadow: 0 8px 18px color-mix(in srgb, var(--abc-blue) 22%, transparent); }
    .dashboard__filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: end;
      padding: 14px;
    }
    label { display: grid; gap: 6px; min-width: 210px; color: var(--abc-text-muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
    select {
      min-height: 40px;
      padding: 8px 10px;
      color: var(--abc-text);
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: 6px;
    }
    .dashboard__filter-note { display: grid; gap: 4px; min-width: 220px; padding: 8px 10px; background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-radius: 6px; }
    .dashboard__filter-note span, .dashboard__panel header span, .dashboard__kpis span {
      color: var(--abc-text-muted);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .dashboard__filter-note strong { font-size: 14px; }
    .dashboard__error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      color: var(--abc-danger);
      background: color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface));
      border: 1px solid color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border));
      border-radius: 8px;
    }
    .dashboard__error p, .dashboard__state, .dashboard__updating { margin: 0; color: var(--abc-text-muted); }
    .dashboard__kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
    .dashboard__kpis article { min-height: 118px; padding: 14px; border-left: 3px solid var(--abc-blue); }
    .dashboard__kpis strong { display: block; margin: 8px 0 4px; font-size: 24px; line-height: 1.1; }
    .dashboard__kpis small, .dashboard__panel small, .dashboard__empty, .dashboard__mini-list p, .dashboard__applause p {
      color: var(--abc-text-muted);
      line-height: 1.45;
    }
    .dashboard__board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .dashboard__panel { display: grid; gap: 16px; min-height: 250px; padding: 16px; }
    .dashboard__panel--wide { grid-column: span 2; }
    .dashboard__panel header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
    }
    .dashboard__split { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 18px; align-items: start; }
    .dashboard__stack { display: grid; gap: 14px; }
    .dashboard__mini-list { display: grid; gap: 8px; }
    .dashboard__mini-list p { margin: 0; padding: 10px 12px; background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-radius: 6px; }
    .dashboard__question-analysis { display: grid; gap: 10px; padding-top: 12px; border-top: 1px solid var(--abc-border); }
    .dashboard__question-analysis-head, .dashboard__category-head, .dashboard__question-card-head, .dashboard__option-label { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
    .dashboard__relationship-analysis, .dashboard__category, .dashboard__question-card { border: 1px solid var(--abc-border); border-radius: 8px; }
    .dashboard__relationship-analysis, .dashboard__category { display: grid; gap: 8px; padding: 10px; background: var(--abc-surface-muted); }
    .dashboard__category-list { display: grid; gap: 8px; }
    .dashboard__question-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .dashboard__question-card { display: grid; gap: 7px; padding: 10px; background: var(--abc-surface); }
    .dashboard__question-card-head span, .dashboard__zero-badge { font-size: 12px; }
    .dashboard__option-list { display: grid; gap: 5px; }
    .dashboard__option-track { height: 6px; overflow: hidden; background: var(--abc-border); border-radius: 999px; }
    .dashboard__option-track span { display: block; height: 100%; background: var(--abc-blue); }
    .dashboard__donuts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; align-items: start; }
    .dashboard__risk-strip, .dashboard__alerts {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .dashboard__risk-strip div, .dashboard__alerts article {
      padding: 12px;
      background: var(--abc-surface-muted);
      border: 1px solid var(--abc-border);
      border-left: 3px solid var(--abc-blue);
      border-radius: 6px;
    }
    .dashboard__alert--critical { border-left-color: var(--abc-danger) !important; }
    .dashboard__alert--warning { border-left-color: var(--abc-warning) !important; }
    .dashboard__alert--positive { border-left-color: var(--abc-success) !important; }
    .dashboard__risk-strip span, .dashboard__alerts span, .dashboard__alerts small, .dashboard__applause span {
      display: block;
      color: var(--abc-text-muted);
      font-size: 12px;
    }
    .dashboard__risk-strip strong, .dashboard__alerts strong { display: block; margin-top: 6px; font-size: 22px; }
    .dashboard__applause {
      display: grid;
      align-content: center;
      min-height: 168px;
      padding: 18px;
      background: color-mix(in srgb, var(--abc-success) 10%, var(--abc-surface-muted));
      border: 1px solid color-mix(in srgb, var(--abc-success) 28%, var(--abc-border));
      border-radius: 8px;
    }
    .dashboard__applause strong { font-size: 54px; line-height: 1; color: var(--abc-success); }
    .dashboard__applause span { margin-top: 8px; font-weight: 800; text-transform: uppercase; }
    .dashboard__governance-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
    .dashboard__governance-grid a { display: grid; gap: 4px; text-align: left; }
    .dashboard__governance-grid span { color: var(--abc-blue-dark); font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .dashboard__governance-grid strong { font-size: 13px; }
    @media (max-width: 1120px) {
      .dashboard__kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .dashboard__board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dashboard__panel--wide { grid-column: 1 / -1; }
      .dashboard__governance-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .dashboard__hero, .dashboard__panel header, .dashboard__error { align-items: stretch; flex-direction: column; }
      .dashboard__hero-actions, .dashboard__brand { align-items: stretch; flex-direction: column; }
      .dashboard__brand-mark { width: 100%; height: 44px; border-right: 0; border-bottom: 1px solid rgb(255 255 255 / 22%); }
      .dashboard__nav, .dashboard__kpis, .dashboard__board, .dashboard__split, .dashboard__donuts, .dashboard__risk-strip, .dashboard__alerts, .dashboard__governance-grid, .dashboard__question-grid {
        grid-template-columns: 1fr;
      }
      label, .dashboard__filter-note { width: 100%; }
      h1 { font-size: 24px; }
    }
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
  readonly evaluationResultItems = computed<DashboardChartDatum[]>(() =>
    (this.overview()?.evaluationResultsSummary ?? []).map((item) => ({
      label: item.relationshipType,
      value: item.adherencePercentage,
      valueLabel: `${item.adherencePercentage}%`,
    })),
  );
  readonly evaluationQuestionGroups = computed<DashboardRelationshipQuestionGroup[]>(() =>
    (this.overview()?.responseDistributions ?? [])
      .map((distribution) => this.buildRelationshipQuestionGroup(distribution))
      .filter((group) => group.categories.length > 0),
  );
  readonly evaluationQuestionCount = computed(() =>
    this.evaluationQuestionGroups().reduce(
      (total, group) =>
        total + group.categories.reduce((categoryTotal, category) => categoryTotal + category.questions.length, 0),
      0,
    ),
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

  pdiRiskItems(overview: DashboardOverview): DashboardChartDatum[] {
    const risk = this.riskSummary(overview);
    return [
      { label: 'Nao iniciados', value: risk.notStartedDevelopmentPlans, valueLabel: String(risk.notStartedDevelopmentPlans) },
      { label: 'Bloqueados', value: risk.blockedDevelopmentPlans, valueLabel: String(risk.blockedDevelopmentPlans) },
      { label: 'Eventos pendentes', value: risk.pendingLearningEvents, valueLabel: String(risk.pendingLearningEvents) },
    ];
  }

  complianceItems(overview: DashboardOverview): DashboardChartDatum[] {
    const risk = this.riskSummary(overview);
    return [
      { label: 'Abertos', value: risk.openIncidents, valueLabel: String(risk.openIncidents) },
      { label: 'Fora do prazo', value: risk.overdueIncidents, valueLabel: String(risk.overdueIncidents) },
      { label: 'Sem responsavel', value: risk.unassignedIncidents, valueLabel: String(risk.unassignedIncidents) },
    ];
  }

  applauseCoverageLabel(overview: DashboardOverview): string {
    const peopleCount = overview.scopeSummary.peopleCount;
    if (!peopleCount) return 'Sem pessoas no recorte atual.';
    const applauseMetric = overview.donutMetrics.find((metric) => metric.key === 'applause');
    return `${applauseMetric?.percentage ?? 0}% das pessoas tiveram reconhecimento recebido no recorte.`;
  }

  governanceLabel(overview: DashboardOverview): string {
    if (overview.mode === 'team') return 'Gestor visualiza somente a propria equipe';
    if (overview.mode === 'personal') return 'Usuario visualiza somente o proprio recorte';
    return 'Admin e RH visualizam consolidado autorizado';
  }

  modeLabel(overview: DashboardOverview): string {
    if (overview.mode === 'team') return 'Visao gerencial por equipe direta';
    if (overview.mode === 'personal') return 'Visao individual';
    return 'Visao administrativa consolidada';
  }

  bestSatisfactionScore(): string {
    const best = [...(this.overview()?.satisfactionByArea ?? [])].sort((left, right) => right.scoreValue - left.scoreValue)[0];
    return best ? `${best.score} de media em ${best.area}` : 'Sem leitura suficiente';
  }

  questionTrackKey(question: DashboardQuestionDistribution): string {
    return question.questionKey || question.questionnaireQuestionId || question.questionId;
  }

  private buildRelationshipQuestionGroup(distribution: DashboardResponseDistribution): DashboardRelationshipQuestionGroup {
    const categories = new Map<string, DashboardQuestionDistribution[]>();
    for (const question of distribution.questions ?? []) {
      const category = question.dimensionTitle || 'Sem categoria';
      categories.set(category, [...(categories.get(category) ?? []), question]);
    }

    return {
      relationshipType: distribution.relationshipType,
      relationshipLabel: this.relationshipLabel(distribution.relationshipType),
      totalResponses: distribution.totalResponses || 0,
      totalEligibleResponses: distribution.totalEligibleResponses || distribution.totalResponses || 0,
      categories: [...categories.entries()]
        .map(([category, questions]) => ({
          category,
          questions: [...questions].sort(
            (left, right) =>
              String(left.questionPrompt || '').localeCompare(String(right.questionPrompt || ''), 'pt-BR'),
          ),
          totalAnswers: questions.reduce(
            (total, question) => total + Number(question.totalAnswers || question.answeredCount || 0),
            0,
          ),
          averageScoreLabel: this.categoryAverageScoreLabel(questions),
        }))
        .sort((left, right) => left.category.localeCompare(right.category, 'pt-BR')),
    };
  }

  private categoryAverageScoreLabel(questions: DashboardQuestionDistribution[]): string {
    const scores = questions
      .map((question) => question.averageScore)
      .filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
    if (!scores.length) return '-';
    return (scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1);
  }

  private relationshipLabel(relationshipType: string): string {
    const labels: Record<string, string> = {
      manager: 'Lider avalia liderado',
      peer: 'Pares',
      self: 'Autoavaliacao',
      'cross-functional': 'Avaliacao transversal',
      'leader-self': 'Autoavaliacao do lider',
      'peer-same-area': 'Mesmo setor',
      company: 'Satisfacao',
    };
    return labels[relationshipType] || relationshipType;
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
