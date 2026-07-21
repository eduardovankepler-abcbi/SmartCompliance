import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { Competency, CompetenciesService } from '../competencies/competencies.service';
import { Person, PeopleService } from '../people/people.service';
import {
  DevelopmentPlan,
  DevelopmentPlanPayload,
  DevelopmentRecord,
  DevelopmentRecordPayload,
  DevelopmentService,
  LearningIntegrationEvent,
} from './development.service';

const progressLabels: Record<string, string> = {
  not_started: 'Nao iniciado',
  in_progress: 'Em andamento',
  blocked: 'Bloqueado',
  done: 'Concluido',
};

@Component({
  selector: 'app-development-page',
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <section class="development" aria-labelledby="development-title">
      <header class="development__header">
        <div><p>Desenvolvimento</p><h1 id="development-title">Formacao e PDI</h1><span>Registre aprendizados e acompanhe planos dentro do seu escopo.</span></div>
        <div class="actions"><button type="button" (click)="openRecordForm()">Novo registro</button><button type="button" (click)="openPlanForm()">Novo PDI</button><button class="secondary" type="button" (click)="load()" [disabled]="loading()">Atualizar</button></div>
      </header>

      @if (errorMessage()) { <div class="error" role="alert"><span>{{ errorMessage() }}</span><button class="secondary" type="button" (click)="errorMessage.set('')">Fechar</button></div> }

      @if (showRecordForm()) {
        <form class="form-panel" [formGroup]="recordForm" (ngSubmit)="saveRecord()">
          <div class="form-heading"><div><p>Registro de desenvolvimento</p><h2>{{ editingRecord() ? 'Editar registro' : 'Novo registro' }}</h2></div><button class="secondary" type="button" (click)="closeRecordForm()">Cancelar</button></div>
          <div class="form-grid">
            <label>Pessoa<select formControlName="personId">@for (person of peopleOptions(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }</select></label>
            <label>Tipo<select formControlName="recordType">@for (type of recordTypes; track type) { <option [value]="type">{{ type }}</option> }</select></label>
            <label class="wide">Titulo<input formControlName="title" /></label>
            <label>Instituicao ou provedor<input formControlName="providerName" /></label>
            <label>Conclusao<input type="date" formControlName="completedAt" /></label>
            <label class="wide">Sinal de competencia<input formControlName="skillSignal" /></label>
            <label class="wide">Observacoes<textarea rows="3" formControlName="notes"></textarea></label>
          </div>
          <button type="submit" [disabled]="saving()">{{ saving() ? 'Salvando...' : 'Salvar registro' }}</button>
        </form>
      }

      @if (showPlanForm()) {
        <form class="form-panel" [formGroup]="planForm" (ngSubmit)="savePlan()">
          <div class="form-heading"><div><p>Plano de desenvolvimento individual</p><h2>{{ editingPlan() ? 'Editar PDI' : 'Novo PDI' }}</h2></div><button class="secondary" type="button" (click)="closePlanForm()">Cancelar</button></div>
          <div class="form-grid">
            <label>Pessoa<select formControlName="personId">@for (person of peopleOptions(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }</select></label>
            <label>Competencia<select formControlName="competencyId"><option value="">Competencia livre</option>@for (competency of competencies(); track competency.id) { <option [value]="competency.id">{{ competency.name }}</option> }</select></label>
            <label class="wide">Foco do PDI<input formControlName="focusTitle" /></label>
            <label class="wide">Acao planejada<textarea rows="3" formControlName="actionText"></textarea></label>
            <label>Prazo<input type="date" formControlName="dueDate" /></label>
            <label>Evidencia esperada<input formControlName="expectedEvidence" /></label>
          </div>
          <button type="submit" [disabled]="saving()">{{ saving() ? 'Salvando...' : 'Salvar PDI' }}</button>
        </form>
      }

      @if (loading()) { <p class="state">Carregando dados de desenvolvimento...</p> }
      @else {
        @if (canManageLearningIntegrations()) {
          <section class="panel integrations" aria-labelledby="integrations-title">
            <div class="panel__heading"><div><p>Integracoes de aprendizagem</p><h2 id="integrations-title">Fila de revisao</h2></div><span>Revise antes de atualizar Desenvolvimento ou PDI</span></div>
            <div class="integration-metrics" aria-label="Resumo da fila"><article><strong>{{ pendingLearningEvents().length }}</strong><span>Na fila</span></article><article><strong>{{ readyLearningEvents() }}</strong><span>Prontos</span></article><article><strong>{{ needsReviewLearningEvents() }}</strong><span>Exigem revisao</span></article><article><strong>{{ appliedLearningEvents() }}</strong><span>Aplicados</span></article></div>
            @if (!pendingLearningEvents().length) { <p class="state">Fila limpa. Novos cursos e treinamentos importados aparecerao aqui.</p> }
            @else { <div class="cards integration-cards">@for (event of pendingLearningEvents(); track event.id) {
              <article class="card"><div class="card__top"><div><strong>{{ event.title }}</strong><span>{{ event.personName || event.personEmail || 'Pessoa nao conciliada' }}</span></div><span class="badge" [class.badge--warning]="!event.personId">{{ event.personId ? 'Pronto' : 'Revisar' }}</span></div><p>{{ event.providerName }} · {{ learningTargetLabel(event) }}</p><dl><div><dt>Origem</dt><dd>{{ event.sourceSystem }} · {{ event.externalId }}</dd></div><div><dt>Carga e competencia</dt><dd>{{ event.workloadHours || 0 }}h · {{ event.competencyKey || 'Sem competencia' }}</dd></div></dl><div class="card-actions"><button class="secondary" type="button" (click)="openLearningReview(event)">Revisar e aplicar</button></div>
                @if (reviewingLearningEvent()?.id === event.id) { <form class="integration-form" [formGroup]="learningForm" (ngSubmit)="applyLearningEvent(event)"><label>Pessoa<select formControlName="personId"><option value="">Selecione uma pessoa</option>@for (person of peopleOptions(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }</select></label><label>Competencia<select formControlName="competencyId"><option value="">Mapeamento automatico</option>@for (competency of competencies(); track competency.id) { <option [value]="competency.id">{{ competency.name }}</option> }</select></label>@if (event.suggestedAction === 'development_plan_candidate') { <label>Prazo sugerido<input type="date" formControlName="dueDate" /></label> }<label class="wide">Nota de revisao<textarea rows="2" formControlName="reviewNote"></textarea></label><div class="card-actions wide"><button type="submit" [disabled]="saving() || !learningForm.controls.personId.value">{{ saving() ? 'Aplicando...' : 'Aplicar em ' + learningTargetLabel(event) }}</button><button class="secondary" type="button" (click)="reviewingLearningEvent.set(null)">Cancelar</button></div></form> }
              </article>
            }</div> }
          </section>
        }
        <div class="metrics" aria-label="Resumo de desenvolvimento"><article><strong>{{ activeRecords().length }}</strong><span>Registros ativos</span></article><article><strong>{{ activePlans().length }}</strong><span>PDIs ativos</span></article><article><strong>{{ plansInProgress() }}</strong><span>PDIs em andamento</span></article></div>

        <section class="panel" aria-labelledby="plans-title">
          <div class="panel__heading"><div><p>Planos individuais</p><h2 id="plans-title">PDIs</h2></div><span>{{ activePlans().length }} no escopo</span></div>
          @if (!activePlans().length) { <p class="state">Nenhum PDI ativo no seu escopo.</p> }
          @else { <div class="cards">@for (plan of activePlans(); track plan.id) {
            <article class="card"><div class="card__top"><div><strong>{{ plan.focusTitle }}</strong><span>{{ plan.personName }}</span></div><span class="badge">{{ progressLabel(plan.progressStatus) }}</span></div><p>{{ plan.actionText }}</p><dl><div><dt>Prazo</dt><dd>{{ plan.dueDate | date:'dd/MM/yyyy' }}</dd></div><div><dt>Competencia</dt><dd>{{ plan.competencyName || 'Nao vinculada' }}</dd></div><div><dt>Evidencia esperada</dt><dd>{{ plan.expectedEvidence }}</dd></div></dl>@if (plan.progressNote) { <small>Ultimo andamento: {{ plan.progressNote }}</small> }
              <div class="card-actions"><button class="secondary" type="button" (click)="openPlanForm(plan)">Editar</button><button class="secondary" type="button" (click)="openProgressForm(plan)">Andamento</button><button class="danger" type="button" (click)="archivePlan(plan)">Arquivar</button></div>
              @if (progressPlan()?.id === plan.id) { <form class="progress-form" [formGroup]="progressForm" (ngSubmit)="saveProgress(plan)"><label>Status<select formControlName="progressStatus"><option value="not_started">Nao iniciado</option><option value="in_progress">Em andamento</option><option value="blocked">Bloqueado</option><option value="done">Concluido</option></select></label><label>Nota<input formControlName="progressNote" /></label><button type="submit" [disabled]="saving()">Salvar andamento</button><button class="secondary" type="button" (click)="progressPlan.set(null)">Cancelar</button></form> }
            </article>
          }</div> }
        </section>

        <section class="panel" aria-labelledby="records-title">
          <div class="panel__heading"><div><p>Historico de aprendizagem</p><h2 id="records-title">Registros</h2></div><span>{{ activeRecords().length }} no escopo</span></div>
          @if (!activeRecords().length) { <p class="state">Nenhum registro de desenvolvimento no seu escopo.</p> }
          @else { <div class="cards">@for (record of activeRecords(); track record.id) {
            <article class="card"><div class="card__top"><div><strong>{{ record.title }}</strong><span>{{ record.personName }}</span></div><span class="badge">{{ record.recordType }}</span></div><p>{{ record.providerName }} · {{ record.completedAt | date:'dd/MM/yyyy' }}</p><dl><div><dt>Sinal de competencia</dt><dd>{{ record.skillSignal }}</dd></div></dl>@if (record.notes) { <small>{{ record.notes }}</small> }<div class="card-actions"><button class="secondary" type="button" (click)="openRecordForm(record)">Editar</button><button class="danger" type="button" (click)="archiveRecord(record)">Arquivar</button></div></article>
          }</div> }
        </section>
      }
    </section>
  `,
  styles: `
    .development{max-width:1080px}.development__header,.error,.panel__heading,.card__top,.form-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.development__header p,.panel__heading p,.form-heading p{margin:0;color:#175cd3;font-size:13px;font-weight:700;text-transform:uppercase}.development__header h1,.form-heading h2{margin:4px 0}.development__header span,.panel__heading>span,.state,.card p,.card small{color:#667085}.actions,.card-actions{display:flex;flex-wrap:wrap;gap:8px}button{padding:9px 12px;background:#175cd3;color:#fff;border:0;border-radius:6px;font-weight:600}.secondary{background:#fff;color:#344054;border:1px solid #98a2b3}.danger{background:#fff;color:#b42318;border:1px solid #fda29b}button:disabled{opacity:.6}.error{margin-top:20px;padding:12px;color:#b42318;background:#fef3f2;border:1px solid #fecdca;border-radius:8px}.form-panel,.metrics article,.integration-metrics article,.panel,.card{background:#fff;border:1px solid #d0d5dd;border-radius:10px}.form-panel{margin-top:20px;padding:18px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0}.form-grid label,.progress-form label,.integration-form label{display:grid;gap:6px;color:#344054;font-size:14px;font-weight:600}.form-grid .wide,.integration-form .wide{grid-column:1/-1}input,select,textarea{box-sizing:border-box;width:100%;padding:9px 10px;border:1px solid #98a2b3;border-radius:6px;background:#fff;color:#101828;font:inherit}.metrics,.integration-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:24px}.integration-metrics{grid-template-columns:repeat(4,minmax(0,1fr));margin-top:16px}.metrics article,.integration-metrics article{display:grid;gap:4px;padding:18px}.metrics strong,.integration-metrics strong{font-size:26px}.metrics span,.integration-metrics span{color:#667085}.panel{margin-top:20px;padding:18px}.panel__heading h2{margin:3px 0 0}.integrations{border-color:#b2ccff;background:#f9fbff}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.card{padding:16px}.card__top>div{display:grid;gap:4px}.card__top>div span{color:#667085;font-size:14px}.badge{padding:4px 8px;border-radius:999px;background:#eff4ff;color:#175cd3;font-size:12px;font-weight:700}.badge--warning{background:#fffaeb;color:#b54708}.card p{margin:14px 0}.card dl{display:grid;gap:9px;margin:0}.card dl div{display:grid;gap:2px}.card dt{color:#667085;font-size:12px}.card dd{margin:0;color:#344054}.card small{display:block;margin-top:12px}.card-actions{margin-top:16px}.progress-form,.integration-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #eaecf0}.progress-form button{align-self:end}.state{margin:20px 0 4px}@media(max-width:760px){.metrics,.integration-metrics,.cards,.form-grid,.progress-form,.integration-form{grid-template-columns:1fr}.form-grid .wide,.integration-form .wide{grid-column:auto}.development__header,.panel__heading{align-items:stretch;flex-direction:column}.actions{justify-content:flex-start}}
  `,
})
export class DevelopmentPageComponent implements OnInit {
  private readonly api = inject(DevelopmentService);
  private readonly peopleApi = inject(PeopleService);
  private readonly competenciesApi = inject(CompetenciesService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly recordTypes = ['Graduacao', 'Pos-graduacao', 'MBA', 'Certificacao', 'Curso', 'Treinamento', 'Projeto', 'Palestra'];
  readonly records = signal<DevelopmentRecord[]>([]);
  readonly plans = signal<DevelopmentPlan[]>([]);
  readonly learningEvents = signal<LearningIntegrationEvent[]>([]);
  readonly people = signal<Person[]>([]);
  readonly competencies = signal<Competency[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly showRecordForm = signal(false);
  readonly showPlanForm = signal(false);
  readonly editingRecord = signal<DevelopmentRecord | null>(null);
  readonly editingPlan = signal<DevelopmentPlan | null>(null);
  readonly progressPlan = signal<DevelopmentPlan | null>(null);
  readonly reviewingLearningEvent = signal<LearningIntegrationEvent | null>(null);
  readonly canManageLearningIntegrations = computed(() => ['admin', 'hr'].includes(this.auth.user()?.roleKey || ''));
  readonly activeRecords = computed(() => this.records().filter((item) => item.status !== 'archived'));
  readonly activePlans = computed(() => this.plans().filter((item) => item.status !== 'archived'));
  readonly plansInProgress = computed(() => this.activePlans().filter((item) => item.progressStatus === 'in_progress').length);
  readonly pendingLearningEvents = computed(() => this.learningEvents().filter((item) => item.processingStatus !== 'applied'));
  readonly readyLearningEvents = computed(() => this.learningEvents().filter((item) => item.processingStatus === 'ready_for_review').length);
  readonly needsReviewLearningEvents = computed(() => this.learningEvents().filter((item) => item.processingStatus === 'needs_review').length);
  readonly appliedLearningEvents = computed(() => this.learningEvents().filter((item) => item.processingStatus === 'applied').length);
  readonly peopleOptions = computed(() => {
    const options = new Map(this.people().map((person) => [person.id, person]));
    const userPerson = this.auth.user()?.person;
    if (userPerson && !options.has(userPerson.id)) {
      options.set(userPerson.id, { id:userPerson.id, name:userPerson.name, roleTitle:'', area:userPerson.area || '', workUnit:null, workMode:null, managerPersonId:null, managerName:null, areaManagerPersonId:null, areaManagerName:null, employmentType:'internal' });
    }
    return [...options.values()];
  });

  readonly recordForm = this.fb.nonNullable.group({ personId:['', Validators.required], recordType:['Graduacao', Validators.required], title:['', Validators.required], providerName:['', Validators.required], completedAt:['', Validators.required], skillSignal:['', Validators.required], notes:[''] });
  readonly planForm = this.fb.nonNullable.group({ personId:['', Validators.required], cycleId:[''], competencyId:[''], focusTitle:['', Validators.required], actionText:['', Validators.required], dueDate:['', Validators.required], expectedEvidence:['', Validators.required] });
  readonly progressForm = this.fb.nonNullable.group({ progressStatus:['not_started', Validators.required], progressNote:[''] });
  readonly learningForm = this.fb.nonNullable.group({ personId:['', Validators.required], competencyId:[''], dueDate:[''], reviewNote:[''] });

  ngOnInit(): void { void this.load(); }
  progressLabel(status: string): string { return progressLabels[status] ?? status; }

  openRecordForm(record: DevelopmentRecord | null = null): void {
    this.editingRecord.set(record);
    this.recordForm.reset(record ? { personId:record.personId, recordType:record.recordType, title:record.title, providerName:record.providerName, completedAt:this.dateInput(record.completedAt), skillSignal:record.skillSignal, notes:record.notes } : { personId:this.defaultPersonId(), recordType:'Graduacao', title:'', providerName:'', completedAt:'', skillSignal:'', notes:'' });
    this.showRecordForm.set(true);
  }
  closeRecordForm(): void { this.showRecordForm.set(false); this.editingRecord.set(null); }
  openPlanForm(plan: DevelopmentPlan | null = null): void {
    this.editingPlan.set(plan);
    this.planForm.reset(plan ? { personId:plan.personId, cycleId:plan.cycleId || '', competencyId:plan.competencyId || '', focusTitle:plan.focusTitle, actionText:plan.actionText, dueDate:this.dateInput(plan.dueDate), expectedEvidence:plan.expectedEvidence } : { personId:this.defaultPersonId(), cycleId:'', competencyId:'', focusTitle:'', actionText:'', dueDate:'', expectedEvidence:'' });
    this.showPlanForm.set(true);
  }
  closePlanForm(): void { this.showPlanForm.set(false); this.editingPlan.set(null); }
  openProgressForm(plan: DevelopmentPlan): void { this.progressPlan.set(plan); this.progressForm.reset({ progressStatus:plan.progressStatus || 'not_started', progressNote:plan.progressNote || '' }); }
  openLearningReview(event: LearningIntegrationEvent): void {
    const competencyId = this.competencies().find((item) => item.key.toLowerCase() === (event.competencyKey || '').toLowerCase())?.id || '';
    this.reviewingLearningEvent.set(event);
    this.learningForm.reset({ personId:event.personId || '', competencyId, dueDate:event.occurredAt ? this.dateInput(event.occurredAt) : '', reviewNote:event.reviewNote || '' });
  }
  learningTargetLabel(event: LearningIntegrationEvent): string { return event.suggestedAction === 'development_record_candidate' ? 'Desenvolvimento' : 'PDI'; }

  async saveRecord(): Promise<void> {
    if (this.recordForm.invalid) { this.recordForm.markAllAsTouched(); return; }
    await this.performSave(async () => { const payload = this.recordForm.getRawValue() as DevelopmentRecordPayload; const editing = this.editingRecord(); if (editing) await firstValueFrom(this.api.updateRecord(editing.id, { ...payload, status:editing.status || 'active' })); else await firstValueFrom(this.api.createRecord(payload)); this.closeRecordForm(); });
  }
  async savePlan(): Promise<void> {
    if (this.planForm.invalid) { this.planForm.markAllAsTouched(); return; }
    await this.performSave(async () => { const raw = this.planForm.getRawValue(); const payload: DevelopmentPlanPayload = { ...raw, cycleId:raw.cycleId || null, competencyId:raw.competencyId || null }; const editing = this.editingPlan(); if (editing) await firstValueFrom(this.api.updatePlan(editing.id, { ...payload, status:editing.status || 'active' })); else await firstValueFrom(this.api.createPlan(payload)); this.closePlanForm(); });
  }
  async saveProgress(plan: DevelopmentPlan): Promise<void> { await this.performSave(async () => { await firstValueFrom(this.api.updatePlanProgress(plan.id, this.progressForm.getRawValue())); this.progressPlan.set(null); }); }
  async archiveRecord(record: DevelopmentRecord): Promise<void> { await this.performSave(async () => { await firstValueFrom(this.api.updateRecord(record.id, { personId:record.personId, recordType:record.recordType, title:record.title, providerName:record.providerName, completedAt:record.completedAt, skillSignal:record.skillSignal, notes:record.notes, status:'archived' })); }); }
  async archivePlan(plan: DevelopmentPlan): Promise<void> { await this.performSave(async () => { await firstValueFrom(this.api.updatePlan(plan.id, { personId:plan.personId, cycleId:plan.cycleId, competencyId:plan.competencyId, focusTitle:plan.focusTitle, actionText:plan.actionText, dueDate:plan.dueDate, expectedEvidence:plan.expectedEvidence, status:'archived' })); }); }
  async applyLearningEvent(event: LearningIntegrationEvent): Promise<void> {
    if (this.learningForm.invalid) { this.learningForm.markAllAsTouched(); return; }
    await this.performSave(async () => {
      const value = this.learningForm.getRawValue();
      await firstValueFrom(this.api.applyLearningEvent(event.id, { personId:value.personId, competencyId:value.competencyId || undefined, dueDate:value.dueDate || undefined, reviewNote:value.reviewNote || undefined }));
      this.reviewingLearningEvent.set(null);
    });
  }

  async load(): Promise<void> {
    this.loading.set(true); this.errorMessage.set('');
    try {
      const learningEventsRequest = this.canManageLearningIntegrations() ? this.api.listLearningEvents() : of([] as LearningIntegrationEvent[]);
      const data = await firstValueFrom(forkJoin({ records:this.api.listRecords(), plans:this.api.listPlans(), people:this.peopleApi.list().pipe(catchError(() => of([] as Person[]))), competencies:this.competenciesApi.list().pipe(catchError(() => of([] as Competency[]))), learningEvents:learningEventsRequest }));
      this.records.set(data.records); this.plans.set(data.plans); this.people.set(data.people); this.competencies.set(data.competencies); this.learningEvents.set(data.learningEvents);
    } catch (error) { this.setError(error, 'Falha ao carregar dados de desenvolvimento.'); }
    finally { this.loading.set(false); }
  }

  private async performSave(action: () => Promise<void>): Promise<void> {
    this.saving.set(true); this.errorMessage.set('');
    try { await action(); await this.load(); }
    catch (error) { this.setError(error, 'Falha ao salvar dados de desenvolvimento.'); }
    finally { this.saving.set(false); }
  }
  private defaultPersonId(): string { return this.auth.user()?.person?.id || this.peopleOptions()[0]?.id || ''; }
  private dateInput(value: string): string { return value ? String(value).slice(0, 10) : ''; }
  private setError(error: unknown, fallback: string): void { this.errorMessage.set(error instanceof ApiError ? error.message : fallback); }
}
