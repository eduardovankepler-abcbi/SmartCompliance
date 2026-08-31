import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import {
  DashboardDistributionOption,
  DashboardOperationalAlert,
  DashboardOverview,
  DashboardQuestionPeriodComparison,
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

interface SelectedDashboardQuestion {
  relationshipLabel: string;
  category: string;
  question: DashboardQuestionDistribution;
}

interface QuestionTrendSeries {
  value: string | number;
  label: string | number;
  color: string;
  points: string;
  latestPercentage: number;
}

type DashboardTab = 'evaluations' | 'governance';
type GovernanceTone = 'positive' | 'warning' | 'critical' | 'neutral';

interface GovernanceModalityRow {
  relationshipType: string;
  label: string;
  totalAssignments: number;
  totalResponses: number;
  pendingAssignments: number;
  adherencePercentage: number;
  readingLabel: string;
  readingTone: GovernanceTone;
  scoreParticipationLabel: string;
}

interface GovernanceChecklistItem {
  key: string;
  label: string;
  detail: string;
  tone: GovernanceTone;
}

interface GovernanceExecutiveSummary {
  statusLabel: string;
  limitationLabel: string;
  riskLabel: string;
  nextActionLabel: string;
  adherencePercentage: number;
  respondingModalities: number;
  totalModalities: number;
  comparableQuestions: number;
  protectedQuestions: number;
  tone: GovernanceTone;
}

interface GovernanceTimelineRow {
  key: string;
  label: string;
  totalAssignments: number;
  submittedAssignments: number;
  pendingAssignments: number;
  adherencePercentage: number;
  deltaLabel: string;
  tone: GovernanceTone;
}

interface GovernanceDataQuality {
  totalQuestions: number;
  answeredQuestions: number;
  unansweredQuestions: number;
  comparableQuestions: number;
  nonComparableQuestions: number;
  protectedQuestions: number;
  readablePercentage: number;
  conclusionLabel: string;
  conclusionDetail: string;
  tone: GovernanceTone;
}

interface GovernanceCoverageGap {
  relationshipType: string;
  label: string;
  pendingAssignments: number;
  adherencePercentage: number;
  detail: string;
  tone: GovernanceTone;
}

interface GovernancePriorityAction {
  key: string;
  domain: string;
  label: string;
  detail: string;
  recommendation: string;
  value: number;
  tone: GovernanceTone;
}

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
          <button
            type="button"
            class="dashboard__nav-tab"
            [class.dashboard__nav-tab--active]="activeDashboardTab() === 'evaluations'"
            [attr.aria-current]="activeDashboardTab() === 'evaluations' ? 'page' : null"
            (click)="selectDashboardTab('evaluations')"
          >
            Avaliacoes
          </button>
          <a [routerLink]="['/app/dashboard/pdi']">PDI</a>
          <a [routerLink]="['/app/dashboard/compliance']">Compliance</a>
          <a [routerLink]="['/app/dashboard/applause']">Aplause</a>
          <button
            type="button"
            class="dashboard__nav-tab"
            [class.dashboard__nav-tab--active]="activeDashboardTab() === 'governance'"
            [attr.aria-current]="activeDashboardTab() === 'governance' ? 'page' : null"
            (click)="selectDashboardTab('governance')"
          >
            Governanca
          </button>
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
                <option [value]="option.value" [selected]="option.value === timeGrouping()">{{ option.label }}</option>
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

        @if (activeDashboardTab() === 'evaluations') {
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

          <article class="dashboard__panel dashboard__panel--full">
            <section class="dashboard__question-analysis" aria-label="Analise das respostas por pergunta">
              <div class="dashboard__question-analysis-head">
                <div>
                  <span>Analise por categoria</span>
                  <h2>Perguntas e respostas</h2>
                </div>
                <small>{{ evaluationQuestionCount() }} perguntas no recorte</small>
              </div>

              @if (evaluationQuestionGroups().length) {
                @for (relationship of evaluationQuestionGroups(); track relationship.relationshipType; let firstRelationship = $first) {
                  @if (!firstRelationship) {
                    <hr aria-hidden="true" />
                  }
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
                                <div>
                                  <div class="dashboard__question-card-head">
                                    <strong>{{ questionOrderLabel(question) }}{{ question.questionPrompt }}</strong>
                                    <span>{{ question.totalAnswers || 0 }} resp.</span>
                                  </div>
                                  @if (!(question.totalAnswers || question.answeredCount || 0)) {
                                    <small class="dashboard__zero-badge">Sem respostas ainda</small>
                                  }
                                  <button
                                    type="button"
                                    class="dashboard__secondary dashboard__question-action"
                                    (click)="openQuestionTrend(relationship.relationshipLabel, category.category, question)"
                                  >
                                    Ver evolução
                                  </button>
                                </div>

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

          </section>
        } @else {
          <section class="dashboard__governance" aria-labelledby="governance-title">
            <header class="dashboard__governance-head">
              <div>
                <span>Governanca executiva</span>
                <h2 id="governance-title">Controle, cobertura e prontidao do recorte</h2>
              </div>
              <small>{{ currentOverview.scopeLabel }}</small>
            </header>

            @if (governanceExecutiveSummary(); as summary) {
              <section class="dashboard__governance-block" aria-labelledby="governance-summary-title">
                <header>
                  <div>
                    <span>Sintese para decisao</span>
                    <h3 id="governance-summary-title">Leitura executiva do recorte</h3>
                  </div>
                  <span class="dashboard__status" [attr.data-tone]="summary.tone">{{ summary.statusLabel }}</span>
                </header>
                <div class="dashboard__governance-panorama">
                  <article class="dashboard__governance-context">
                    <dl>
                      <div><dt>Principal limitacao</dt><dd>{{ summary.limitationLabel }}</dd></div>
                      <div><dt>Risco mais urgente</dt><dd>{{ summary.riskLabel }}</dd></div>
                      <div><dt>Proxima acao</dt><dd>{{ summary.nextActionLabel }}</dd></div>
                    </dl>
                    <p><strong>Critério:</strong> a situação combina cobertura, comparabilidade, privacidade e riscos já disponíveis no dashboard.</p>
                  </article>
                  <div class="dashboard__governance-metrics" aria-label="Evidencias da sintese executiva">
                    <article><span>Adesao geral</span><strong>{{ summary.adherencePercentage }}%</strong></article>
                    <article><span>Modalidades ativas</span><strong>{{ summary.respondingModalities }}/{{ summary.totalModalities }}</strong></article>
                    <article><span>Comparaveis</span><strong>{{ summary.comparableQuestions }}</strong></article>
                    <article><span>Protegidas</span><strong>{{ summary.protectedQuestions }}</strong></article>
                  </div>
                </div>
              </section>
            }

            <section class="dashboard__governance-block" aria-labelledby="governance-panorama-title">
              <header>
                <div>
                  <span>Panorama de governanca</span>
                  <h3 id="governance-panorama-title">Contexto administrativo atual</h3>
                </div>
              </header>
              <div class="dashboard__governance-panorama">
                <article class="dashboard__governance-context">
                  <dl>
                    <div><dt>Escopo</dt><dd>{{ currentOverview.scopeLabel }}</dd></div>
                    <div><dt>Visibilidade</dt><dd>{{ visibilityProfileLabel(currentOverview) }}</dd></div>
                    <div><dt>Agrupamento</dt><dd>{{ timeGroupingLabel(currentOverview.timeGrouping) }}</dd></div>
                    <div><dt>Area</dt><dd>{{ governanceAreaLabel(currentOverview) }}</dd></div>
                  </dl>
                  <p><strong>Privacidade:</strong> {{ privacyRuleLabel(currentOverview) }}</p>
                </article>
                <div class="dashboard__governance-metrics" aria-label="Totais do recorte">
                  <article><span>Pessoas</span><strong>{{ currentOverview.scopeSummary.peopleCount }}</strong></article>
                  <article><span>Distribuidos</span><strong>{{ currentOverview.scopeSummary.totalAssignments }}</strong></article>
                  <article><span>Concluidos</span><strong>{{ currentOverview.scopeSummary.submittedAssignments }}</strong></article>
                  <article><span>Pendentes</span><strong>{{ currentOverview.scopeSummary.pendingAssignments }}</strong></article>
                </div>
              </div>
            </section>

            <section class="dashboard__governance-block" aria-labelledby="governance-evolution-title">
              <header>
                <div>
                  <span>Evolucao e confiabilidade</span>
                  <h3 id="governance-evolution-title">Cobertura ao longo do tempo e qualidade da leitura</h3>
                </div>
              </header>
              <div class="dashboard__governance-panorama">
                <article class="dashboard__governance-context">
                  <strong>Evolucao de cobertura</strong>
                  @if (governanceTimeline().length) {
                    <div class="dashboard__governance-table-wrap" style="margin-top:12px">
                      <table class="dashboard__governance-table" style="min-width:560px">
                        <thead><tr><th>Periodo</th><th>Distribuidos</th><th>Concluidos</th><th>Pendentes</th><th>Adesao</th><th>Variacao</th></tr></thead>
                        <tbody>
                          @for (period of governanceTimeline(); track period.key) {
                            <tr>
                              <td><strong>{{ period.label }}</strong></td>
                              <td>{{ period.totalAssignments }}</td>
                              <td>{{ period.submittedAssignments }}</td>
                              <td>{{ period.pendingAssignments }}</td>
                              <td>{{ period.adherencePercentage }}%</td>
                              <td><span class="dashboard__status" [attr.data-tone]="period.tone">{{ period.deltaLabel }}</span></td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <p>Sem periodos disponiveis para comparacao.</p>
                  }
                </article>
                @if (governanceDataQuality(); as quality) {
                  <article class="dashboard__governance-context">
                    <strong>Qualidade dos dados</strong>
                    <p><span class="dashboard__status" [attr.data-tone]="quality.tone">{{ quality.conclusionLabel }}</span> {{ quality.conclusionDetail }}</p>
                    <div class="dashboard__governance-checklist">
                      <article data-tone="neutral"><span>Total</span><strong>{{ quality.totalQuestions }}</strong><p>Perguntas esperadas</p></article>
                      <article data-tone="positive"><span>Respondidas</span><strong>{{ quality.answeredQuestions }}</strong><p>Com alguma resposta</p></article>
                      <article data-tone="neutral"><span>Leitura</span><strong>{{ quality.readablePercentage }}%</strong><p>Disponibilidade útil</p></article>
                      <article data-tone="warning"><span>Sem resposta</span><strong>{{ quality.unansweredQuestions }}</strong><p>Aguardando cobertura</p></article>
                      <article data-tone="warning"><span>Sem historico</span><strong>{{ quality.nonComparableQuestions }}</strong><p>Ainda não comparáveis</p></article>
                      <article data-tone="warning"><span>Protegidas</span><strong>{{ quality.protectedQuestions }}</strong><p>Privacidade aplicada</p></article>
                    </div>
                  </article>
                }
              </div>
            </section>

            <section class="dashboard__governance-block" aria-labelledby="governance-coverage-title">
              <header>
                <div>
                  <span>Cobertura e privacidade</span>
                  <h3 id="governance-coverage-title">Leitura por modalidade</h3>
                </div>
                <small>{{ governanceModalities().length }} modalidades</small>
              </header>
              @if (governanceCoverageGaps().length) {
                <div class="dashboard__governance-checklist" aria-label="Maiores lacunas de cobertura">
                  @for (gap of governanceCoverageGaps(); track gap.relationshipType) {
                    <article [attr.data-tone]="gap.tone">
                      <span class="dashboard__status" [attr.data-tone]="gap.tone">{{ gap.pendingAssignments }} pendentes</span>
                      <strong>{{ gap.label }}</strong>
                      <p>{{ gap.detail }}</p>
                    </article>
                  }
                </div>
              }
              @if (governanceModalities().length) {
                <div class="dashboard__governance-table-wrap">
                  <table class="dashboard__governance-table">
                    <thead>
                      <tr>
                        <th>Modalidade</th>
                        <th>Assignments</th>
                        <th>Respostas</th>
                        <th>Pendentes</th>
                        <th>Adesao</th>
                        <th>Leitura</th>
                        <th>Pontuacao</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (modality of governanceModalities(); track modality.relationshipType) {
                        <tr>
                          <td><strong>{{ modality.label }}</strong></td>
                          <td>{{ modality.totalAssignments }}</td>
                          <td>{{ modality.totalResponses }}</td>
                          <td>{{ modality.pendingAssignments }}</td>
                          <td>
                            <strong>{{ modality.adherencePercentage }}%</strong>
                            <div class="dashboard__option-track"><span [style.width.%]="modality.adherencePercentage"></span></div>
                          </td>
                          <td><span class="dashboard__status" [attr.data-tone]="modality.readingTone">{{ modality.readingLabel }}</span></td>
                          <td>{{ modality.scoreParticipationLabel }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="dashboard__empty">Nenhuma modalidade distribuida no recorte atual.</p>
              }
            </section>

            <section class="dashboard__governance-block" aria-labelledby="governance-actions-title">
              <header>
                <div>
                  <span>Agenda prioritaria</span>
                  <h3 id="governance-actions-title">Acoes recomendadas para o recorte</h3>
                </div>
              </header>
              <div class="dashboard__governance-checklist">
                @for (action of governancePriorityActions(); track action.key) {
                  <article [attr.data-tone]="action.tone">
                    <span class="dashboard__status" [attr.data-tone]="action.tone">{{ action.domain }} · {{ governanceToneLabel(action.tone) }}</span>
                    <strong>{{ action.label }}</strong>
                    <p>{{ action.detail }}</p>
                    <p><strong>Acao:</strong> {{ action.recommendation }}</p>
                  </article>
                }
              </div>
              <header>
                <div>
                  <span>Checklist de controles</span>
                  <h3>Prontidao para decisao</h3>
                </div>
              </header>
              <div class="dashboard__governance-table-wrap">
                <table class="dashboard__governance-table" style="min-width:700px">
                  <thead><tr><th>Controle</th><th>Situacao</th><th>Evidencia</th></tr></thead>
                  <tbody>
                    @for (item of governanceChecklist(); track item.key) {
                      <tr>
                        <td><strong>{{ item.label }}</strong></td>
                        <td><span class="dashboard__status" [attr.data-tone]="item.tone">{{ governanceToneLabel(item.tone) }}</span></td>
                        <td>{{ item.detail }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        }

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

      @if (selectedQuestion(); as selected) {
        <div
          role="presentation"
          style="position:fixed;inset:0;z-index:20;padding:24px;overflow:auto;background:rgb(15 23 42 / 72%)"
          (click)="closeQuestionTrend()"
        >
          <section
            class="dashboard__panel dashboard__modal"
            style="width:min(980px,100%);max-height:90vh;margin:auto;overflow:auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="question-trend-title"
            (click)="$event.stopPropagation()"
          >
            <header>
              <div>
                <span>{{ selected.relationshipLabel }} · {{ selected.category }}</span>
                <h2 id="question-trend-title">{{ selected.question.questionPrompt }}</h2>
              </div>
              <button type="button" class="dashboard__secondary" (click)="closeQuestionTrend()">Fechar</button>
            </header>

            @if (hasComparableTrend(selected.question)) {
              <div class="dashboard__trend-layout">
                <svg width="100%" height="300" viewBox="0 0 640 260" role="img" [attr.aria-label]="'Evolucao percentual das respostas por periodo'">
                  <line x1="44" y1="24" x2="44" y2="212" stroke="currentColor" stroke-width="2" />
                  <line x1="44" y1="212" x2="612" y2="212" stroke="currentColor" stroke-width="2" />
                  @for (tick of trendTicks; track tick) {
                    <line [attr.x1]="44" [attr.x2]="612" [attr.y1]="trendY(tick)" [attr.y2]="trendY(tick)" stroke="currentColor" stroke-width="1" opacity=".35" />
                    <text x="8" [attr.y]="trendY(tick) + 4" fill="currentColor">{{ tick }}%</text>
                  }
                  @for (series of trendSeries(selected.question); track series.value) {
                    <polyline [attr.points]="series.points" [attr.stroke]="series.color" fill="none" stroke-width="3" />
                  }
                  @for (period of trendPeriods(selected.question); track period.key; let i = $index) {
                    <text [attr.x]="trendX(i, trendPeriods(selected.question).length)" y="238" text-anchor="middle" fill="currentColor">{{ period.label }}</text>
                  }
                </svg>
                <div class="dashboard__trend-legend">
                  @for (series of trendSeries(selected.question); track series.value) {
                    <div>
                      <span [style.color]="series.color">●</span>
                      <strong>{{ series.label }}</strong>
                      <small>{{ series.latestPercentage }}% no periodo atual</small>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="dashboard__question-empty">
                <strong>Sem histórico comparável</strong>
                <span>O gráfico será exibido quando houver pelo menos dois períodos com distribuição de respostas disponível.</span>
              </div>
            }
          </section>
        </div>
      }
    </section>
  `,
  styles: `
    .dashboard { display: grid; gap: 14px; max-width: 1280px; }
    .dashboard__hero, .dashboard__nav, .dashboard__filters, .dashboard__panel, .dashboard__kpis article, .dashboard__governance-head, .dashboard__governance-block {
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
    .dashboard__nav a, .dashboard__nav-tab {
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
    .dashboard__nav-tab--active { color: var(--abc-on-blue); background: var(--abc-blue); border-color: var(--abc-blue); box-shadow: 0 8px 18px color-mix(in srgb, var(--abc-blue) 22%, transparent); }
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
    .dashboard__panel--full { grid-column: 1 / -1; }
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
    .dashboard__question-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 8px; }
    .dashboard__question-card { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(220px, 1.1fr); gap: 12px; padding: 10px; background: var(--abc-surface); }
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
    .dashboard__governance { display: grid; gap: 14px; }
    .dashboard__governance-head, .dashboard__governance-block > header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 12px;
    }
    .dashboard__governance-head { padding: 16px; border-left: 3px solid var(--abc-blue); }
    .dashboard__governance-head span, .dashboard__governance-block header span, .dashboard__governance-metrics span {
      color: var(--abc-text-muted);
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .dashboard__governance-head small, .dashboard__governance-block header small { color: var(--abc-text-muted); }
    .dashboard__governance-block { display: grid; gap: 14px; padding: 16px; }
    .dashboard__governance-block h3 { margin: 3px 0 0; font-size: 16px; }
    .dashboard__governance-panorama { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(420px, .65fr); gap: 14px; }
    .dashboard__governance-context { min-width: 0; padding: 14px; background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-radius: 7px; }
    .dashboard__governance-context dl { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 0; }
    .dashboard__governance-context dt { color: var(--abc-text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .dashboard__governance-context dd { margin: 4px 0 0; font-size: 13px; font-weight: 800; }
    .dashboard__governance-context p { margin: 14px 0 0; padding-top: 12px; color: var(--abc-text-muted); border-top: 1px solid var(--abc-border); font-size: 13px; line-height: 1.45; }
    .dashboard__governance-context p strong { color: var(--abc-text); }
    .dashboard__governance-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .dashboard__governance-metrics article { padding: 12px; background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-top: 3px solid var(--abc-blue); border-radius: 7px; }
    .dashboard__governance-metrics strong { display: block; margin-top: 7px; font-size: 24px; }
    .dashboard__governance-table-wrap { overflow-x: auto; border: 1px solid var(--abc-border); border-radius: 7px; }
    .dashboard__governance-table { width: 100%; min-width: 820px; border-collapse: collapse; font-size: 13px; }
    .dashboard__governance-table th, .dashboard__governance-table td { padding: 11px 12px; text-align: left; border-bottom: 1px solid var(--abc-border); }
    .dashboard__governance-table th { color: var(--abc-text-muted); background: var(--abc-surface-muted); font-size: 11px; text-transform: uppercase; }
    .dashboard__governance-table tbody tr:last-child td { border-bottom: 0; }
    .dashboard__status { display: inline-flex; padding: 4px 8px; color: var(--abc-text-muted); background: var(--abc-surface-muted); border: 1px solid var(--abc-border); border-radius: 999px; font-size: 11px; font-weight: 800; }
    .dashboard__status[data-tone='positive'] { color: var(--abc-success); background: color-mix(in srgb, var(--abc-success) 9%, var(--abc-surface)); border-color: color-mix(in srgb, var(--abc-success) 28%, var(--abc-border)); }
    .dashboard__status[data-tone='warning'] { color: var(--abc-warning); background: color-mix(in srgb, var(--abc-warning) 9%, var(--abc-surface)); border-color: color-mix(in srgb, var(--abc-warning) 28%, var(--abc-border)); }
    .dashboard__status[data-tone='critical'] { color: var(--abc-danger); background: color-mix(in srgb, var(--abc-danger) 9%, var(--abc-surface)); border-color: color-mix(in srgb, var(--abc-danger) 28%, var(--abc-border)); }
    .dashboard__governance-checklist { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .dashboard__governance-checklist article { display: grid; align-content: start; gap: 8px; padding: 12px; border: 1px solid var(--abc-border); border-left: 3px solid var(--abc-border); border-radius: 7px; }
    .dashboard__governance-checklist article[data-tone='positive'] { border-left-color: var(--abc-success); }
    .dashboard__governance-checklist article[data-tone='warning'] { border-left-color: var(--abc-warning); }
    .dashboard__governance-checklist article[data-tone='critical'] { border-left-color: var(--abc-danger); }
    .dashboard__governance-checklist p { margin: 0; color: var(--abc-text-muted); font-size: 13px; line-height: 1.4; }
    @media (max-width: 1120px) {
      .dashboard__kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .dashboard__board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dashboard__panel--wide { grid-column: 1 / -1; }
      .dashboard__governance-panorama { grid-template-columns: 1fr; }
      .dashboard__governance-checklist { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .dashboard__hero, .dashboard__panel header, .dashboard__error, .dashboard__governance-head, .dashboard__governance-block > header { align-items: stretch; flex-direction: column; }
      .dashboard__hero-actions, .dashboard__brand { align-items: stretch; flex-direction: column; }
      .dashboard__brand-mark { width: 100%; height: 44px; border-right: 0; border-bottom: 1px solid rgb(255 255 255 / 22%); }
      .dashboard__nav, .dashboard__kpis, .dashboard__board, .dashboard__split, .dashboard__donuts, .dashboard__risk-strip, .dashboard__alerts, .dashboard__question-grid, .dashboard__governance-context dl, .dashboard__governance-checklist {
        grid-template-columns: 1fr;
      }
      .dashboard__governance-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
  readonly activeDashboardTab = signal<DashboardTab>('evaluations');
  readonly selectedQuestion = signal<SelectedDashboardQuestion | null>(null);
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
  readonly trendTicks = [0, 25, 50, 75, 100];
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
      label: this.relationshipLabel(item.relationshipType),
      value: item.adherencePercentage,
      valueLabel: `${item.adherencePercentage}%`,
    })),
  );
  readonly evaluationQuestionGroups = computed<DashboardRelationshipQuestionGroup[]>(() =>
    (this.overview()?.responseDistributions ?? [])
      .map((distribution) => this.buildRelationshipQuestionGroup(distribution))
      .filter((group) => group.categories.length > 0)
      .sort(
        (left, right) =>
          this.relationshipSortValue(left.relationshipType) - this.relationshipSortValue(right.relationshipType) ||
          left.relationshipLabel.localeCompare(right.relationshipLabel, 'pt-BR'),
      ),
  );
  readonly evaluationQuestionCount = computed(() =>
    this.evaluationQuestionGroups().reduce(
      (total, group) =>
        total + group.categories.reduce((categoryTotal, category) => categoryTotal + category.questions.length, 0),
      0,
    ),
  );
  readonly governanceModalities = computed<GovernanceModalityRow[]>(() => {
    const overview = this.overview();
    if (!overview) return [];

    const relationshipTypes = new Set([
      ...(overview.evaluationMix ?? []).map((item) => item.type),
      ...(overview.evaluationResultsSummary ?? []).map((item) => item.relationshipType),
      ...(overview.responseDistributions ?? []).map((item) => item.relationshipType),
    ]);
    return [...relationshipTypes]
      .map((relationshipType) => {
        const mix = overview.evaluationMix?.find((item) => item.type === relationshipType);
        const result = overview.evaluationResultsSummary?.find((item) => item.relationshipType === relationshipType);
        const distribution = overview.responseDistributions?.find((item) => item.relationshipType === relationshipType);
        const totalAssignments = Number(result?.totalAssignments ?? mix?.total ?? distribution?.totalEligibleResponses ?? 0);
        const totalResponses = Number(result?.totalResponses ?? distribution?.totalResponses ?? 0);
        const protectedBySample =
          distribution?.sampleSufficient === false ||
          (distribution?.questions ?? []).some((question) => question.protected || question.sampleSufficient === false);
        const adherencePercentage = Number(
          result?.adherencePercentage ?? (totalAssignments ? Math.round((totalResponses / totalAssignments) * 100) : 0),
        );

        let readingLabel = 'Leitura liberada';
        let readingTone: GovernanceTone = 'positive';
        if (!totalResponses) {
          readingLabel = 'Sem respostas';
          readingTone = 'critical';
        } else if (protectedBySample) {
          readingLabel = 'Protegida por amostra';
          readingTone = 'warning';
        } else if (totalAssignments > totalResponses) {
          readingLabel = 'Leitura parcial';
          readingTone = 'warning';
        }

        return {
          relationshipType,
          label: this.relationshipLabel(relationshipType),
          totalAssignments,
          totalResponses,
          pendingAssignments: Math.max(totalAssignments - totalResponses, 0),
          adherencePercentage,
          readingLabel,
          readingTone,
          scoreParticipationLabel:
            relationshipType === 'cross-functional'
              ? 'Nao'
              : 'Nao informado',
        };
      })
      .sort(
        (left, right) =>
          this.relationshipSortValue(left.relationshipType) - this.relationshipSortValue(right.relationshipType) ||
          left.label.localeCompare(right.label, 'pt-BR'),
      );
  });
  readonly governanceDataQuality = computed<GovernanceDataQuality | null>(() => {
    const overview = this.overview();
    if (!overview) return null;

    const questions = this.governanceQuestions(overview);
    const answeredQuestions = questions.filter(
      (question) => Number(question.totalAnswers || question.answeredCount || 0) > 0,
    );
    const protectedQuestions = questions.filter(
      (question) => question.protected || question.sampleSufficient === false,
    );
    const comparableQuestions = answeredQuestions.filter(
      (question) => !question.protected && question.sampleSufficient !== false && this.hasComparableTrend(question),
    );
    const nonComparableQuestions = answeredQuestions.filter(
      (question) => !question.protected && question.sampleSufficient !== false && !this.hasComparableTrend(question),
    );
    const readableQuestions = answeredQuestions.filter(
      (question) => !question.protected && question.sampleSufficient !== false,
    );
    const readablePercentage = questions.length
      ? Math.round((readableQuestions.length / questions.length) * 100)
      : 0;

    let conclusionLabel = 'Leitura suficiente';
    let conclusionDetail = 'O recorte possui respostas visiveis e base comparavel para analise executiva.';
    let tone: GovernanceTone = 'positive';
    if (!questions.length || !answeredQuestions.length || readablePercentage < 25) {
      conclusionLabel = 'Leitura limitada';
      conclusionDetail = questions.length
        ? 'A baixa cobertura ainda impede conclusoes consistentes.'
        : 'Nao existem perguntas esperadas no recorte atual.';
      tone = 'critical';
    } else if (
      protectedQuestions.length ||
      nonComparableQuestions.length ||
      answeredQuestions.length < questions.length
    ) {
      conclusionLabel = 'Leitura parcial';
      conclusionDetail = 'Existem evidencias uteis, mas cobertura, historico ou privacidade limitam a conclusao.';
      tone = 'warning';
    }

    return {
      totalQuestions: questions.length,
      answeredQuestions: answeredQuestions.length,
      unansweredQuestions: Math.max(questions.length - answeredQuestions.length, 0),
      comparableQuestions: comparableQuestions.length,
      nonComparableQuestions: nonComparableQuestions.length,
      protectedQuestions: protectedQuestions.length,
      readablePercentage,
      conclusionLabel,
      conclusionDetail,
      tone,
    };
  });
  readonly governanceExecutiveSummary = computed<GovernanceExecutiveSummary | null>(() => {
    const overview = this.overview();
    const quality = this.governanceDataQuality();
    if (!overview || !quality) return null;

    const modalities = this.governanceModalities();
    const respondingModalities = modalities.filter((item) => item.totalResponses > 0).length;
    const modalitiesWithoutResponses = modalities.length - respondingModalities;
    const risk = this.riskSummary(overview);
    const adherencePercentage = overview.scopeSummary.totalAssignments
      ? Math.round((overview.scopeSummary.submittedAssignments / overview.scopeSummary.totalAssignments) * 100)
      : 0;

    let limitationLabel = 'Sem limitacoes relevantes no recorte';
    let nextActionLabel = 'Manter acompanhamento periodico';
    let statusLabel = 'Leitura liberada';
    let tone: GovernanceTone = 'positive';
    if (!overview.scopeSummary.submittedAssignments) {
      limitationLabel = 'Recorte ainda sem assignments concluidos';
      nextActionLabel = 'Mobilizar os responsaveis pelas respostas';
      statusLabel = 'Leitura limitada';
      tone = 'critical';
    } else if (modalitiesWithoutResponses) {
      limitationLabel = `${modalitiesWithoutResponses} modalidades sem respostas`;
      nextActionLabel = 'Ativar as modalidades sem cobertura';
      statusLabel = 'Leitura parcial';
      tone = 'warning';
    } else if (quality.protectedQuestions) {
      limitationLabel = `${quality.protectedQuestions} perguntas protegidas por privacidade`;
      nextActionLabel = 'Aguardar amostra suficiente antes de interpretar';
      statusLabel = 'Leitura parcial';
      tone = 'warning';
    } else if (overview.scopeSummary.pendingAssignments) {
      limitationLabel = `${overview.scopeSummary.pendingAssignments} assignments pendentes`;
      nextActionLabel = 'Concluir a cobertura do recorte';
      statusLabel = 'Leitura parcial';
      tone = 'warning';
    } else if (quality.nonComparableQuestions) {
      limitationLabel = `${quality.nonComparableQuestions} perguntas ainda sem historico comparavel`;
      nextActionLabel = 'Consolidar o proximo periodo de medicao';
      statusLabel = 'Leitura parcial';
      tone = 'warning';
    }

    const riskLabel = risk.overdueIncidents
      ? `${risk.overdueIncidents} incidentes fora do prazo`
      : risk.unassignedIncidents
        ? `${risk.unassignedIncidents} incidentes sem responsavel`
        : risk.blockedDevelopmentPlans
          ? `${risk.blockedDevelopmentPlans} PDIs bloqueados`
          : risk.openIncidents
            ? `${risk.openIncidents} incidentes abertos`
            : 'Sem risco operacional critico sinalizado';

    return {
      statusLabel,
      limitationLabel,
      riskLabel,
      nextActionLabel,
      adherencePercentage,
      respondingModalities,
      totalModalities: modalities.length,
      comparableQuestions: quality.comparableQuestions,
      protectedQuestions: quality.protectedQuestions,
      tone,
    };
  });
  readonly governanceTimeline = computed<GovernanceTimelineRow[]>(() => {
    const timeline = this.overview()?.cycleTimeline ?? [];
    return timeline
      .map((period, index) => {
        const previous = timeline[index - 1];
        const delta = previous ? period.adherencePercentage - previous.adherencePercentage : null;
        return {
          key: period.key || `${period.label}-${index}`,
          label: period.label,
          totalAssignments: period.totalAssignments,
          submittedAssignments: period.submittedAssignments,
          pendingAssignments: period.pendingAssignments,
          adherencePercentage: period.adherencePercentage,
          deltaLabel: delta === null ? 'Sem comparacao' : delta === 0 ? 'Estavel' : `${delta > 0 ? '+' : ''}${delta} p.p.`,
          tone: delta === null || delta === 0 ? 'neutral' : delta > 0 ? 'positive' : 'warning',
        } satisfies GovernanceTimelineRow;
      })
      .slice(-6);
  });
  readonly governanceCoverageGaps = computed<GovernanceCoverageGap[]>(() =>
    this.governanceModalities()
      .filter((item) => item.totalAssignments > 0 && item.pendingAssignments > 0)
      .sort(
        (left, right) =>
          right.pendingAssignments - left.pendingAssignments ||
          left.adherencePercentage - right.adherencePercentage,
      )
      .slice(0, 3)
      .map((item) => ({
        relationshipType: item.relationshipType,
        label: item.label,
        pendingAssignments: item.pendingAssignments,
        adherencePercentage: item.adherencePercentage,
        detail: item.totalResponses
          ? `${item.adherencePercentage}% de adesao; concluir a cobertura restante.`
          : 'Nenhuma resposta recebida; modalidade ainda sem leitura.',
        tone: item.totalResponses ? 'warning' : 'critical',
      })),
  );
  readonly governancePriorityActions = computed<GovernancePriorityAction[]>(() => {
    const overview = this.overview();
    const quality = this.governanceDataQuality();
    if (!overview || !quality) return [];

    const risk = this.riskSummary(overview);
    const modalitiesWithoutResponses = this.governanceModalities().filter((item) => item.totalResponses === 0).length;
    const actions: GovernancePriorityAction[] = [];
    const add = (
      key: string,
      domain: string,
      label: string,
      detail: string,
      recommendation: string,
      value: number,
      tone: GovernanceTone,
    ) => actions.push({ key, domain, label, detail, recommendation, value, tone });

    if (risk.overdueIncidents) add('overdue-incidents', 'Compliance', 'Incidentes fora do prazo', `${risk.overdueIncidents} ocorrencias vencidas.`, 'Priorizar triagem, responsabilizacao e fechamento.', risk.overdueIncidents, 'critical');
    if (risk.unassignedIncidents) add('unassigned-incidents', 'Compliance', 'Incidentes sem responsavel', `${risk.unassignedIncidents} ocorrencias sem atribuicao.`, 'Definir responsavel e proximo marco de tratamento.', risk.unassignedIncidents, 'critical');
    if (modalitiesWithoutResponses) add('empty-modalities', 'Avaliacoes', 'Modalidades sem respostas', `${modalitiesWithoutResponses} modalidades ainda sem leitura.`, 'Acionar os grupos responsaveis e verificar bloqueios de distribuicao.', modalitiesWithoutResponses, 'critical');
    if (risk.blockedDevelopmentPlans) add('blocked-pdis', 'Desenvolvimento', 'PDIs bloqueados', `${risk.blockedDevelopmentPlans} ${risk.blockedDevelopmentPlans === 1 ? 'plano impedido' : 'planos impedidos'} de avancar.`, 'Remover impedimentos e registrar o proximo checkpoint.', risk.blockedDevelopmentPlans, 'critical');
    if (overview.scopeSummary.pendingAssignments) add('pending-assignments', 'Avaliacoes', 'Cobertura incompleta', `${overview.scopeSummary.pendingAssignments} assignments pendentes.`, 'Concentrar cobranca nas modalidades com maior lacuna.', overview.scopeSummary.pendingAssignments, 'warning');
    if (quality.protectedQuestions) add('protected-questions', 'Privacidade', 'Amostra insuficiente', `${quality.protectedQuestions} perguntas protegidas.`, 'Preservar a protecao e aguardar volume suficiente.', quality.protectedQuestions, 'warning');
    if (risk.notStartedDevelopmentPlans) add('not-started-pdis', 'Desenvolvimento', 'PDIs nao iniciados', `${risk.notStartedDevelopmentPlans} ${risk.notStartedDevelopmentPlans === 1 ? 'plano aguarda' : 'planos aguardam'} inicio.`, 'Programar o primeiro checkpoint com gestor e colaborador.', risk.notStartedDevelopmentPlans, 'warning');
    if (risk.pendingLearningEvents) add('pending-learning', 'Desenvolvimento', 'Aprendizagem pendente', `${risk.pendingLearningEvents} eventos ainda nao realizados.`, 'Revalidar agenda, responsavel e aplicacao esperada.', risk.pendingLearningEvents, 'warning');
    if (quality.nonComparableQuestions) add('non-comparable', 'Governanca', 'Historico ainda curto', `${quality.nonComparableQuestions} perguntas sem dois periodos comparaveis.`, 'Manter a medicao ate formar uma serie confiavel.', quality.nonComparableQuestions, 'warning');
    if (!actions.length) add('monitoring', 'Governanca', 'Manter monitoramento', 'Nenhuma acao critica foi identificada.', 'Revisar cobertura e riscos no proximo rito executivo.', 0, 'positive');

    const toneOrder: Record<GovernanceTone, number> = { critical: 0, warning: 1, neutral: 2, positive: 3 };
    return actions
      .sort((left, right) => toneOrder[left.tone] - toneOrder[right.tone])
      .slice(0, 6);
  });
  readonly governanceChecklist = computed<GovernanceChecklistItem[]>(() => {
    const overview = this.overview();
    if (!overview) return [];

    const pendingAssignments = overview.scopeSummary.pendingAssignments;
    const modalitiesWithoutResponses = this.governanceModalities().filter((item) => item.totalResponses === 0).length;
    const questions = this.governanceQuestions(overview);
    const questionsWithoutHistory = questions.filter(
      (question) =>
        !question.protected &&
        Number(question.totalAnswers || question.answeredCount || 0) > 0 &&
        !this.hasComparableTrend(question),
    ).length;
    const protectedQuestions = questions.filter(
      (question) => question.protected || question.sampleSufficient === false,
    ).length;
    const risk = this.riskSummary(overview);
    const operationalRiskIndicators = [
      risk.openIncidents,
      risk.overdueIncidents,
      risk.unassignedIncidents,
      risk.blockedDevelopmentPlans,
      risk.notStartedDevelopmentPlans,
      risk.pendingLearningEvents,
    ].filter((value) => value > 0).length;
    const readyForExecutiveReading =
      overview.scopeSummary.totalAssignments > 0 &&
      overview.scopeSummary.submittedAssignments > 0 &&
      pendingAssignments === 0 &&
      modalitiesWithoutResponses === 0 &&
      protectedQuestions === 0;

    return [
      {
        key: 'pending-assignments',
        label: 'Avaliacoes pendentes',
        detail: pendingAssignments
          ? `${pendingAssignments} assignments ainda aguardam conclusao.`
          : 'Todos os assignments distribuidos foram concluidos.',
        tone: pendingAssignments ? 'warning' : 'positive',
      },
      {
        key: 'modalities-without-responses',
        label: 'Modalidades sem respostas',
        detail: modalitiesWithoutResponses
          ? `${modalitiesWithoutResponses} modalidades ainda nao possuem respostas.`
          : 'Todas as modalidades distribuidas possuem ao menos uma resposta.',
        tone: modalitiesWithoutResponses ? 'critical' : 'positive',
      },
      {
        key: 'questions-without-history',
        label: 'Historico comparavel',
        detail: questionsWithoutHistory
          ? `${questionsWithoutHistory} perguntas respondidas ainda nao possuem dois periodos comparaveis.`
          : 'Nao foram identificadas perguntas respondidas sem historico comparavel.',
        tone: questionsWithoutHistory ? 'warning' : 'positive',
      },
      {
        key: 'protected-data',
        label: 'Protecao por amostra',
        detail: protectedQuestions
          ? `${protectedQuestions} perguntas possuem detalhe protegido por privacidade ou amostra insuficiente.`
          : 'Nenhum detalhe esta protegido por insuficiencia de amostra neste recorte.',
        tone: protectedQuestions ? 'warning' : 'positive',
      },
      {
        key: 'executive-readiness',
        label: 'Prontidao executiva',
        detail: readyForExecutiveReading
          ? 'O recorte possui cobertura completa e leitura liberada para decisao executiva.'
          : 'O recorte exige atencao aos itens sinalizados antes de uma leitura executiva conclusiva.',
        tone: readyForExecutiveReading ? 'positive' : 'warning',
      },
      {
        key: 'operational-risks',
        label: 'Riscos operacionais',
        detail: operationalRiskIndicators
          ? `${operationalRiskIndicators} indicadores operacionais demandam acompanhamento no dashboard.`
          : 'Nao ha riscos operacionais relevantes sinalizados no recorte atual.',
        tone: risk.overdueIncidents || risk.unassignedIncidents ? 'critical' : operationalRiskIndicators ? 'warning' : 'positive',
      },
    ];
  });

  selectDashboardTab(tab: DashboardTab): void {
    this.activeDashboardTab.set(tab);
  }

  visibilityProfileLabel(overview: DashboardOverview): string {
    if (overview.mode === 'team') return 'Gestor · equipe direta';
    if (overview.mode === 'personal') return 'Usuario · recorte pessoal';
    return 'Admin/RH · consolidado autorizado';
  }

  timeGroupingLabel(grouping: DashboardTimeGrouping): string {
    return this.timeGroupingOptions.find((option) => option.value === grouping)?.label ?? grouping;
  }

  governanceAreaLabel(overview: DashboardOverview): string {
    return overview.selectedArea || (this.areaFilter() === 'all' ? 'Todas as areas' : this.areaFilter());
  }

  privacyRuleLabel(overview: DashboardOverview): string {
    const minimumAggregateSize = overview.pdiAnalytics?.minimumAggregateSize;
    const sampleDescription = minimumAggregateSize
      ? `Amostra minima indicada: ${minimumAggregateSize}. `
      : '';
    return `${sampleDescription}Leituras agregadas abaixo do limite aplicavel e detalhes sensiveis permanecem protegidos.`;
  }

  governanceToneLabel(tone: GovernanceTone): string {
    if (tone === 'positive') return 'Regular';
    if (tone === 'critical') return 'Critico';
    if (tone === 'warning') return 'Atencao';
    return 'Informativo';
  }

  private governanceQuestions(overview: DashboardOverview): DashboardQuestionDistribution[] {
    return (overview.responseDistributions ?? []).flatMap((distribution) => distribution.questions ?? []);
  }

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

  openQuestionTrend(relationshipLabel: string, category: string, question: DashboardQuestionDistribution): void {
    this.selectedQuestion.set({ relationshipLabel, category, question });
  }

  closeQuestionTrend(): void {
    this.selectedQuestion.set(null);
  }

  trendPeriods(question: DashboardQuestionDistribution): DashboardQuestionPeriodComparison[] {
    return (question.comparisons?.periods || []).filter(
      (period) => Number(period.totalAnswers || 0) > 0 && Array.isArray(period.options),
    );
  }

  hasComparableTrend(question: DashboardQuestionDistribution): boolean {
    return this.trendPeriods(question).length >= 2;
  }

  trendSeries(question: DashboardQuestionDistribution): QuestionTrendSeries[] {
    const periods = this.trendPeriods(question);
    const values = new Map<string, DashboardDistributionOption>();
    for (const option of question.options || []) {
      values.set(String(option.value), option);
    }
    for (const period of periods) {
      for (const option of period.options || []) {
        values.set(String(option.value), option);
      }
    }

    return [...values.values()].slice(0, 5).map((option, index) => {
      const points = periods
        .map((period, periodIndex) => {
          const periodOption = (period.options || []).find((item) => String(item.value) === String(option.value));
          return `${this.trendX(periodIndex, periods.length)},${this.trendY(Number(periodOption?.percentage || 0))}`;
        })
        .join(' ');
      const latest = periods.at(-1)?.options?.find((item) => String(item.value) === String(option.value));
      return {
        value: option.value,
        label: option.label,
        color: this.trendColor(index),
        points,
        latestPercentage: Number(latest?.percentage || 0),
      };
    });
  }

  trendX(index: number, total: number): number {
    return total <= 1 ? 44 : 44 + (index / (total - 1)) * 568;
  }

  trendY(percentage: number): number {
    return 212 - (Math.max(0, Math.min(100, percentage)) / 100) * 188;
  }

  private trendColor(index: number): string {
    return ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'][index % 5];
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
          questions: [...questions].sort((left, right) => this.questionSortValue(left) - this.questionSortValue(right)),
          totalAnswers: questions.reduce(
            (total, question) => total + Number(question.totalAnswers || question.answeredCount || 0),
            0,
          ),
          averageScoreLabel: this.categoryAverageScoreLabel(questions),
        }))
        .sort(
          (left, right) =>
            this.categorySortValue(left.questions) - this.categorySortValue(right.questions) ||
            left.category.localeCompare(right.category, 'pt-BR'),
        ),
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
      manager: 'Avaliação do líder sobre o colaborador',
      leader: 'Avaliação do colaborador sobre o líder',
      'leader-self': 'Autoavaliação do líder',
      self: 'Autoavaliação profissional',
      'cross-functional': 'Avaliação por Colaborador de Outro Setor – não entra na pontuação',
      peer: 'Pares',
      'peer-same-area': 'Colega da mesma área',
      company: 'Satisfação',
      'client-internal': 'Cliente interno',
      'client-external': 'Cliente externo',
    };
    return labels[relationshipType] || relationshipType;
  }

  private relationshipSortValue(relationshipType: string): number {
    const order = ['manager', 'leader', 'leader-self', 'self', 'cross-functional'];
    const index = order.indexOf(relationshipType);
    return index === -1 ? order.length : index;
  }

  private questionSortValue(question: DashboardQuestionDistribution): number {
    return Number.isFinite(Number(question.position)) ? Number(question.position) : Number.MAX_SAFE_INTEGER;
  }

  private categorySortValue(questions: DashboardQuestionDistribution[]): number {
    return Math.min(...questions.map((question) => this.questionSortValue(question)));
  }

  questionOrderLabel(question: DashboardQuestionDistribution): string {
    const position = Number(question.position);
    if (/^\s*\d+\s*[\).:-]/.test(question.questionPrompt || '')) {
      return '';
    }
    return Number.isFinite(position) && position > 0 ? `${position}. ` : '';
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
