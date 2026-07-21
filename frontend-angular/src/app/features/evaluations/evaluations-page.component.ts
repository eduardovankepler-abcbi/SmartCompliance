import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-evaluations-page',
  imports: [DatePipe, FormsModule, EvaluationLibraryPanelComponent, EvaluationQuestionnairesPanelComponent, EvaluationCycleOperationsPanelComponent, EvaluationFeedbackInsightsPanelComponent],
  template: `
    <section class="evaluations" aria-labelledby="evaluations-title">
      <header class="evaluations__header"><div><p>Avaliacoes</p><h1 id="evaluations-title">Ciclos e respostas</h1><span>Acompanhe suas atribuicoes e responda aos questionarios liberados.</span></div><button class="secondary" type="button" (click)="load()" [disabled]="loading()">Atualizar</button></header>
      @if (errorMessage()) { <div class="error" role="alert"><span>{{ errorMessage() }}</span><button class="secondary" type="button" (click)="errorMessage.set('')">Fechar</button></div> }

      <nav class="tabs" aria-label="Areas de Avaliacoes"><button type="button" [class.active]="activeTab() === 'assignments'" (click)="activeTab.set('assignments')">Minhas avaliacoes <span>{{ pendingAssignments().length }}</span></button><button type="button" [class.active]="activeTab() === 'cycles'" (click)="activeTab.set('cycles')">Ciclos <span>{{ cycles().length }}</span></button><button type="button" [class.active]="activeTab() === 'feedback'" (click)="activeTab.set('feedback')">Feedback e 360</button>@if(canManageQuestionnaires()){<button type="button" [class.active]="activeTab() === 'operations'" (click)="activeTab.set('operations')">Operacao</button><button type="button" [class.active]="activeTab() === 'questionnaires'" (click)="activeTab.set('questionnaires')">Questionarios</button><button type="button" [class.active]="activeTab() === 'library'" (click)="activeTab.set('library')">Biblioteca</button>}</nav>

      @if (loading()) { <p class="state">Carregando Avaliacoes...</p> }
      @else if (activeTab() === 'library') { <app-evaluation-library-panel /> }
      @else if (activeTab() === 'questionnaires') { <app-evaluation-questionnaires-panel /> }
      @else if (activeTab() === 'operations') { <app-evaluation-cycle-operations-panel /> }
      @else if (activeTab() === 'feedback') { <app-evaluation-feedback-insights-panel /> }
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
                @if (question.inputType === 'text') { <label>Resposta<textarea rows="4" [ngModel]="answer(question.id).textValue" (ngModelChange)="setText(question.id, $event)" [ngModelOptions]="{standalone:true}"></textarea></label> }
                @else if (question.inputType === 'multi-select') { <fieldset><legend>{{ selectedDetail()!.template.key === 'peer-same-area' ? 'Selecione uma opcao' : 'Selecione uma ou mais opcoes' }}</legend>@for (option of question.options || []; track option.value) { <label class="check"><input type="checkbox" [checked]="answer(question.id).selectedOptions.includes(option.value)" (change)="toggleOption(question, option.value)" /> <span>{{ option.label }}</span></label> }</fieldset> }
                @else { <label>Resposta<select [ngModel]="answer(question.id).score" (ngModelChange)="setScore(question.id, $event)" [ngModelOptions]="{standalone:true}">@for (option of scaleOptions(); track option.value) { <option [ngValue]="option.value">{{ option.label }}</option> }</select></label>@if (question.collectEvidenceOnExtreme) { <label>Evidencia para nota extrema<textarea rows="3" [ngModel]="answer(question.id).evidenceNote" (ngModelChange)="setEvidence(question.id, $event)" [ngModelOptions]="{standalone:true}"></textarea></label> } }
              </article>
            }
            @if (selectedDetail()!.template.policy?.showStrengthsNote) { <label class="summary-field">Pontos fortes<textarea rows="3" [(ngModel)]="strengthsNote" [ngModelOptions]="{standalone:true}"></textarea></label> }
            @if (selectedDetail()!.template.policy?.showDevelopmentNote) { <label class="summary-field">Pontos de desenvolvimento<textarea rows="3" [(ngModel)]="developmentNote" [ngModelOptions]="{standalone:true}"></textarea></label> }
            <button type="button" (click)="submit()" [disabled]="submitting()">{{ submitting() ? 'Enviando...' : 'Enviar avaliacao' }}</button>
          </section>
        } @else {
          <div class="metrics"><article><strong>{{ pendingAssignments().length }}</strong><span>Pendentes</span></article><article><strong>{{ submittedAssignments().length }}</strong><span>Concluidas</span></article><article><strong>{{ assignments().length }}</strong><span>Total no seu escopo</span></article></div>
          <section class="panel" aria-labelledby="assignments-title"><div class="panel__heading"><div><p>Jornada de resposta</p><h2 id="assignments-title">Minhas avaliacoes</h2></div><span>{{ assignments().length }} atribuicoes</span></div>
            @if (!assignments().length) { <p class="state">Nenhuma avaliacao atribuida ao seu usuario.</p> }
            @else { <div class="cards">@for (assignment of assignments(); track assignment.id) { <article class="card"><div class="card__top"><div><strong>{{ assignment.revieweeName }}</strong><span>{{ relationshipLabel(assignment.relationshipType) }}</span></div><span class="badge" [class.badge--done]="assignment.status === 'submitted'">{{ assignment.status === 'submitted' ? 'Concluida' : 'Pendente' }}</span></div><p>{{ assignment.cycleTitle }} · {{ assignment.semesterLabel }}</p><dl><div><dt>Prazo</dt><dd>{{ assignment.dueDate | date:'dd/MM/yyyy' }}</dd></div><div><dt>Area avaliada</dt><dd>{{ assignment.revieweeArea || 'Institucional' }}</dd></div></dl>@if (assignment.status === 'pending') { <button type="button" (click)="openAssignment(assignment)" [disabled]="assignment.cycleStatus !== 'Liberado'">{{ assignment.cycleStatus === 'Liberado' ? 'Responder avaliacao' : 'Aguardando liberacao' }}</button> } @else { <small>Enviada em {{ assignment.submittedAt | date:'short' }}</small> }</article> }</div> }
          </section>
        }
      }
    </section>
  `,
  styles: `
    .evaluations{max-width:1100px}.evaluations__header,.error,.panel__heading,.card__top,.response__heading,.question__heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.evaluations__header p,.panel__heading p,.response__heading p{margin:0;color:#175cd3;font-size:13px;font-weight:700;text-transform:uppercase}.evaluations__header h1,.panel__heading h2,.response__heading h2{margin:4px 0}.evaluations__header span,.panel__heading>span,.state,.card p,.card small,.description,.question>small{color:#667085}button{padding:9px 12px;background:#175cd3;color:#fff;border:0;border-radius:6px;font-weight:600}.secondary{background:#fff;color:#344054;border:1px solid #98a2b3}button:disabled{opacity:.55}.error{margin-top:20px;padding:12px;color:#b42318;background:#fef3f2;border:1px solid #fecdca;border-radius:8px}.tabs{display:flex;gap:8px;margin-top:22px;border-bottom:1px solid #d0d5dd}.tabs button{border-radius:6px 6px 0 0;background:transparent;color:#475467}.tabs button.active{background:#eff4ff;color:#175cd3}.tabs span{margin-left:6px}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px}.metrics article,.panel,.card,.response,.question{background:#fff;border:1px solid #d0d5dd;border-radius:10px}.metrics article{display:grid;gap:4px;padding:18px}.metrics strong{font-size:26px}.metrics span{color:#667085}.panel,.response{margin-top:20px;padding:18px}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.card{padding:16px}.card__top>div{display:grid;gap:4px}.card__top>div span{color:#667085;font-size:14px}.badge,.required{padding:4px 8px;border-radius:999px;background:#fffaeb;color:#b54708;font-size:12px;font-weight:700}.badge--done{background:#ecfdf3;color:#027a48}.card dl{display:grid;gap:8px}.card dl div{display:grid;gap:2px}.card dt{color:#667085;font-size:12px}.card dd{margin:0}.card button{margin-top:8px}.response__heading span{color:#667085}.question{margin-top:14px;padding:16px}.question__heading small{color:#175cd3}.question h3{margin:3px 0}.question label,.summary-field{display:grid;gap:6px;margin-top:12px;color:#344054;font-weight:600}.question textarea,.summary-field textarea,.question select{box-sizing:border-box;width:100%;padding:9px 10px;border:1px solid #98a2b3;border-radius:6px;background:#fff;font:inherit}.question fieldset{display:grid;gap:8px;margin-top:12px;border:1px solid #eaecf0;border-radius:8px}.question .check{display:flex;align-items:center;margin:0;font-weight:400}.question .check input{width:auto}.summary-field{margin:16px 0}.state{margin:20px 0 4px}@media(max-width:760px){.metrics,.cards{grid-template-columns:1fr}.evaluations__header,.panel__heading,.response__heading{align-items:stretch;flex-direction:column}}
  `,
})
export class EvaluationsPageComponent implements OnInit {
  private readonly api = inject(EvaluationsService);
  private readonly auth = inject(AuthService);
  readonly activeTab = signal<'assignments' | 'cycles' | 'feedback' | 'operations' | 'questionnaires' | 'library'>('assignments');
  readonly canManageQuestionnaires = computed(() => ['admin', 'hr'].includes(this.auth.user()?.roleKey || ''));
  readonly cycles = signal<import('./evaluations.service').EvaluationCycle[]>([]);
  readonly assignments = signal<EvaluationAssignment[]>([]);
  readonly selectedDetail = signal<EvaluationAssignmentDetail | null>(null);
  readonly answers = signal<Record<string, AnswerDraft>>({});
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly pendingAssignments = computed(() => this.assignments().filter((item) => item.status === 'pending'));
  readonly submittedAssignments = computed(() => this.assignments().filter((item) => item.status === 'submitted'));
  strengthsNote = '';
  developmentNote = '';

