import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { DashboardBarChartComponent, DashboardChartDatum } from './charts/dashboard-bar-chart.component';
import { DashboardComplianceAnalytics, DashboardService, DashboardTimeGrouping } from './dashboard.service';

const emptyCompliance: DashboardComplianceAnalytics = {
  mode: 'executive',
  notice: 'Leitura de compliance por area com controles elegiveis.',
  scopeLabel: 'Carregando',
  selectedArea: null,
  selectedTeamManagerId: null,
  areaOptions: [],
  teamOptions: [],
  targetPercentage: 95,
  summary: {
    eligiblePeople: 0,
    compliantPeople: 0,
    nonCompliantPeople: 0,
    compliancePercentage: 0,
    statusBand: { key: 'critical', label: 'Critico', tone: 'critical' },
    totalIssues: 0,
  },
  reasonCounts: [],
  agingBuckets: [],
  byCurrentArea: [],
  byOriginArea: [],
  trend: [],
  dataQuality: {
    evaluationGraceConfigured: false,
    substantiatedIncidentSubjects: 0,
    mandatoryPdiRecords: 0,
    note: 'Indicadores usam apenas controles elegiveis e dados estruturados disponiveis.',
  },
};

@Component({
  selector: 'app-dashboard-compliance-page',
  imports: [RouterLink, DashboardBarChartComponent],
  template: `
    <section class="compliance-dashboard" aria-labelledby="compliance-dashboard-title">
      <header class="compliance-dashboard__hero">
        <div class="compliance-dashboard__brand">
          <span class="compliance-dashboard__brand-mark">CP</span>
          <div>
            <p>Compliance institucional</p>
            <h1 id="compliance-dashboard-title">Painel de conformidade</h1>
            <span>{{ compliance().notice }}</span>
          </div>
        </div>
        <div class="compliance-dashboard__hero-actions">
          <div class="compliance-dashboard__stamp"><span>Escopo</span><strong>{{ compliance().scopeLabel }}</strong></div>
          <button type="button" (click)="loadCompliance()" [disabled]="isLoading()">{{ isLoading() ? 'Atualizando...' : 'Atualizar' }}</button>
        </div>
      </header>

      <nav class="compliance-dashboard__nav" aria-label="Navegacao do dashboard">
        <strong>Navegacao</strong>
        <a [routerLink]="['/app/dashboard']" fragment="avaliacoes">Avaliacoes</a>
        <a [routerLink]="['/app/dashboard/pdi']">PDI</a>
        <a class="active" [routerLink]="['/app/dashboard/compliance']" aria-current="page">Compliance</a>
        <a [routerLink]="['/app/dashboard/applause']">Aplause</a>
        <a [routerLink]="['/app/dashboard']" fragment="governanca">Governanca</a>
      </nav>

      <section class="compliance-dashboard__filters" aria-label="Filtros do dashboard de compliance">
        @if (canFilterByArea()) {
          <label>Area<select [value]="areaFilter()" (change)="changeArea($any($event.target).value)"><option value="all">Todas as areas</option>@for (area of compliance().areaOptions; track area) { <option [value]="area">{{ area }}</option> }</select></label>
          <label>Equipe<select [value]="teamFilter()" (change)="changeTeam($any($event.target).value)"><option value="all">Todas as equipes</option>@for (team of compliance().teamOptions; track team.managerPersonId) { <option [value]="team.managerPersonId">{{ team.label }} ({{ team.peopleCount }})</option> }</select></label>
        }
        <label>Consolidar por<select [value]="timeGrouping()" (change)="changeTimeGrouping($any($event.target).value)">@for (option of timeGroupingOptions; track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label>
        <div class="compliance-dashboard__governance"><span>Meta institucional</span><strong>{{ compliance().targetPercentage }}% em compliance</strong></div>
      </section>

      @if (errorMessage()) { <div class="compliance-dashboard__error" role="alert"><p>{{ errorMessage() }}</p><button class="secondary" type="button" (click)="loadCompliance()">Tentar novamente</button></div> }

      <section class="compliance-dashboard__kpis" aria-label="Indicadores de compliance">
        <article><span>Compliance geral</span><strong>{{ compliance().summary.compliancePercentage }}%</strong><small>{{ compliance().summary.statusBand.label }} · meta {{ compliance().targetPercentage }}%</small></article>
        <article><span>Em compliance</span><strong>{{ compliance().summary.compliantPeople }}</strong><small>{{ compliance().summary.eligiblePeople }} pessoa(s) elegivel(is)</small></article>
        <article><span>Fora de compliance</span><strong>{{ compliance().summary.nonCompliantPeople }}</strong><small>{{ compliance().summary.totalIssues }} issue(s) ativa(s)</small></article>
        <article><span>Controles ativos</span><strong>{{ activeControlCount() }}</strong><small>controles estruturados no recorte</small></article>
      </section>

      <section class="compliance-dashboard__grid">
        <article class="compliance-dashboard__panel compliance-dashboard__panel--wide">
          <header><div><span>Area atual</span><h2>Pessoas em compliance por area</h2></div><small>contagem unica por colaborador</small></header>
          <app-dashboard-bar-chart [items]="currentAreaItems()" ariaLabel="Percentual de pessoas em compliance por area atual" [valueMax]="100" />
          <div class="compliance-dashboard__area-list">@for (area of compliance().byCurrentArea; track area.area) { <article [class]="'band-' + area.band.key"><strong>{{ area.area }}</strong><span>{{ area.compliancePercentage }}% · {{ area.compliantPeople }}/{{ area.eligiblePeople }} em compliance</span><small>{{ area.nonCompliantPeople }} fora · {{ area.band.label }}</small></article> }</div>
        </article>

        <article class="compliance-dashboard__panel">
          <header><div><span>Motivos</span><h2>Issues por controle</h2></div></header>
          <app-dashboard-bar-chart [items]="reasonItems()" ariaLabel="Issues de compliance por controle" />
        </article>

        <article class="compliance-dashboard__panel">
          <header><div><span>Envelhecimento</span><h2>Tempo em aberto</h2></div></header>
          <app-dashboard-bar-chart [items]="agingItems()" ariaLabel="Issues de compliance por tempo em aberto" />
        </article>

        <article class="compliance-dashboard__panel compliance-dashboard__panel--wide">
          <header><div><span>Area de origem</span><h2>Onde as ocorrencias surgiram</h2></div><small>responsabilizacao sem duplicar pessoas</small></header>
          <div class="compliance-dashboard__origin-list">@for (area of compliance().byOriginArea; track area.area) { <article><strong>{{ area.area }}</strong><span>{{ area.totalIssues }} issue(s)</span><small>{{ area.conduct }} conduta · {{ area.evaluationResponse }} avaliacao · {{ area.mandatoryPdi }} PDI</small></article> } @empty { <p class="compliance-dashboard__empty">Nenhuma issue ativa no recorte.</p> }</div>
        </article>

        <article class="compliance-dashboard__panel compliance-dashboard__panel--wide">
          <header><div><span>Historico</span><h2>Issues abertas por periodo</h2></div><small>{{ timeGroupingLabel() }}</small></header>
          <app-dashboard-bar-chart [items]="trendItems()" ariaLabel="Issues de compliance abertas por periodo" />
        </article>
      </section>
    </section>
  `,
  styles: `
    .compliance-dashboard{display:grid;gap:14px;max-width:1280px}.compliance-dashboard__hero,.compliance-dashboard__nav,.compliance-dashboard__filters,.compliance-dashboard__panel,.compliance-dashboard__kpis article{color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:8px;box-shadow:0 10px 28px color-mix(in srgb,var(--abc-navy) 7%,transparent)}.compliance-dashboard__hero{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px;background:var(--abc-navy);color:var(--abc-on-blue)}.compliance-dashboard__brand{display:flex;align-items:center;gap:16px;min-width:0}.compliance-dashboard__brand-mark{display:grid;width:58px;height:58px;flex:0 0 auto;place-items:center;color:var(--abc-blue);font-size:20px;font-weight:900;border-right:1px solid rgb(255 255 255/22%)}.compliance-dashboard__brand p,.compliance-dashboard__brand span,.compliance-dashboard__stamp span{margin:0;color:rgb(248 250 252/72%)}h1{margin:0;font-size:30px;line-height:1.1}h2{margin:3px 0 0;font-size:17px}.compliance-dashboard__hero-actions{display:flex;align-items:center;gap:12px}.compliance-dashboard__stamp{min-width:170px;padding:10px 12px;background:rgb(255 255 255/10%);border:1px solid rgb(255 255 255/12%);border-radius:8px}.compliance-dashboard__stamp span,.compliance-dashboard__stamp strong{display:block}.compliance-dashboard__stamp strong{margin-top:2px;font-size:14px}button{min-height:38px;padding:0 14px;color:var(--abc-on-blue);font-weight:800;background:var(--abc-blue);border:0;border-radius:6px}.secondary{color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border)}.compliance-dashboard__nav{display:grid;grid-template-columns:auto repeat(5,minmax(0,1fr));gap:8px;align-items:center;padding:10px 12px}.compliance-dashboard__nav strong{font-size:13px;text-transform:uppercase}.compliance-dashboard__nav a{min-height:36px;padding:9px 12px;color:inherit;text-align:center;text-decoration:none;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:6px;font-weight:800}.compliance-dashboard__nav a.active{color:var(--abc-on-blue);background:var(--abc-blue);border-color:var(--abc-blue)}.compliance-dashboard__filters{display:flex;flex-wrap:wrap;gap:12px;align-items:end;padding:14px}label{display:grid;gap:6px;min-width:210px;color:var(--abc-text-muted);font-size:12px;font-weight:800;text-transform:uppercase}select{min-height:40px;padding:8px 10px;color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:6px}.compliance-dashboard__governance{display:grid;gap:4px;min-width:240px;padding:8px 10px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:6px}.compliance-dashboard__governance span,.compliance-dashboard__panel header span,.compliance-dashboard__kpis span{color:var(--abc-text-muted);font-size:12px;font-weight:800;text-transform:uppercase}.compliance-dashboard__kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.compliance-dashboard__kpis article{display:grid;gap:5px;padding:16px}.compliance-dashboard__kpis strong{font-size:29px}.compliance-dashboard__kpis small,.compliance-dashboard__panel header small,.compliance-dashboard__empty{color:var(--abc-text-muted)}.compliance-dashboard__grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.compliance-dashboard__panel{min-width:0;padding:16px}.compliance-dashboard__panel--wide{grid-column:1/-1}.compliance-dashboard__panel header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}.compliance-dashboard__area-list,.compliance-dashboard__origin-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:14px}.compliance-dashboard__area-list article,.compliance-dashboard__origin-list article{display:grid;gap:5px;padding:10px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-left:4px solid var(--abc-border);border-radius:7px}.compliance-dashboard__area-list span,.compliance-dashboard__area-list small,.compliance-dashboard__origin-list span,.compliance-dashboard__origin-list small{color:var(--abc-text-muted);font-size:12px}.band-critical{border-left-color:#dc2626!important}.band-low,.band-medium{border-left-color:#f59e0b!important}.band-good,.band-excellent{border-left-color:#16a34a!important}.compliance-dashboard__error{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;color:color-mix(in srgb,var(--abc-danger) 28%,var(--abc-surface));background:color-mix(in srgb,var(--abc-danger) 30%,var(--abc-navy));border:1px solid color-mix(in srgb,var(--abc-danger) 55%,var(--abc-navy));border-radius:8px}.compliance-dashboard__error p{margin:0}@media(max-width:900px){.compliance-dashboard__kpis,.compliance-dashboard__grid{grid-template-columns:1fr 1fr}.compliance-dashboard__panel--wide{grid-column:1/-1}.compliance-dashboard__nav{grid-template-columns:1fr 1fr}.compliance-dashboard__nav strong{grid-column:1/-1}.compliance-dashboard__hero{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.compliance-dashboard__kpis,.compliance-dashboard__grid{grid-template-columns:1fr}.compliance-dashboard__hero-actions{align-items:stretch;flex-direction:column;width:100%}.compliance-dashboard__stamp{min-width:0}}
  `,
})
export class DashboardCompliancePageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private requestId = 0;

  readonly compliance = signal<DashboardComplianceAnalytics>(emptyCompliance);
  readonly errorMessage = signal('');
  readonly isLoading = signal(true);
  readonly areaFilter = signal('all');
  readonly teamFilter = signal('all');
  readonly timeGrouping = signal<DashboardTimeGrouping>('semester');
  readonly canFilterByArea = computed(() => ['admin', 'hr'].includes(this.auth.user()?.roleKey || ''));
  readonly timeGroupingOptions = [
    { value: 'cycle' as const, label: 'Ciclo' },
    { value: 'semester' as const, label: 'Semestre' },
    { value: 'quarter' as const, label: 'Trimestre' },
    { value: 'year' as const, label: 'Ano' },
  ];
  readonly activeControlCount = computed(() => Number(this.compliance().dataQuality.evaluationGraceConfigured) + this.compliance().dataQuality.substantiatedIncidentSubjects + this.compliance().dataQuality.mandatoryPdiRecords);
  readonly currentAreaItems = computed<DashboardChartDatum[]>(() => this.compliance().byCurrentArea.map((item) => ({ label: item.area, value: item.compliancePercentage, valueLabel: `${item.compliancePercentage}%` })));
  readonly reasonItems = computed<DashboardChartDatum[]>(() => this.compliance().reasonCounts.map((item) => ({ label: item.label, value: item.total, valueLabel: String(item.total) })));
  readonly agingItems = computed<DashboardChartDatum[]>(() => this.compliance().agingBuckets.map((item) => ({ label: item.label, value: item.total, valueLabel: String(item.total) })));
  readonly trendItems = computed<DashboardChartDatum[]>(() => this.compliance().trend.map((item) => ({ label: item.label, value: item.totalIssues, valueLabel: String(item.totalIssues) })));

  ngOnInit(): void { void this.loadCompliance(); }
  changeArea(area: string): void { if (this.canFilterByArea()) { this.areaFilter.set(area); this.teamFilter.set('all'); void this.loadCompliance(); } }
  changeTeam(teamManagerId: string): void { if (this.canFilterByArea()) { this.teamFilter.set(teamManagerId); void this.loadCompliance(); } }
  changeTimeGrouping(value: DashboardTimeGrouping): void { this.timeGrouping.set(value); void this.loadCompliance(); }
  timeGroupingLabel(): string { return this.timeGroupingOptions.find((option) => option.value === this.timeGrouping())?.label || 'Periodo'; }

  async loadCompliance(): Promise<void> {
    const requestId = ++this.requestId;
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const compliance = await firstValueFrom(this.dashboardService.getCompliance({ area: this.canFilterByArea() && this.areaFilter() !== 'all' ? this.areaFilter() : null, teamManagerId: this.canFilterByArea() && this.teamFilter() !== 'all' ? this.teamFilter() : null, timeGrouping: this.timeGrouping() }));
      if (requestId === this.requestId) this.compliance.set(compliance);
    } catch (error) {
      if (requestId === this.requestId) this.errorMessage.set(error instanceof ApiError ? error.message : 'Nao foi possivel carregar os indicadores de compliance.');
    } finally {
      if (requestId === this.requestId) this.isLoading.set(false);
    }
  }
}
