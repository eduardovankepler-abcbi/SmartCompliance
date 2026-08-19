import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { DashboardBarChartComponent, DashboardChartDatum } from './charts/dashboard-bar-chart.component';
import { DashboardDonutMetricComponent } from './charts/dashboard-donut-metric.component';
import { DashboardLineChartComponent } from './charts/dashboard-line-chart.component';
import {
  DashboardOverview,
  DashboardPdiAnalytics,
  DashboardService,
  DashboardTimeGrouping,
} from './dashboard.service';

const emptyAnalytics: DashboardPdiAnalytics = {
  sampleSufficient: false,
  minimumAggregateSize: 3,
  methodology: {
    competencySource: 'Avaliações 360 de ciclos encerrados ou processados',
    competencyScale: 'Média de 1 a 5',
    comparisonRule: 'Dois últimos períodos com ao menos 3 pessoas por competência',
    dimensionMapping: 'Correspondência entre dimensão e competência',
    historyAccuracy: 'Histórico exato a partir de 19/08/2026',
  },
  summary: {
    peopleCount: 0,
    peopleWithPdi: 0,
    peopleWithoutPdi: 0,
    coveragePercentage: 0,
    activePlans: 0,
    executionPercentage: 0,
    completionPercentage: 0,
    onTimePercentage: 0,
    blockedPlans: 0,
    overduePlans: 0,
    stalePlans: 0,
    comparisonDelta: 0,
  },
  statusDistribution: [],
  evolution: [],
  competencyEvolution: [],
  comparison: { coverageDelta: 0, executionDelta: 0, completionDelta: 0, onTimeDelta: 0, blockedDelta: 0, overdueDelta: 0, staleDelta: 0 },
  competencyActionCoverage: [],
  competencyAlerts: [],
  competencyPriorities: [],
  developmentRiskMatrix: [],
  priorityActions: [],
  priorityActionSummary: { notStarted: 0, inProgress: 0, blocked: 0, done: 0, overdue: 0, dueSoon: 0, onTrack: 0 },
  responsibleActionSummary: [],
};

