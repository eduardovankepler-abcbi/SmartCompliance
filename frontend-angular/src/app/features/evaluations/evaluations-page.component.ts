import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin } from 'rxjs';

import { ApiError } from '../../core/http/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { EvaluationLibraryPanelComponent } from './evaluation-library-panel.component';
import { EvaluationQuestionnairesPanelComponent } from './evaluation-questionnaires-panel.component';
import { EvaluationCycleOperationsPanelComponent } from './evaluation-cycle-operations-panel.component';
import { EvaluationFeedbackInsightsPanelComponent } from './evaluation-feedback-insights-panel.component';
import {
  EvaluationAnswerPayload,
  EvaluationAssignment,
  EvaluationAssignmentDetail,
  EvaluationQuestion,
  EvaluationsService,
} from './evaluations.service';

interface AnswerDraft {
  score: number | null;
  evidenceNote: string;
  textValue: string;
  selectedOptions: string[];
}

type EvaluationTab = 'assignments' | 'cycles' | 'feedback' | 'operations' | 'questionnaires' | 'library';

const evaluationModules = ['company', 'leader', 'manager', 'peer', 'peer-same-area', 'cross-functional', 'client-internal', 'client-external', 'self', 'leader-self'] as const;
type EvaluationModule = (typeof evaluationModules)[number];
const moduleAliases: Record<string, EvaluationModule> = {
  empresa: 'company',
  lider: 'leader',
  'feedback-lider': 'manager',
  'feedback-direto': 'peer',
  'colega-mesmo-setor': 'peer-same-area',
  'feedback-transversal': 'cross-functional',
  'cliente-interno': 'client-internal',
  'cliente-externo': 'client-external',
  autoavaliacao: 'self',
  'autoavaliacao-lider': 'leader-self',
};
const workspaceToTab: Record<string, EvaluationTab> = {
  respond: 'assignments',
  responder: 'assignments',
  cycles: 'cycles',
  ciclos: 'cycles',
  insights: 'feedback',
  leituras: 'feedback',
  operations: 'operations',
  operacao: 'operations',
  questionnaires: 'questionnaires',
  perguntas: 'questionnaires',
  library: 'library',
  biblioteca: 'library',
};
const tabToWorkspace: Record<EvaluationTab, string> = {
  assignments: 'respond',
  cycles: 'cycles',
  feedback: 'insights',
  operations: 'operations',
  questionnaires: 'questionnaires',
  library: 'library',
};