  ngOnInit(): void { void this.load(); }
  scaleOptions() { return this.selectedDetail()?.template.scale?.length ? this.selectedDetail()!.template.scale! : [1,2,3,4,5].map((value) => ({ value, label:String(value) })); }
  answer(questionId: string): AnswerDraft { return this.answers()[questionId] || { score:3, evidenceNote:'', textValue:'', selectedOptions:[] }; }
  relationshipLabel(value: string): string { return ({ self:'Autoavaliacao', manager:'Gestor', peer:'Par', 'peer-same-area':'Colega da mesma area', leader:'Lideranca', company:'Empresa', 'cross-functional':'Transversal', 'client-internal':'Cliente interno', 'client-external':'Cliente externo' } as Record<string,string>)[value] || value; }

  async openAssignment(assignment: EvaluationAssignment): Promise<void> {
    this.errorMessage.set('');
    try { const detail = await firstValueFrom(this.api.getAssignment(assignment.id)); this.selectedDetail.set(detail); this.answers.set(Object.fromEntries(detail.template.questions.map((question) => [question.id, { score:question.inputType === 'scale' ? 3 : null, evidenceNote:'', textValue:'', selectedOptions:[] }]))); this.strengthsNote=''; this.developmentNote=''; }
    catch (error) { this.setError(error, 'Falha ao abrir a avaliacao.'); }
  }
  closeAssignment(): void { this.selectedDetail.set(null); this.answers.set({}); }
  setText(id:string, value:string):void { this.patchAnswer(id,{textValue:value}); }
  setScore(id:string, value:number):void { this.patchAnswer(id,{score:Number(value)}); }
  setEvidence(id:string, value:string):void { this.patchAnswer(id,{evidenceNote:value}); }
  toggleOption(question: EvaluationQuestion, value: string): void { const current = new Set(this.answer(question.id).selectedOptions); if (this.selectedDetail()?.template.key === 'peer-same-area') current.clear(); else if (current.has(value)) { current.delete(value); this.patchAnswer(question.id,{selectedOptions:[...current]}); return; } current.add(value); this.patchAnswer(question.id,{selectedOptions:[...current]}); }

