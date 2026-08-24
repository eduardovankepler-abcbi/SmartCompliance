import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { DashboardBarChartComponent, DashboardChartDatum } from './charts/dashboard-bar-chart.component';
import { DashboardApplauseAnalytics, DashboardService, DashboardTimeGrouping } from './dashboard.service';

const emptyApplause: DashboardApplauseAnalytics = {
  mode: 'executive',
  notice: 'Leitura de reconhecimentos enviados e recebidos pelas equipes.',
  scopeLabel: 'Carregando',
  selectedArea: null,
  selectedTeamManagerId: null,
  areaOptions: [],
  teamOptions: [],
  filters: { timeGrouping: 'semester', category: null },
  summary: {
    approvedApplauses: 0,
    activeSenders: 0,
    activeReceivers: 0,
    senderParticipationPercentage: 0,
    receiverCoveragePercentage: 0,
    averageSentPerEligiblePerson: 0,
    suspiciousReciprocityPairs: 0,
  },
  sentByArea: [],
  receivedByArea: [],
  areaBalance: [],
  categoryCounts: [],
  trend: [],
  unusualReciprocity: [],
  alerts: {
    silentReceivingAreas: [],
    silentSendingAreas: [],
    concentratedRecognition: false,
    dominantCategory: null,
  },
  dataQuality: {
    approvedRecordsConsidered: 0,
    ignoredRecords: 0,
    eligiblePeople: 0,
    note: 'Indicadores consideram apenas Aplause validado.',
  },
};