@Component({
  selector: 'app-evaluations-page',
  imports: [DatePipe, FormsModule, EvaluationLibraryPanelComponent, EvaluationQuestionnairesPanelComponent, EvaluationCycleOperationsPanelComponent, EvaluationFeedbackInsightsPanelComponent],
  template: `
    <section class="evaluations" aria-labelledby="evaluations-title">
      <header class="evaluations__header"><div><p>Avaliacoes</p><h1 id="evaluations-title">Ciclos e respostas</h1><span>Acompanhe suas atribuicoes e responda aos questionarios liberados.</span></div><button class="secondary" type="button" (click)="load(true)" [disabled]="loading()">Atualizar</button></header>
      @if (errorMessage()) { <div class="error" role="alert"><span>{{ errorMessage() }}</span><button class="secondary" type="button" (click)="errorMessage.set('')">Fechar</button></div> }

      <nav class="modules-nav" aria-label="Modalidades de Avaliacoes">@for(module of modules; track module){<button type="button" [class.active]="activeModule()===module" (click)="goToModule(module)">{{ relationshipLabel(module) }} <span>{{ assignmentCountByModule(module) }}</span></button>}</nav>
      <nav class="tabs" aria-label="Areas de Avaliacoes"><button type="button" [class.active]="activeTab() === 'assignments'" (click)="goToTab('assignments')">Minhas avaliacoes <span>{{ pendingAssignments().length }}</span></button><button type="button" [class.active]="activeTab() === 'cycles'" (click)="goToTab('cycles')">Ciclos <span>{{ cycles().length }}</span></button><button type="button" [class.active]="activeTab() === 'feedback'" (click)="goToTab('feedback')">Feedback e 360</button>@if(canManageQuestionnaires()){<button type="button" [class.active]="activeTab() === 'operations'" (click)="goToTab('operations')">Operacao</button><button type="button" [class.active]="activeTab() === 'questionnaires'" (click)="goToTab('questionnaires')">Questionarios</button><button type="button" [class.active]="activeTab() === 'library'" (click)="goToTab('library')">Biblioteca</button>}</nav>

      @if (loading()) { <p class="state">Carregando Avaliacoes...</p> }
      @else if (activeTab() === 'library') {
        @defer { <app-evaluation-library-panel /> }
        @placeholder { <p class="state">Carregando biblioteca...</p> }
      }
      @else if (activeTab() === 'questionnaires') {
        @defer { <app-evaluation-questionnaires-panel /> }
        @placeholder { <p class="state">Carregando questionarios...</p> }
      }
      @else if (activeTab() === 'operations') {
        @defer { <app-evaluation-cycle-operations-panel /> }
        @placeholder { <p class="state">Carregando operacao...</p> }
      }
      @else if (activeTab() === 'feedback') {
        @defer { <app-evaluation-feedback-insights-panel /> }
        @placeholder { <p class="state">Carregando feedback...</p> }
      }
      @else if (activeTab() === 'cycles') {
        <section class="panel" aria-labelledby="cycles-title"><div class="panel__heading"><div><p>Calendario</p><h2 id="cycles-title">Ciclos disponiveis</h2></div><span>{{ cycles().length }} ciclos</span></div>
          @if (!cycles().length) { <p class="state">Nenhum ciclo disponivel para o seu perfil.</p> }
          @else { <div class="cards">@for (cycle of cycles(); track cycle.id) { <article class="card"><div class="card__top"><div><strong>{{ cycle.title }}</strong><span>{{ cycle.semesterLabel }}</span></div><span class="badge">{{ cycle.status }}</span></div><p>{{ cycle.libraryName || cycle.modelName }}</p><dl><div><dt>Prazo</dt><dd>{{ cycle.dueDate | date:'dd/MM/yyyy' }}</dd></div><div><dt>Grupo alvo</dt><dd>{{ cycle.targetGroup }}</dd></div></dl></article> }</div> }
        </section>
      } @else {
        @if (selectedDetail()) {
          <section class="response" aria-labelledby="response-title"><div class="response__heading"><div><p>{{ relationshipLabel(selectedDetail()!.assignment.relationshipType) }}</p><h2 id="response-title">{{ selectedDetail()!.template.title }}</h2><span>{{ selectedDetail()!.assignment.revieweeName }} · {{ selectedDetail()!.assignment.cycleTitle }}</span></div><button class="secondary" type="button" (click)="closeAssignment()">Voltar</button></div><p class="description">{{ selectedDetail()!.template.description }}</p>
            @for (question of selectedDetail()!.template.questions; track question.id) {
              <article class="question"><div class="question__heading"><div><small>{{ question.sectionTitle || question.dimensionTitle }}</small><h3>{{ question.dimensionTitle }}</h3></div>@if (question.isRequired) { <span class="required">Obrigatoria</span> }</div><p>{{ question.prompt }}</p>@if (question.helperText) { <small>{{ question.helperText }}</small> }
                @if (question.inputType === 'text') { <label>Resposta<textarea rows="4" maxlength="200" [ngModel]="answer(question.id).textValue" (ngModelChange)="setText(question.id, $event)" [ngModelOptions]="{standalone:true}"></textarea><small>{{ answer(question.id).textValue.length }}/200 caracteres</small></label> }
                @else if (question.inputType === 'multi-select') { <fieldset><legend>{{ selectedDetail()!.template.key === 'peer-same-area' ? 'Selecione uma opcao' : 'Selecione uma ou mais opcoes' }}</legend>@for (option of question.options || []; track option.value) { <label class="check"><input type="checkbox" [checked]="answer(question.id).selectedOptions.includes(option.value)" (change)="toggleOption(question, option.value)" /> <span>{{ option.label }}</span></label> }</fieldset> }
                @else { <label>Resposta<select [ngModel]="answer(question.id).score" (ngModelChange)="setScore(question.id, $event)" [ngModelOptions]="{standalone:true}">@for (option of scaleOptions(); track option.value) { <option [ngValue]="option.value">{{ option.label }}</option> }</select></label>@if (question.collectEvidenceOnExtreme) { <label>Evidencia para nota extrema<textarea rows="3" [ngModel]="answer(question.id).evidenceNote" (ngModelChange)="setEvidence(question.id, $event)" [ngModelOptions]="{standalone:true}"></textarea></label> } }
              </article>
            }
            @if (selectedDetail()!.template.policy?.showStrengthsNote) { <label class="summary-field">Pontos fortes<textarea rows="3" [(ngModel)]="strengthsNote" [ngModelOptions]="{standalone:true}"></textarea></label> }
            @if (selectedDetail()!.template.policy?.showDevelopmentNote) { <label class="summary-field">Pontos de desenvolvimento<textarea rows="3" [(ngModel)]="developmentNote" [ngModelOptions]="{standalone:true}"></textarea></label> }
            <button type="button" (click)="submit()" [disabled]="submitting()">{{ submitting() ? 'Enviando...' : 'Enviar avaliacao' }}</button>
          </section>
        } @else {
          <div class="metrics"><article><strong>{{ pendingAssignments().length }}</strong><span>Pendentes</span></article><article><strong>{{ submittedAssignments().length }}</strong><span>Concluidas</span></article><article><strong>{{ scopedAssignments().length }}</strong><span>Total no seu escopo</span></article></div>
          <section class="panel" aria-labelledby="assignments-title"><div class="panel__heading"><div><p>Jornada de resposta</p><h2 id="assignments-title">Minhas avaliacoes</h2></div><span>{{ scopedAssignments().length }} atribuicoes</span></div>
            @if (!scopedAssignments().length) { <p class="state">Nenhuma avaliacao atribuida ao seu usuario nesta modalidade.</p> }
            @else { <div class="cards">@for (assignment of scopedAssignments(); track assignment.id) { <article class="card"><div class="card__top"><div><strong>{{ assignment.revieweeName }}</strong><span>{{ relationshipLabel(assignment.relationshipType) }}</span></div><span class="badge" [class.badge--done]="assignment.status === 'submitted'">{{ assignment.status === 'submitted' ? 'Concluida' : 'Pendente' }}</span></div><p>{{ assignment.cycleTitle }} · {{ assignment.semesterLabel }}</p><dl><div><dt>Prazo</dt><dd>{{ assignment.dueDate | date:'dd/MM/yyyy' }}</dd></div><div><dt>Area avaliada</dt><dd>{{ assignment.revieweeArea || 'Institucional' }}</dd></div></dl>@if (assignment.status === 'pending') { <button type="button" (click)="openAssignment(assignment)" [disabled]="assignment.cycleStatus !== 'Liberado'">{{ assignment.cycleStatus === 'Liberado' ? 'Responder avaliacao' : 'Aguardando liberacao' }}</button> } @else { <small>Enviada em {{ assignment.submittedAt | date:'short' }}</small> }</article> }</div> }
          </section>
        }
      }
    </section>
  `,
  styles: `
    .evaluations{max-width:1100px}.evaluations__header,.error,.panel__heading,.card__top,.response__heading,.question__heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.evaluations__header p,.panel__heading p,.response__heading p{margin:0;color:var(--abc-blue);font-size:13px;font-weight:700;text-transform:uppercase}.evaluations__header h1,.panel__heading h2,.response__heading h2{margin:4px 0}.evaluations__header span,.panel__heading>span,.state,.card p,.card small,.description,.question>small{color:var(--abc-text-muted)}button{padding:9px 12px;background:var(--abc-blue);color:var(--abc-on-blue);border:0;border-radius:var(--abc-radius);font-weight:700}.secondary{background:var(--abc-surface);color:var(--abc-text);border:1px solid var(--abc-border)}button:disabled{opacity:.55}.error{margin-top:20px;padding:12px;color:var(--abc-danger);background:color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface));border:1px solid color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border));border-radius:8px}.modules-nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.modules-nav button{background:var(--abc-surface);color:var(--abc-text);border:1px solid var(--abc-border)}.modules-nav button.active{background:var(--abc-blue);color:var(--abc-on-blue);border-color:var(--abc-blue)}.modules-nav span{margin-left:6px;opacity:.8}.tabs{display:flex;gap:8px;margin-top:16px;border-bottom:1px solid var(--abc-border)}.tabs button{border-radius:var(--abc-radius) 6px 0 0;background:transparent;color:var(--abc-text-muted)}.tabs button.active{background:color-mix(in srgb, var(--abc-blue) 8%, var(--abc-surface));color:var(--abc-blue)}.tabs span{margin-left:6px}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px}.metrics article,.panel,.card,.response,.question{background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:10px}.metrics article{display:grid;gap:4px;padding:18px}.metrics strong{font-size:26px}.metrics span{color:var(--abc-text-muted)}.panel,.response{margin-top:20px;padding:18px}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.card{padding:16px}.card__top>div{display:grid;gap:4px}.card__top>div span{color:var(--abc-text-muted);font-size:14px}.badge,.required{padding:4px 8px;border-radius:999px;background:color-mix(in srgb, var(--abc-warning) 10%, var(--abc-surface));color:var(--abc-warning);font-size:12px;font-weight:700}.badge--done{background:color-mix(in srgb, var(--abc-success) 9%, var(--abc-surface));color:var(--abc-success)}.card dl{display:grid;gap:8px}.card dl div{display:grid;gap:2px}.card dt{color:var(--abc-text-muted);font-size:12px}.card dd{margin:0}.card button{margin-top:8px}.response__heading span{color:var(--abc-text-muted)}.question{margin-top:14px;padding:16px}.question__heading small{color:var(--abc-blue)}.question h3{margin:3px 0}.question label,.summary-field{display:grid;gap:6px;margin-top:12px;color:var(--abc-text);font-weight:600}.question textarea,.summary-field textarea,.question select{box-sizing:border-box;width:100%;padding:9px 10px;border:1px solid var(--abc-border);border-radius:var(--abc-radius);background:var(--abc-surface);font:inherit}.question fieldset{display:grid;gap:8px;margin-top:12px;border:1px solid var(--abc-border);border-radius:8px}.question .check{display:flex;align-items:center;margin:0;font-weight:400}.question .check input{width:auto}.summary-field{margin:16px 0}.state{margin:20px 0 4px}@media(max-width:760px){.metrics,.cards{grid-template-columns:1fr}.evaluations__header,.panel__heading,.response__heading{align-items:stretch;flex-direction:column}}
  `,
})
export class EvaluationsPageComponent implements OnInit {
  private readonly api = inject(EvaluationsService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly modules = evaluationModules;
  readonly activeModule = signal<EvaluationModule>('company');
  readonly activeTab = signal<EvaluationTab>('assignments');
  readonly canManageQuestionnaires = computed(() => ['admin', 'hr'].includes(this.auth.user()?.roleKey || ''));
  readonly cycles = signal<import('./evaluations.service').EvaluationCycle[]>([]);
  readonly assignments = signal<EvaluationAssignment[]>([]);
  readonly selectedDetail = signal<EvaluationAssignmentDetail | null>(null);
  readonly answers = signal<Record<string, AnswerDraft>>({});
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly scopedAssignments = computed(() => this.assignments().filter((item) => item.relationshipType === this.activeModule()));
  readonly pendingAssignments = computed(() => this.scopedAssignments().filter((item) => item.status === 'pending'));
  readonly submittedAssignments = computed(() => this.scopedAssignments().filter((item) => item.status === 'submitted'));
  private routeAssignmentId = '';
  private shellDataLoaded = false;
  strengthsNote = '';
  developmentNote = '';

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.applyRoute(params.get('module'), params.get('workspace'), params.get('detail'));
    });
  }
  scaleOptions() { return this.selectedDetail()?.template.scale?.length ? this.selectedDetail()!.template.scale! : [1,2,3,4,5].map((value) => ({ value, label:String(value) })); }
  answer(questionId: string): AnswerDraft { return this.answers()[questionId] || { score:3, evidenceNote:'', textValue:'', selectedOptions:[] }; }
  relationshipLabel(value: string): string { return ({ self:'Autoavaliacao', 'leader-self':'Autoavaliacao do lider', manager:'Gestor', peer:'Par', 'peer-same-area':'Colega da mesma area', leader:'Lideranca', company:'Empresa', 'cross-functional':'Transversal', 'client-internal':'Cliente interno', 'client-external':'Cliente externo' } as Record<string,string>)[value] || value; }
  goToTab(tab: EvaluationTab): Promise<boolean> { return this.router.navigate(['/app/evaluations', this.activeModule(), tabToWorkspace[tab]]); }
  goToModule(module: EvaluationModule): Promise<boolean> { return this.router.navigate(['/app/evaluations', module, tabToWorkspace[this.activeTab()]]); }
  assignmentCountByModule(module: EvaluationModule): number { return this.assignments().filter((item) => item.relationshipType === module).length; }

  async openAssignment(assignment: EvaluationAssignment): Promise<void> {
    if (this.route.snapshot.paramMap.get('detail') !== assignment.id) {
      await this.router.navigate(['/app/evaluations', assignment.relationshipType, 'respond', assignment.id]);
      return;
    }
    this.errorMessage.set('');
    try { const detail = await firstValueFrom(this.api.getAssignment(assignment.id)); this.selectedDetail.set(detail); this.answers.set(Object.fromEntries(detail.template.questions.map((question) => [question.id, { score:question.inputType === 'scale' ? 3 : null, evidenceNote:'', textValue:'', selectedOptions:[] }]))); this.strengthsNote=''; this.developmentNote=''; }
    catch (error) { this.setError(error, 'Falha ao abrir a avaliacao.'); }
  }
  closeAssignment(): void { this.selectedDetail.set(null); this.answers.set({}); if (this.activeTab() === 'assignments' && this.route.snapshot.paramMap.get('detail')) void this.router.navigate(['/app/evaluations', this.activeModule(), 'respond']); }
  setText(id:string, value:string):void { this.patchAnswer(id,{textValue:String(value || '').slice(0, 200)}); }
  setScore(id:string, value:number):void { this.patchAnswer(id,{score:Number(value)}); }
  setEvidence(id:string, value:string):void { this.patchAnswer(id,{evidenceNote:value}); }
  toggleOption(question: EvaluationQuestion, value: string): void { const current = new Set(this.answer(question.id).selectedOptions); if (this.selectedDetail()?.template.key === 'peer-same-area') current.clear(); else if (current.has(value)) { current.delete(value); this.patchAnswer(question.id,{selectedOptions:[...current]}); return; } current.add(value); this.patchAnswer(question.id,{selectedOptions:[...current]}); }

  async submit(): Promise<void> {
    const detail = this.selectedDetail(); if (!detail) return;
    const validation = this.validate(detail); if (validation) { this.errorMessage.set(validation); return; }
    const answers: EvaluationAnswerPayload[] = detail.template.questions.map((question) => ({ questionId:question.id, score:this.answer(question.id).score, evidenceNote:this.answer(question.id).evidenceNote, textValue:this.answer(question.id).textValue, selectedOptions:this.answer(question.id).selectedOptions }));
    this.submitting.set(true); this.errorMessage.set('');
    try { await firstValueFrom(this.api.submit({ assignmentId:detail.assignment.id, answers, strengthsNote:this.strengthsNote, developmentNote:this.developmentNote })); this.selectedDetail.set(null); this.answers.set({}); await this.router.navigate(['/app/evaluations', this.activeModule(), 'respond']); await this.load(true); }
    catch (error) { this.setError(error, 'Falha ao enviar a avaliacao.'); }
    finally { this.submitting.set(false); }
  }

  async load(force = false): Promise<void> {
    if (!this.activeTabNeedsShellData()) {
      this.loading.set(false);
      return;
    }
    if (this.shellDataLoaded && !force) {
      await this.openRouteAssignment();
      return;
    }
    this.loading.set(true); this.errorMessage.set('');
    try { const data=await firstValueFrom(forkJoin({cycles:this.api.listCycles(),assignments:this.api.listAssignments()})); this.cycles.set(data.cycles); this.assignments.set(data.assignments); this.shellDataLoaded = true; this.ensureRespondModuleHasAssignments(); await this.openRouteAssignment(); } catch(error){this.setError(error,'Falha ao carregar Avaliacoes.');} finally{this.loading.set(false);}
  }
  private applyRoute(moduleParam: string | null, workspaceParam: string | null, detailParam: string | null): void {
    const module = this.normalizeModule(moduleParam);
    const workspace = workspaceParam || 'respond';
    const tab = workspaceToTab[workspace] || 'assignments';
    const canonicalWorkspace = tabToWorkspace[tab];
    const forbidden = !this.canManageQuestionnaires() && ['operations', 'questionnaires', 'library'].includes(tab);
    const invalid = !module || workspaceToTab[workspace] === undefined;
    if (invalid || module !== moduleParam || workspace !== canonicalWorkspace || forbidden) {
      const nextWorkspace = invalid || forbidden ? 'respond' : canonicalWorkspace;
      const nextDetail = invalid || forbidden ? '' : detailParam || '';
      void this.router.navigate(['/app/evaluations', module || 'company', nextWorkspace, nextDetail].filter(Boolean), { replaceUrl: true });
      return;
    }
    this.activeModule.set(module);
    this.activeTab.set(tab);
    this.routeAssignmentId = tab === 'assignments' ? detailParam || '' : '';
    if (tab !== 'assignments') this.closeAssignment();
    else if (!this.routeAssignmentId) { this.selectedDetail.set(null); this.answers.set({}); }
    if (this.activeTabNeedsShellData()) void this.load();
    else this.loading.set(false);
  }
  private activeTabNeedsShellData(): boolean { return this.activeTab() === 'assignments' || this.activeTab() === 'cycles'; }
  private ensureRespondModuleHasAssignments(): void {
    if (this.activeTab() !== 'assignments' || this.scopedAssignments().length || !this.assignments().length) return;
    const firstModule = this.assignments()[0]?.relationshipType;
    if (!evaluationModules.includes(firstModule as (typeof evaluationModules)[number])) return;
    void this.router.navigate(['/app/evaluations', firstModule, 'respond'], { replaceUrl: true });
  }
  private normalizeModule(value: string | null): EvaluationModule | '' {
    if (evaluationModules.includes(value as EvaluationModule)) return value as EvaluationModule;
    return value ? moduleAliases[value] || '' : '';
  }
  private async openRouteAssignment(): Promise<void> {
    if (this.activeTab() !== 'assignments' || !this.routeAssignmentId) return;
    if (this.selectedDetail()?.assignment.id === this.routeAssignmentId) return;
    const assignment = this.scopedAssignments().find((item) => item.id === this.routeAssignmentId);
    if (!assignment) { void this.router.navigate(['/app/evaluations', this.activeModule(), 'respond'], { replaceUrl: true }); return; }
    await this.openAssignment(assignment);
  }
  private patchAnswer(id:string, patch:Partial<AnswerDraft>):void { this.answers.update((current)=>({...current,[id]:{...this.answer(id),...patch}})); }
  private validate(detail:EvaluationAssignmentDetail):string { for(const question of detail.template.questions){const value=this.answer(question.id);if(question.inputType==='text'&&value.textValue.length>200)return `A resposta aberta deve ter no maximo 200 caracteres: ${question.dimensionTitle || question.prompt}.`;if(!question.isRequired)continue;if(question.inputType==='text'&&!value.textValue.trim())return `Responda a pergunta obrigatoria: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='multi-select'&&!value.selectedOptions.length)return `Selecione pelo menos uma opcao em: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='multi-select'&&detail.template.key==='peer-same-area'&&value.selectedOptions.length!==1)return `Selecione apenas uma opcao em: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='scale'&&(!Number.isInteger(value.score)||Number(value.score)<1||Number(value.score)>5))return `Escolha uma nota valida em: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='scale'&&question.collectEvidenceOnExtreme&&(value.score===1||value.score===5)&&!value.evidenceNote.trim())return `Notas extremas exigem evidencia em: ${question.dimensionTitle || question.prompt}.`;}return ''; }
  private setError(error:unknown,fallback:string):void { this.errorMessage.set(error instanceof ApiError?error.message:fallback); }
}