  async submit(): Promise<void> {
    const detail = this.selectedDetail(); if (!detail) return;
    const validation = this.validate(detail); if (validation) { this.errorMessage.set(validation); return; }
    const answers: EvaluationAnswerPayload[] = detail.template.questions.map((question) => ({ questionId:question.id, score:this.answer(question.id).score, evidenceNote:this.answer(question.id).evidenceNote, textValue:this.answer(question.id).textValue, selectedOptions:this.answer(question.id).selectedOptions }));
    this.submitting.set(true); this.errorMessage.set('');
    try { await firstValueFrom(this.api.submit({ assignmentId:detail.assignment.id, answers, strengthsNote:this.strengthsNote, developmentNote:this.developmentNote })); this.closeAssignment(); await this.load(); }
    catch (error) { this.setError(error, 'Falha ao enviar a avaliacao.'); }
    finally { this.submitting.set(false); }
  }

  async load(): Promise<void> { this.loading.set(true); this.errorMessage.set(''); try { const data=await firstValueFrom(forkJoin({cycles:this.api.listCycles(),assignments:this.api.listAssignments()})); this.cycles.set(data.cycles); this.assignments.set(data.assignments); } catch(error){this.setError(error,'Falha ao carregar Avaliacoes.');} finally{this.loading.set(false);} }
  private patchAnswer(id:string, patch:Partial<AnswerDraft>):void { this.answers.update((current)=>({...current,[id]:{...this.answer(id),...patch}})); }
  private validate(detail:EvaluationAssignmentDetail):string { for(const question of detail.template.questions){if(!question.isRequired)continue;const value=this.answer(question.id);if(question.inputType==='text'&&!value.textValue.trim())return `Responda a pergunta obrigatoria: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='multi-select'&&!value.selectedOptions.length)return `Selecione pelo menos uma opcao em: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='multi-select'&&detail.template.key==='peer-same-area'&&value.selectedOptions.length!==1)return `Selecione apenas uma opcao em: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='scale'&&(!Number.isInteger(value.score)||Number(value.score)<1||Number(value.score)>5))return `Escolha uma nota valida em: ${question.dimensionTitle || question.prompt}.`;if(question.inputType==='scale'&&question.collectEvidenceOnExtreme&&(value.score===1||value.score===5)&&!value.evidenceNote.trim())return `Notas extremas exigem evidencia em: ${question.dimensionTitle || question.prompt}.`;}return ''; }
  private setError(error:unknown,fallback:string):void { this.errorMessage.set(error instanceof ApiError?error.message:fallback); }
}