@Component({
  selector: 'app-dashboard-pdi-page',
  imports: [RouterLink, DashboardBarChartComponent, DashboardDonutMetricComponent, DashboardLineChartComponent],
  template: `
    <section class="pdi-dashboard" aria-labelledby="pdi-dashboard-title">
      <header class="pdi-dashboard__hero">
        <div class="pdi-dashboard__brand">
          <span class="pdi-dashboard__brand-mark">PDI</span>
          <div>
            <p>Desenvolvimento profissional</p>
            <h1 id="pdi-dashboard-title">Evolução da equipe</h1>
            <span>Acompanhe cobertura, execução e competências dentro do seu escopo autorizado.</span>
          </div>
        </div>
        <div class="pdi-dashboard__hero-actions">
          <div class="pdi-dashboard__stamp"><span>Escopo</span><strong>{{ overview()?.scopeLabel || 'Carregando' }}</strong></div>
          <button type="button" (click)="loadOverview()" [disabled]="isLoading()">{{ isLoading() ? 'Atualizando...' : 'Atualizar' }}</button>
        </div>
      </header>

      <nav class="pdi-dashboard__nav" aria-label="Navegação do dashboard">
        <strong>Navegação</strong>
        <a [routerLink]="['/app/dashboard']" fragment="avaliacoes">Avaliações</a>
        <a class="active" [routerLink]="['/app/dashboard/pdi']" aria-current="page">PDI</a>
        <a [routerLink]="['/app/dashboard']" fragment="compliance">Compliance</a>
        <a [routerLink]="['/app/dashboard']" fragment="applause">Aplause</a>
        <a [routerLink]="['/app/dashboard']" fragment="governanca">Governança</a>
      </nav>

      @if (overview(); as currentOverview) {
        <section class="pdi-dashboard__filters" aria-label="Filtros do dashboard de PDI">
          @if (canFilterByArea()) {
            <label>Área<select [value]="areaFilter()" (change)="changeArea($any($event.target).value)"><option value="all">Todas as áreas</option>@for (area of currentOverview.areaOptions; track area) { <option [value]="area">{{ area }}</option> }</select></label>
            <label>Equipe<select [value]="teamFilter()" (change)="changeTeam($any($event.target).value)"><option value="all">Todas as equipes</option>@for (team of currentOverview.teamOptions; track team.managerPersonId) { <option [value]="team.managerPersonId">{{ team.label }} ({{ team.peopleCount }})</option> }</select></label>
          }
          <label>Consolidar por<select [value]="timeGrouping()" (change)="changeTimeGrouping($any($event.target).value)">@for (option of timeGroupingOptions; track option.value) { <option [value]="option.value" [selected]="option.value === timeGrouping()">{{ option.label }}</option> }</select></label>
          <div class="pdi-dashboard__governance"><span>Governança aplicada</span><strong>{{ governanceLabel(currentOverview) }}</strong></div>
        </section>

        @if (errorMessage()) { <div class="pdi-dashboard__error" role="alert"><p>{{ errorMessage() }}</p><button class="secondary" type="button" (click)="loadOverview()">Tentar novamente</button></div> }

        <section class="pdi-dashboard__kpis" aria-label="Indicadores de PDI">
          <article><span>Cobertura de PDI</span><strong>{{ analytics().summary.coveragePercentage }}%</strong><small>{{ percentageComparisonLabel(analytics().comparison.coverageDelta) }} · {{ analytics().summary.peopleWithPdi }} de {{ analytics().summary.peopleCount }} pessoas</small></article>
          <article><span>Execução</span><strong>{{ analytics().summary.executionPercentage }}%</strong><small>{{ percentageComparisonLabel(analytics().comparison.executionDelta) }} · em andamento ou concluídos</small></article>
          <article><span>Conclusão</span><strong>{{ analytics().summary.completionPercentage }}%</strong><small>{{ percentageComparisonLabel(analytics().comparison.completionDelta) }}</small></article>
          <article><span>Dentro do prazo</span><strong>{{ analytics().summary.onTimePercentage }}%</strong><small>{{ percentageComparisonLabel(analytics().comparison.onTimeDelta) }} · entre concluídos</small></article>
        </section>

        @if (!analytics().sampleSufficient) {
          <div class="pdi-dashboard__privacy" role="status"><strong>Leitura agregada protegida</strong><span>O recorte possui menos de {{ analytics().minimumAggregateSize }} pessoas. Indicadores de competência foram ocultados.</span></div>
        }

        <section class="pdi-dashboard__grid">
          <article class="pdi-dashboard__panel pdi-dashboard__panel--wide">
            <header><div><span>Evolução histórica</span><h2>Conclusão dos PDIs por período</h2></div><small>{{ timeGroupingLabel() }}</small></header>
            <app-dashboard-line-chart class="pdi-dashboard__trend-chart" [items]="evolutionItems()" ariaLabel="Percentual de PDIs concluídos por período" [valueMax]="100" />
            <div class="pdi-dashboard__timeline-legend"><span><i class="done"></i>Concluídos</span><span><i class="progress"></i>Em andamento</span><span><i class="blocked"></i>Bloqueados</span><span><i class="overdue"></i>Vencidos</span></div>
            <div class="pdi-dashboard__history-table">@for (period of analytics().evolution; track period.periodKey) { <article><strong>{{ period.label }}</strong><span>Cobertura {{ period.coveragePercentage }}%</span><span>Execução {{ period.executionPercentage }}%</span><span>Conclusão {{ period.completionPercentage }}%</span><span>No prazo {{ period.onTimePercentage }}%</span><small>{{ period.blocked }} bloqueados · {{ period.overdue }} vencidos · {{ period.stale }} sem atualização</small></article> }</div>
            <p class="pdi-dashboard__history-note">{{ analytics().methodology.historyAccuracy }}</p>
          </article>

          <article class="pdi-dashboard__panel pdi-dashboard__panel--wide">
            <header><div><span>Concentração de execução</span><h2>Ações por responsável</h2></div><small>riscos e carga no recorte autorizado</small></header>
            @if (analytics().responsibleActionSummary.length) { <div class="pdi-dashboard__action-coverage">@for (owner of analytics().responsibleActionSummary; track owner.personId) { <button class="secondary" type="button" [style.border-color]="responsibleFilter() === owner.personId ? 'var(--abc-primary)' : null" [attr.aria-pressed]="responsibleFilter() === owner.personId" (click)="toggleResponsibleFilter(owner.personId)"><strong>{{ owner.personName }}</strong><span>{{ owner.total }} ação(ões) vinculada(s)</span><p>{{ owner.overdue }} vencida(s) · {{ owner.dueSoon }} próxima(s) do prazo</p><small>{{ owner.blocked }} bloqueada(s) · {{ owner.inProgress }} em andamento</small></button> }</div> } @else { <p class="pdi-dashboard__empty">Nenhum responsável possui ações vinculadas às prioridades neste recorte.</p> }
          </article>

          <article class="pdi-dashboard__panel pdi-dashboard__panel--wide">
            <header><div><span>Execução das prioridades</span><h2>Ações vinculadas às prioridades</h2></div><small>responsável · prazo · andamento</small></header>
            <div class="pdi-dashboard__attention"><div><span>Vencidas</span><strong>{{ analytics().priorityActionSummary.overdue }}</strong></div><div><span>Vencem em até 30 dias</span><strong>{{ analytics().priorityActionSummary.dueSoon }}</strong></div><div><span>Dentro do prazo</span><strong>{{ analytics().priorityActionSummary.onTrack }}</strong></div><div><span>Em andamento</span><strong>{{ analytics().priorityActionSummary.inProgress }}</strong></div><div><span>Bloqueadas</span><strong>{{ analytics().priorityActionSummary.blocked }}</strong></div><div><span>Concluídas</span><strong>{{ analytics().priorityActionSummary.done }}</strong></div></div>
            @if (analytics().priorityActions.length) { <div class="pdi-dashboard__action-filters"><label>Status<select #actionStatus [value]="actionStatusFilter()" (change)="changeActionStatusFilter(actionStatus.value)" aria-label="Filtrar ações por status"><option value="all">Todos os status</option><option value="not_started">Não iniciadas</option><option value="in_progress">Em andamento</option><option value="blocked">Bloqueadas</option><option value="done">Concluídas</option></select></label><label>Prazo<select #deadline [value]="actionDeadlineFilter()" (change)="changeActionDeadlineFilter(deadline.value)" aria-label="Filtrar ações por prazo"><option value="all">Todos os prazos</option><option value="overdue">Vencidas</option><option value="due_soon">Vencem em até 30 dias</option><option value="on_track">Dentro do prazo</option></select></label><span>{{ filteredPriorityActions().length }} ação(ões) encontrada(s)</span></div> }
            @if (filteredPriorityActions().length) { <div class="pdi-dashboard__action-coverage">@for (action of filteredPriorityActions(); track action.planId) { <article><strong>{{ action.focusTitle }}</strong><span>{{ action.personName }} · {{ action.competencyName }}</span><p>{{ action.actionText }}</p><small>{{ progressLabel(action.progressStatus) }} · prazo {{ dueDateLabel(action.dueDate) }} · {{ deadlineLabel(action.deadlineStatus) }}</small>@if (editingActionId() === action.planId) { <div class="pdi-dashboard__progress-editor"><select #progressStatus [value]="action.progressStatus" aria-label="Status da ação"><option value="not_started">Não iniciada</option><option value="in_progress">Em andamento</option><option value="blocked">Bloqueada</option><option value="done">Concluída</option></select><input #progressNote aria-label="Nota gerencial" placeholder="Nota gerencial" />@if (actionProgressError()) { <small role="alert">{{ actionProgressError() }}</small> }<button type="button" (click)="saveActionProgress(action.planId, progressStatus.value, progressNote.value)" [disabled]="savingAction()">{{ savingAction() ? 'Salvando...' : 'Salvar andamento' }}</button><button class="secondary" type="button" (click)="closeActionProgress()" [disabled]="savingAction()">Cancelar</button></div> } @else { <button type="button" (click)="openActionProgress(action.planId)">Atualizar andamento</button> }</article> }</div> } @else { <p class="pdi-dashboard__empty">Nenhuma ação corresponde aos filtros selecionados.</p> }
          </article>

          <article class="pdi-dashboard__panel">
            <header><div><span>Cobertura</span><h2>Pessoas com PDI ativo</h2></div></header>
            <app-dashboard-donut-metric [metric]="coverageMetric()" />
            <p class="pdi-dashboard__note">{{ analytics().summary.peopleWithoutPdi }} pessoas ainda sem PDI no recorte.</p>
          </article>

          <article class="pdi-dashboard__panel">
            <header><div><span>Saúde dos planos</span><h2>Distribuição por status</h2></div><small>{{ analytics().summary.activePlans }} ativos</small></header>
            <div class="pdi-dashboard__status-bar" role="img" aria-label="Distribuição dos PDIs por status">@for (item of analytics().statusDistribution; track item.status) { @if (item.percentage) { <span [class]="'status-' + item.status" [style.width.%]="item.percentage" [title]="item.label + ': ' + item.total"></span> } }</div>
            <div class="pdi-dashboard__status-list">@for (item of analytics().statusDistribution; track item.status) { <div><span>{{ item.label }}</span><strong>{{ item.total }} <small>{{ item.percentage }}%</small></strong></div> }</div>
          </article>

          <article class="pdi-dashboard__panel pdi-dashboard__panel--wide">
            <header><div><span>Competências</span><h2>Evolução comprovada nas avaliações</h2></div><small>escala de 1 a 5 · mínimo de {{ analytics().minimumAggregateSize }} pessoas</small></header>
            @if (competencyItems().length) {
              <app-dashboard-bar-chart [items]="competencyItems()" ariaLabel="Nota atual por competência em avaliações homologadas" [valueMax]="5" />
              <div class="pdi-dashboard__competencies">@for (item of analytics().competencyEvolution; track item.competencyId) { <div><strong>{{ item.competencyName }}</strong><span>{{ item.previousPeriodLabel }}: {{ item.previousScore }} → {{ item.currentPeriodLabel }}: {{ item.currentScore }}</span><small [class.negative]="item.delta < 0">{{ scoreDeltaLabel(item.delta) }} · {{ item.peopleCount }} pessoas · {{ item.responseCount }} avaliações</small></div> }</div>
            } @else { <p class="pdi-dashboard__empty">Sem dois períodos comparáveis ou amostra suficiente por competência.</p> }
            <div class="pdi-dashboard__methodology"><strong>Como calculamos</strong><span>{{ analytics().methodology.competencySource }}. {{ analytics().methodology.comparisonRule }}. {{ analytics().methodology.dimensionMapping }}.</span></div>
          </article>

          <article class="pdi-dashboard__panel pdi-dashboard__panel--wide">
            <header><div><span>Competências e ações</span><h2>Cobertura do desenvolvimento</h2></div><small>avaliação → PDI → aprendizagem</small></header>
            @if (analytics().competencyActionCoverage.length) { <div class="pdi-dashboard__action-coverage">@for (item of analytics().competencyActionCoverage; track item.competencyId) { <article [class.attention]="item.evaluatedPeopleCount >= 3 && !item.hasDevelopmentAction"><div><strong>{{ item.competencyName }}</strong><span>{{ item.latestScore === null ? 'Sem avaliação comparável' : 'Última média ' + item.latestScore }}</span></div><dl><div><dt>PDIs</dt><dd>{{ item.activePlanCount }}</dd></div><div><dt>Registros</dt><dd>{{ item.developmentRecordCount }}</dd></div><div><dt>Em revisão</dt><dd>{{ item.pendingLearningEventCount }}</dd></div></dl></article> }</div> } @else { <p class="pdi-dashboard__empty">Nenhuma competência possui vínculo estruturado com PDI ou aprendizagem neste recorte.</p> }
            @if (analytics().competencyAlerts.length) { <div class="pdi-dashboard__competency-alerts">@for (alert of analytics().competencyAlerts; track alert.key) { <p><strong>{{ alert.label }}</strong><span>{{ alert.detail }}</span></p> }</div> }
          </article>

          <article class="pdi-dashboard__panel pdi-dashboard__panel--wide">
            <header><div><span>Priorização gerencial</span><h2>Gaps e risco de desenvolvimento</h2></div><small>nota · ausência de ação · aprendizagem pendente</small></header>
            @if (analytics().competencyPriorities.length) {
              <div class="pdi-dashboard__action-coverage">@for (risk of analytics().developmentRiskMatrix; track risk.level) { <article [class]="'risk-' + risk.level"><span>{{ riskLabel(risk.level) }}</span><strong>{{ risk.total }}</strong><small>{{ risk.competencies.join(', ') || 'Nenhuma competência' }}</small></article> }</div>
              <div class="pdi-dashboard__action-coverage">@for (item of analytics().competencyPriorities; track item.competencyId; let position = $index) { <article><strong>{{ position + 1 }}. {{ item.competencyName }}</strong><span>Prioridade {{ item.priorityScore }}/100 · nota {{ item.latestScore }} · gap {{ item.gap }}</span><p>{{ item.recommendation }}</p><a [routerLink]="['/app/development']" [queryParams]="priorityActionParams(item)">Criar ação no PDI</a></article> }</div>
              <div class="pdi-dashboard__methodology"><strong>Critério de prioridade</strong><span>Gap até a nota 5, ausência de ação estruturada e aprendizagem pendente. Apenas competências com amostra mínima de {{ analytics().minimumAggregateSize }} pessoas são consideradas.</span></div>
            } @else { <p class="pdi-dashboard__empty">Sem amostra agregada suficiente para priorizar competências neste recorte.</p> }
          </article>

          <article class="pdi-dashboard__panel">
            <header><div><span>Aprendizagem</span><h2>Ações por tipo</h2></div></header>
            <app-dashboard-bar-chart [items]="developmentItems()" ariaLabel="Registros de desenvolvimento por tipo" />
          </article>

          <article class="pdi-dashboard__panel">
            <header><div><span>Atenção gerencial</span><h2>Pontos para acompanhamento</h2></div></header>
            <div class="pdi-dashboard__attention">
              <div><span>Bloqueados</span><strong>{{ analytics().summary.blockedPlans }}</strong></div>
              <div><span>Vencidos</span><strong>{{ analytics().summary.overduePlans }}</strong></div>
              <div><span>Sem atualização há 60 dias</span><strong>{{ analytics().summary.stalePlans }}</strong></div>
              <div><span>Pessoas sem PDI</span><strong>{{ analytics().summary.peopleWithoutPdi }}</strong></div>
              <div><span>Competências sem ação</span><strong>{{ analytics().competencyAlerts.length }}</strong></div>
              <div><span>Aprendizagens em revisão</span><strong>{{ pendingLearningEvents() }}</strong></div>
            </div>
          </article>
        </section>
      } @else if (isLoading()) { <p class="pdi-dashboard__state">Carregando indicadores de desenvolvimento...</p> }
    </section>
  `,
  styles: `
    .pdi-dashboard__history-table,.pdi-dashboard__action-coverage{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:14px}.pdi-dashboard__history-table article,.pdi-dashboard__action-coverage>article,.pdi-dashboard__competency-alerts p{display:grid;gap:5px;padding:10px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:7px}.pdi-dashboard__history-table span,.pdi-dashboard__history-table small,.pdi-dashboard__history-note,.pdi-dashboard__action-coverage span,.pdi-dashboard__competency-alerts span{color:var(--abc-text-muted);font-size:12px}.pdi-dashboard__action-coverage dl{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0}.pdi-dashboard__action-coverage dt{color:var(--abc-text-muted);font-size:11px}.pdi-dashboard__action-coverage dd{margin:0;font-size:20px;font-weight:800}.pdi-dashboard__competency-alerts p{margin:10px 0}
    .pdi-dashboard{display:grid;gap:14px;max-width:1280px}.pdi-dashboard__hero,.pdi-dashboard__nav,.pdi-dashboard__filters,.pdi-dashboard__panel,.pdi-dashboard__kpis article,.pdi-dashboard__privacy{color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:8px;box-shadow:0 10px 28px color-mix(in srgb,var(--abc-navy) 7%,transparent)}.pdi-dashboard__hero{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px;background:var(--abc-navy);color:var(--abc-on-blue)}.pdi-dashboard__brand{display:flex;align-items:center;gap:16px;min-width:0}.pdi-dashboard__brand-mark{display:grid;width:58px;height:58px;flex:0 0 auto;place-items:center;color:var(--abc-blue);font-size:20px;font-weight:900;border-right:1px solid rgb(255 255 255/22%)}.pdi-dashboard__brand p,.pdi-dashboard__brand span,.pdi-dashboard__stamp span{margin:0;color:rgb(248 250 252/72%)}h1{margin:0;font-size:30px;line-height:1.1}h2{margin:3px 0 0;font-size:17px}.pdi-dashboard__hero-actions{display:flex;align-items:center;gap:12px}.pdi-dashboard__stamp{min-width:170px;padding:10px 12px;background:rgb(255 255 255/10%);border:1px solid rgb(255 255 255/12%);border-radius:8px}.pdi-dashboard__stamp span,.pdi-dashboard__stamp strong{display:block}.pdi-dashboard__stamp strong{margin-top:2px;font-size:14px}button{min-height:38px;padding:0 14px;color:var(--abc-on-blue);font-weight:800;background:var(--abc-blue);border:0;border-radius:6px}button:disabled{cursor:wait;opacity:.65}.secondary{color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border)}.pdi-dashboard__nav{display:grid;grid-template-columns:auto repeat(5,minmax(0,1fr));gap:8px;align-items:center;padding:10px 12px}.pdi-dashboard__nav strong{font-size:13px;text-transform:uppercase}.pdi-dashboard__nav a{min-height:36px;padding:9px 12px;color:inherit;text-align:center;text-decoration:none;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:6px;font-weight:800}.pdi-dashboard__nav a.active{color:var(--abc-on-blue);background:var(--abc-blue);border-color:var(--abc-blue);box-shadow:0 8px 18px color-mix(in srgb,var(--abc-blue) 22%,transparent)}.pdi-dashboard__filters{display:flex;flex-wrap:wrap;gap:12px;align-items:end;padding:14px}label{display:grid;gap:6px;min-width:210px;color:var(--abc-text-muted);font-size:12px;font-weight:800;text-transform:uppercase}select{min-height:40px;padding:8px 10px;color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:6px}.pdi-dashboard__governance{display:grid;gap:4px;min-width:260px;padding:8px 10px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:6px}.pdi-dashboard__governance span,.pdi-dashboard__panel header span,.pdi-dashboard__kpis span{color:var(--abc-text-muted);font-size:12px;font-weight:800;text-transform:uppercase}.pdi-dashboard__governance strong{font-size:14px}.pdi-dashboard__kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.pdi-dashboard__kpis article{display:grid;gap:5px;padding:16px}.pdi-dashboard__kpis strong{font-size:29px}.pdi-dashboard__kpis small,.pdi-dashboard__panel header small,.pdi-dashboard__note,.pdi-dashboard__empty{color:var(--abc-text-muted)}.pdi-dashboard__privacy{display:flex;gap:12px;align-items:center;padding:12px 14px;border-color:color-mix(in srgb,var(--abc-warning) 55%,var(--abc-border));background:color-mix(in srgb,var(--abc-warning) 8%,var(--abc-surface))}.pdi-dashboard__privacy span{color:var(--abc-text-muted)}.pdi-dashboard__grid{display:grid;grid-template-columns:1.4fr 1fr;gap:14px}.pdi-dashboard__panel{min-width:0;padding:16px}.pdi-dashboard__panel--wide{grid-column:1/-1}.pdi-dashboard__panel header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}.pdi-dashboard__trend-chart{display:block;max-width:720px;margin:0 auto}.pdi-dashboard__timeline-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;color:var(--abc-text-muted);font-size:12px}.pdi-dashboard__timeline-legend span{display:flex;align-items:center;gap:5px}.pdi-dashboard__timeline-legend i{width:9px;height:9px;border-radius:50%}.done,.status-done{background:#22c55e}.progress,.status-in_progress{background:var(--abc-blue)}.blocked,.status-blocked{background:#ef4444}.overdue,.status-overdue{background:#f59e0b}.status-not_started{background:#94a3b8}.pdi-dashboard__note{text-align:center}.pdi-dashboard__status-bar{display:flex;width:100%;height:16px;overflow:hidden;background:var(--abc-border);border-radius:999px}.pdi-dashboard__status-list{display:grid;gap:8px;margin-top:16px}.pdi-dashboard__status-list div{display:flex;justify-content:space-between;gap:10px;padding-bottom:7px;border-bottom:1px solid var(--abc-border)}.pdi-dashboard__status-list span,.pdi-dashboard__status-list small{color:var(--abc-text-muted)}.pdi-dashboard__competencies{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}.pdi-dashboard__competencies div{display:grid;gap:3px;padding:12px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:7px}.pdi-dashboard__competencies span,.pdi-dashboard__competencies small{color:var(--abc-text-muted)}.pdi-dashboard__competencies small{color:#16a34a}.pdi-dashboard__competencies small.negative{color:#dc2626}.pdi-dashboard__methodology{display:grid;gap:4px;margin-top:14px;padding:12px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:7px}.pdi-dashboard__methodology span{color:var(--abc-text-muted);font-size:12px}.pdi-dashboard__attention{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pdi-dashboard__attention div{display:grid;gap:3px;padding:12px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:7px}.pdi-dashboard__attention span{color:var(--abc-text-muted);font-size:12px}.pdi-dashboard__attention strong{font-size:24px}.pdi-dashboard__error{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;color:color-mix(in srgb,var(--abc-danger) 28%,var(--abc-surface));background:color-mix(in srgb,var(--abc-danger) 30%,var(--abc-navy));border:1px solid color-mix(in srgb,var(--abc-danger) 55%,var(--abc-navy));border-radius:8px}.pdi-dashboard__error p{margin:0}.pdi-dashboard__state{padding:20px;color:var(--abc-text-muted);background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:8px}@media(max-width:900px){.pdi-dashboard__kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pdi-dashboard__grid{grid-template-columns:1fr}.pdi-dashboard__panel--wide{grid-column:auto}.pdi-dashboard__competencies{grid-template-columns:1fr 1fr}.pdi-dashboard__nav{grid-template-columns:1fr 1fr}.pdi-dashboard__nav strong{grid-column:1/-1}.pdi-dashboard__hero{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.pdi-dashboard__kpis,.pdi-dashboard__competencies,.pdi-dashboard__attention{grid-template-columns:1fr}.pdi-dashboard__hero-actions{align-items:stretch;flex-direction:column;width:100%}.pdi-dashboard__stamp{min-width:0}}
  `,
})
export class DashboardPdiPageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private requestId = 0;

  readonly overview = signal<DashboardOverview | null>(null);
  readonly errorMessage = signal('');
  readonly isLoading = signal(true);
  readonly editingActionId = signal<string | null>(null);
  readonly savingAction = signal(false);
  readonly actionProgressError = signal('');
  readonly actionStatusFilter = signal<'all' | 'not_started' | 'in_progress' | 'blocked' | 'done'>('all');
  readonly actionDeadlineFilter = signal<'all' | 'overdue' | 'due_soon' | 'on_track'>('all');
  readonly responsibleFilter = signal<string | null>(null);
  readonly areaFilter = signal('all');
  readonly teamFilter = signal('all');
  readonly timeGrouping = signal<DashboardTimeGrouping>('semester');
  readonly analytics = computed(() => this.overview()?.pdiAnalytics ?? emptyAnalytics);
  readonly canFilterByArea = computed(() => ['admin', 'hr'].includes(this.auth.user()?.roleKey || ''));
  readonly timeGroupingOptions = [
    { value: 'cycle' as const, label: 'Ciclo' },
    { value: 'semester' as const, label: 'Semestre' },
    { value: 'quarter' as const, label: 'Trimestre' },
    { value: 'year' as const, label: 'Ano' },
  ];
  readonly evolutionItems = computed<DashboardChartDatum[]>(() => this.analytics().evolution.map((item) => ({ label: item.label, value: item.completionPercentage, valueLabel: `${item.completionPercentage}%` })));
  readonly competencyItems = computed<DashboardChartDatum[]>(() => this.analytics().competencyEvolution.map((item) => ({ label: item.competencyName, value: item.currentScore, valueLabel: item.currentScore.toFixed(1) })));
  readonly developmentItems = computed<DashboardChartDatum[]>(() => (this.overview()?.developmentByType ?? []).map((item) => ({ label: item.type, value: item.total, valueLabel: String(item.total) })));
  readonly coverageMetric = computed(() => ({ key: 'pdi-coverage', label: 'Cobertura de PDI', percentage: this.analytics().summary.coveragePercentage, value: this.analytics().summary.peopleWithPdi, total: this.analytics().summary.peopleCount, detail: `${this.analytics().summary.peopleWithPdi} pessoas com plano ativo` }));
  readonly pendingLearningEvents = computed(() => this.analytics().competencyActionCoverage.reduce((total, item) => total + item.pendingLearningEventCount, 0));
  readonly filteredPriorityActions = computed(() => this.analytics().priorityActions.filter((action) => (!this.responsibleFilter() || action.personId === this.responsibleFilter()) && (this.actionStatusFilter() === 'all' || action.progressStatus === this.actionStatusFilter()) && (this.actionDeadlineFilter() === 'all' || action.deadlineStatus === this.actionDeadlineFilter())));

  ngOnInit(): void { void this.loadOverview(); }
  changeArea(area: string): void { if (this.canFilterByArea()) { this.responsibleFilter.set(null); this.areaFilter.set(area); this.teamFilter.set('all'); void this.loadOverview(); } }
  changeTeam(teamManagerId: string): void { if (this.canFilterByArea()) { this.responsibleFilter.set(null); this.teamFilter.set(teamManagerId); void this.loadOverview(); } }
  changeTimeGrouping(value: DashboardTimeGrouping): void { this.responsibleFilter.set(null); this.timeGrouping.set(value); void this.loadOverview(); }
  comparisonLabel(): string { const delta = this.analytics().summary.comparisonDelta; return delta ? `${delta > 0 ? '+' : ''}${delta} p.p. ante o período anterior` : 'Sem variação comparável'; }
  percentageComparisonLabel(delta: number): string { return delta ? `${delta > 0 ? '+' : ''}${delta} p.p. ante o período anterior` : 'Sem variação comparável'; }
  deltaLabel(delta: number): string { return `${delta > 0 ? '+' : ''}${delta} p.p.`; }
  scoreDeltaLabel(delta: number): string { return `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ponto${Math.abs(delta) === 1 ? '' : 's'}`; }
  riskLabel(level: 'high' | 'medium' | 'low'): string { return ({ high: 'Risco alto', medium: 'Risco moderado', low: 'Risco controlado' })[level]; }
  progressLabel(status: 'not_started' | 'in_progress' | 'blocked' | 'done'): string { return ({ not_started: 'Não iniciada', in_progress: 'Em andamento', blocked: 'Bloqueada', done: 'Concluída' })[status]; }
  deadlineLabel(status: 'overdue' | 'due_soon' | 'on_track' | 'completed'): string { return ({ overdue: 'vencida', due_soon: 'vence em até 30 dias', on_track: 'dentro do prazo', completed: 'concluída' })[status]; }
  dueDateLabel(value: string): string { const [year, month, day] = String(value).slice(0, 10).split('-'); return year && month && day ? `${day}/${month}/${year}` : value; }
  priorityActionParams(item: DashboardPdiAnalytics['competencyPriorities'][number]): Record<string, string> { return { source: 'pdi-priority', competencyId: item.competencyId, focusTitle: `Desenvolver ${item.competencyName}`, actionText: item.recommendation, expectedEvidence: `Evidência de evolução em ${item.competencyName}` }; }
  timeGroupingLabel(): string { return this.timeGroupingOptions.find((option) => option.value === this.timeGrouping())?.label || 'Período'; }
  governanceLabel(overview: DashboardOverview): string { if (overview.mode === 'team') return 'Somente equipe direta'; if (overview.mode === 'personal') return 'Somente visão individual'; return 'Consolidado autorizado para RH e administração'; }
  openActionProgress(planId: string): void { this.actionProgressError.set(''); this.editingActionId.set(planId); }
  closeActionProgress(): void { this.actionProgressError.set(''); this.editingActionId.set(null); }
  changeActionStatusFilter(value: string): void { if (['all', 'not_started', 'in_progress', 'blocked', 'done'].includes(value)) { this.actionStatusFilter.set(value as 'all' | 'not_started' | 'in_progress' | 'blocked' | 'done'); this.closeActionProgress(); } }
  changeActionDeadlineFilter(value: string): void { if (['all', 'overdue', 'due_soon', 'on_track'].includes(value)) { this.actionDeadlineFilter.set(value as 'all' | 'overdue' | 'due_soon' | 'on_track'); this.closeActionProgress(); } }
  toggleResponsibleFilter(personId: string): void { this.responsibleFilter.update((current) => current === personId ? null : personId); this.closeActionProgress(); }
  async saveActionProgress(planId: string, status: string, note: string): Promise<void> {
    if (!['not_started', 'in_progress', 'blocked', 'done'].includes(status)) return;
    const progressNote = note.trim();
    if (['blocked', 'done'].includes(status) && !progressNote) {
      this.actionProgressError.set(status === 'blocked' ? 'Informe a justificativa do bloqueio.' : 'Informe a evidência ou nota de conclusão.');
      return;
    }
    if (status === 'done' && !window.confirm('Confirmar a conclusão desta ação de desenvolvimento?')) return;
    this.actionProgressError.set('');
    this.savingAction.set(true);
    this.errorMessage.set('');
    try {
      await firstValueFrom(this.dashboardService.updatePriorityActionProgress(planId, { progressStatus: status as 'not_started' | 'in_progress' | 'blocked' | 'done', progressNote }));
      this.editingActionId.set(null);
      await this.loadOverview();
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : 'Não foi possível atualizar o andamento da ação.');
    } finally {
      this.savingAction.set(false);
    }
  }

  async loadOverview(): Promise<void> {
    const requestId = ++this.requestId;
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const overview = await firstValueFrom(this.dashboardService.getOverview({ area: this.canFilterByArea() && this.areaFilter() !== 'all' ? this.areaFilter() : null, teamManagerId: this.canFilterByArea() && this.teamFilter() !== 'all' ? this.teamFilter() : null, timeGrouping: this.timeGrouping() }));
      if (requestId === this.requestId) {
        if (this.teamFilter() !== 'all' && !overview.teamOptions.some((team) => team.managerPersonId === this.teamFilter())) {
          this.teamFilter.set('all');
          void this.loadOverview();
          return;
        }
        this.overview.set(overview);
      }
    } catch (error) {
      if (requestId === this.requestId) this.errorMessage.set(error instanceof ApiError ? error.message : 'Não foi possível carregar os indicadores de PDI.');
    } finally {
      if (requestId === this.requestId) this.isLoading.set(false);
    }
  }
}