@Component({
  selector: 'app-dashboard-applause-page',
  imports: [RouterLink, DashboardBarChartComponent],
  template: `
    <section class="applause-dashboard" aria-labelledby="applause-dashboard-title">
      <header class="applause-dashboard__hero">
        <div class="applause-dashboard__brand">
          <span class="applause-dashboard__brand-mark">AP</span>
          <div>
            <p>Cultura de reconhecimento</p>
            <h1 id="applause-dashboard-title">Painel de Aplause</h1>
            <span>{{ applause().notice }}</span>
          </div>
        </div>
        <div class="applause-dashboard__hero-actions">
          <div class="applause-dashboard__stamp"><span>Escopo</span><strong>{{ applause().scopeLabel }}</strong></div>
          <button type="button" (click)="loadApplause()" [disabled]="isLoading()">{{ isLoading() ? 'Atualizando...' : 'Atualizar' }}</button>
        </div>
      </header>

      <nav class="applause-dashboard__nav" aria-label="Navegacao do dashboard">
        <strong>Navegacao</strong>
        <a [routerLink]="['/app/dashboard']" fragment="avaliacoes">Avaliacoes</a>
        <a [routerLink]="['/app/dashboard/pdi']">PDI</a>
        <a [routerLink]="['/app/dashboard/compliance']">Compliance</a>
        <a class="active" [routerLink]="['/app/dashboard/applause']" aria-current="page">Aplause</a>
        <a [routerLink]="['/app/dashboard']" fragment="governanca">Governanca</a>
      </nav>

      <section class="applause-dashboard__filters" aria-label="Filtros do dashboard de Aplause">
        @if (canFilterByArea()) {
          <label>Area<select [value]="areaFilter()" (change)="changeArea($any($event.target).value)"><option value="all">Todas as areas</option>@for (area of applause().areaOptions; track area) { <option [value]="area">{{ area }}</option> }</select></label>
          <label>Equipe<select [value]="teamFilter()" (change)="changeTeam($any($event.target).value)"><option value="all">Todas as equipes</option>@for (team of applause().teamOptions; track team.managerPersonId) { <option [value]="team.managerPersonId">{{ team.label }} ({{ team.peopleCount }})</option> }</select></label>
        }
        <label>Consolidar por<select [value]="timeGrouping()" (change)="changeTimeGrouping($any($event.target).value)">@for (option of timeGroupingOptions; track option.value) { <option [value]="option.value">{{ option.label }}</option> }</select></label>
        <label>Categoria<select [value]="categoryFilter()" (change)="changeCategory($any($event.target).value)"><option value="all">Todas as categorias</option>@for (category of categoryOptions(); track category) { <option [value]="category">{{ category }}</option> }</select></label>
      </section>

      @if (errorMessage()) { <div class="applause-dashboard__error" role="alert"><p>{{ errorMessage() }}</p><button class="secondary" type="button" (click)="loadApplause()">Tentar novamente</button></div> }

      <section class="applause-dashboard__kpis" aria-label="Indicadores de Aplause">
        <article><span>Aplause validado</span><strong>{{ applause().summary.approvedApplauses }}</strong><small>{{ applause().dataQuality.ignoredRecords }} registro(s) ignorado(s)</small></article>
        <article><span>Quem enviou</span><strong>{{ applause().summary.activeSenders }}</strong><small>{{ applause().summary.senderParticipationPercentage }}% de participacao</small></article>
        <article><span>Quem recebeu</span><strong>{{ applause().summary.activeReceivers }}</strong><small>{{ applause().summary.receiverCoveragePercentage }}% de cobertura</small></article>
        <article><span>Reciprocidade incomum</span><strong>{{ applause().summary.suspiciousReciprocityPairs }}</strong><small>sinal para revisao humana</small></article>
      </section>

      <section class="applause-dashboard__grid">
        <article class="applause-dashboard__panel">
          <header><div><span>Origem</span><h2>Enviados por equipe</h2></div></header>
          <app-dashboard-bar-chart [items]="sentItems()" ariaLabel="Aplause enviados por equipe" />
        </article>

        <article class="applause-dashboard__panel">
          <header><div><span>Destino</span><h2>Recebidos por equipe</h2></div></header>
          <app-dashboard-bar-chart [items]="receivedItems()" ariaLabel="Aplause recebidos por equipe" />
        </article>

        <article class="applause-dashboard__panel">
          <header><div><span>Comportamentos</span><h2>Categorias reconhecidas</h2></div></header>
          <app-dashboard-bar-chart [items]="categoryItems()" ariaLabel="Categorias de Aplause" />
        </article>

        <article class="applause-dashboard__panel">
          <header><div><span>Historico</span><h2>Volume por periodo</h2></div><small>{{ timeGroupingLabel() }}</small></header>
          <app-dashboard-bar-chart [items]="trendItems()" ariaLabel="Aplause por periodo" />
        </article>

        <article class="applause-dashboard__panel applause-dashboard__panel--wide">
          <header><div><span>Equilibrio</span><h2>Saldo enviados x recebidos</h2></div><small>recebidos menos enviados</small></header>
          <div class="applause-dashboard__balance">@for (area of applause().areaBalance; track area.area) { <article><strong>{{ area.area }}</strong><span>{{ area.received }} recebidos · {{ area.sent }} enviados</span><small>saldo {{ area.netBalance }} · cobertura {{ area.coveragePercentage }}%</small></article> } @empty { <p class="applause-dashboard__empty">Nenhum Aplause validado no recorte.</p> }</div>
        </article>

        <article class="applause-dashboard__panel applause-dashboard__panel--wide">
          <header><div><span>Padroes para revisao</span><h2>Reciprocidade incomum</h2></div><small>nao e conclusao automatica</small></header>
          @if (!applause().unusualReciprocity.length) { <p class="applause-dashboard__empty">Nenhum padrao incomum detectado no recorte.</p> }
          @else { <div class="applause-dashboard__reciprocity">@for (pair of applause().unusualReciprocity; track pair.personAId + pair.personBId) { <article><strong>{{ pair.personAName }} ⇄ {{ pair.personBName }}</strong><span>{{ pair.personAArea }} / {{ pair.personBArea }}</span><small>{{ pair.aToB }} ida · {{ pair.bToA }} volta · concentracao {{ pair.concentrationPercentage }}%</small></article> }</div> }
        </article>

        <article class="applause-dashboard__panel applause-dashboard__panel--wide">
          <header><div><span>Alertas executivos</span><h2>Sinais de distribuicao</h2></div></header>
          <div class="applause-dashboard__alerts">
            <article><strong>Sem recebidos</strong><span>{{ applause().alerts.silentReceivingAreas.length ? applause().alerts.silentReceivingAreas.join(', ') : 'Nenhuma area silenciosa' }}</span></article>
            <article><strong>Sem enviados</strong><span>{{ applause().alerts.silentSendingAreas.length ? applause().alerts.silentSendingAreas.join(', ') : 'Nenhuma area silenciosa' }}</span></article>
            <article><strong>Categoria dominante</strong><span>{{ applause().alerts.dominantCategory || 'Sem concentracao relevante' }}</span></article>
            <article><strong>Concentracao</strong><span>{{ applause().alerts.concentratedRecognition ? 'Reconhecimento concentrado em poucos destinatarios' : 'Sem concentracao relevante' }}</span></article>
          </div>
          <p class="applause-dashboard__note">{{ applause().dataQuality.note }}</p>
        </article>
      </section>
    </section>
  `,
  styles: `
    .applause-dashboard{display:grid;gap:14px;max-width:1280px}.applause-dashboard__hero,.applause-dashboard__nav,.applause-dashboard__filters,.applause-dashboard__panel,.applause-dashboard__kpis article{color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:8px;box-shadow:0 10px 28px color-mix(in srgb,var(--abc-navy) 7%,transparent)}.applause-dashboard__hero{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px;background:var(--abc-navy);color:var(--abc-on-blue)}.applause-dashboard__brand{display:flex;align-items:center;gap:16px;min-width:0}.applause-dashboard__brand-mark{display:grid;width:58px;height:58px;flex:0 0 auto;place-items:center;color:var(--abc-blue);font-size:20px;font-weight:900;border-right:1px solid rgb(255 255 255/22%)}.applause-dashboard__brand p,.applause-dashboard__brand span,.applause-dashboard__stamp span{margin:0;color:rgb(248 250 252/72%)}h1{margin:0;font-size:30px;line-height:1.1}h2{margin:3px 0 0;font-size:17px}.applause-dashboard__hero-actions{display:flex;align-items:center;gap:12px}.applause-dashboard__stamp{min-width:170px;padding:10px 12px;background:rgb(255 255 255/10%);border:1px solid rgb(255 255 255/12%);border-radius:8px}.applause-dashboard__stamp span,.applause-dashboard__stamp strong{display:block}.applause-dashboard__stamp strong{margin-top:2px;font-size:14px}button{min-height:38px;padding:0 14px;color:var(--abc-on-blue);font-weight:800;background:var(--abc-blue);border:0;border-radius:6px}.secondary{color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border)}.applause-dashboard__nav{display:grid;grid-template-columns:auto repeat(5,minmax(0,1fr));gap:8px;align-items:center;padding:10px 12px}.applause-dashboard__nav strong{font-size:13px;text-transform:uppercase}.applause-dashboard__nav a{min-height:36px;padding:9px 12px;color:inherit;text-align:center;text-decoration:none;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:6px;font-weight:800}.applause-dashboard__nav a.active{color:var(--abc-on-blue);background:var(--abc-blue);border-color:var(--abc-blue)}.applause-dashboard__filters{display:flex;flex-wrap:wrap;gap:12px;align-items:end;padding:14px}label{display:grid;gap:6px;min-width:210px;color:var(--abc-text-muted);font-size:12px;font-weight:800;text-transform:uppercase}select{min-height:40px;padding:8px 10px;color:var(--abc-text);background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:6px}.applause-dashboard__kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.applause-dashboard__kpis article{display:grid;gap:5px;padding:16px}.applause-dashboard__kpis span,.applause-dashboard__panel header span{color:var(--abc-text-muted);font-size:12px;font-weight:800;text-transform:uppercase}.applause-dashboard__kpis strong{font-size:29px}.applause-dashboard__kpis small,.applause-dashboard__panel header small,.applause-dashboard__empty,.applause-dashboard__note{color:var(--abc-text-muted)}.applause-dashboard__grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.applause-dashboard__panel{min-width:0;padding:16px}.applause-dashboard__panel--wide{grid-column:1/-1}.applause-dashboard__panel header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}.applause-dashboard__balance,.applause-dashboard__reciprocity,.applause-dashboard__alerts{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}.applause-dashboard__balance article,.applause-dashboard__reciprocity article,.applause-dashboard__alerts article{display:grid;gap:5px;padding:10px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-left:4px solid var(--abc-blue);border-radius:7px}.applause-dashboard__balance span,.applause-dashboard__balance small,.applause-dashboard__reciprocity span,.applause-dashboard__reciprocity small,.applause-dashboard__alerts span{color:var(--abc-text-muted);font-size:12px}.applause-dashboard__error{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;color:color-mix(in srgb,var(--abc-danger) 28%,var(--abc-surface));background:color-mix(in srgb,var(--abc-danger) 30%,var(--abc-navy));border:1px solid color-mix(in srgb,var(--abc-danger) 55%,var(--abc-navy));border-radius:8px}.applause-dashboard__error p{margin:0}.applause-dashboard__note{margin:14px 0 0;font-size:12px}@media(max-width:900px){.applause-dashboard__kpis,.applause-dashboard__grid{grid-template-columns:1fr 1fr}.applause-dashboard__panel--wide{grid-column:1/-1}.applause-dashboard__nav{grid-template-columns:1fr 1fr}.applause-dashboard__nav strong{grid-column:1/-1}.applause-dashboard__hero{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.applause-dashboard__kpis,.applause-dashboard__grid{grid-template-columns:1fr}.applause-dashboard__hero-actions{align-items:stretch;flex-direction:column;width:100%}.applause-dashboard__stamp{min-width:0}}
  `,
})
export class DashboardApplausePageComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private requestId = 0;

  readonly applause = signal<DashboardApplauseAnalytics>(emptyApplause);
  readonly errorMessage = signal('');
  readonly isLoading = signal(true);
  readonly areaFilter = signal('all');
  readonly teamFilter = signal('all');
  readonly timeGrouping = signal<DashboardTimeGrouping>('semester');
  readonly categoryFilter = signal('all');
  readonly canFilterByArea = computed(() => ['admin', 'hr'].includes(this.auth.user()?.roleKey || ''));
  readonly timeGroupingOptions = [
    { value: 'cycle' as const, label: 'Ciclo' },
    { value: 'semester' as const, label: 'Semestre' },
    { value: 'quarter' as const, label: 'Trimestre' },
    { value: 'year' as const, label: 'Ano' },
  ];
  readonly categoryOptions = computed(() => this.applause().categoryCounts.map((item) => item.category));
  readonly sentItems = computed<DashboardChartDatum[]>(() => this.applause().sentByArea.map((item) => ({ label: item.area, value: item.totalSent, valueLabel: String(item.totalSent) })));
  readonly receivedItems = computed<DashboardChartDatum[]>(() => this.applause().receivedByArea.map((item) => ({ label: item.area, value: item.totalReceived, valueLabel: String(item.totalReceived) })));
  readonly categoryItems = computed<DashboardChartDatum[]>(() => this.applause().categoryCounts.map((item) => ({ label: item.category, value: item.total, valueLabel: String(item.total) })));
  readonly trendItems = computed<DashboardChartDatum[]>(() => this.applause().trend.map((item) => ({ label: item.label, value: item.totalApplauses, valueLabel: String(item.totalApplauses) })));

  ngOnInit(): void { void this.loadApplause(); }
  changeArea(area: string): void { if (this.canFilterByArea()) { this.areaFilter.set(area); this.teamFilter.set('all'); void this.loadApplause(); } }
  changeTeam(teamManagerId: string): void { if (this.canFilterByArea()) { this.teamFilter.set(teamManagerId); void this.loadApplause(); } }
  changeTimeGrouping(value: DashboardTimeGrouping): void { this.timeGrouping.set(value); void this.loadApplause(); }
  changeCategory(category: string): void { this.categoryFilter.set(category); void this.loadApplause(); }
  timeGroupingLabel(): string { return this.timeGroupingOptions.find((option) => option.value === this.timeGrouping())?.label || 'Periodo'; }

  async loadApplause(): Promise<void> {
    const requestId = ++this.requestId;
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const applause = await firstValueFrom(this.dashboardService.getApplause({
        area: this.canFilterByArea() && this.areaFilter() !== 'all' ? this.areaFilter() : null,
        teamManagerId: this.canFilterByArea() && this.teamFilter() !== 'all' ? this.teamFilter() : null,
        timeGrouping: this.timeGrouping(),
        category: this.categoryFilter() !== 'all' ? this.categoryFilter() : null,
      }));
      if (requestId === this.requestId) this.applause.set(applause);
    } catch (error) {
      if (requestId === this.requestId) this.errorMessage.set(error instanceof ApiError ? error.message : 'Nao foi possivel carregar os indicadores de Aplause.');
    } finally {
      if (requestId === this.requestId) this.isLoading.set(false);
    }
  }
}
