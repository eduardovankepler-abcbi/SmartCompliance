import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, forkJoin } from 'rxjs';

import { ApiError } from '../../core/http/api-error';
import { Person, PeopleService } from '../people/people.service';
import {
  EvaluationCycle,
  EvaluationLibrary,
  EvaluationQuestion,
  EvaluationQuestionnaire,
  EvaluationQuestionnaireQuestion,
  EvaluationsService,
  QuestionnairePayload,
  QuestionnaireQuestionPayload,
} from './evaluations.service';

const relationshipOptions: Array<EvaluationQuestionnaire['relationshipType']> = [
  'manager',
  'self',
  'leader-self',
  'leader',
  'peer-same-area',
  'cross-functional',
];

type QuestionFormValue = {
  promptText: string;
  dimensionKey: string;
  dimensionTitle: string;
  sortOrder: number;
  inputType: 'scale' | 'text' | 'multi-select';
  optionsText: string;
  isRequired: boolean;
  collectEvidenceOnExtreme: boolean;
  isSensitive: boolean;
};

@Component({
  selector: 'app-evaluation-questionnaires-panel',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel" aria-labelledby="questionnaires-title">
      <header>
        <div>
          <p>Questionarios individuais</p>
          <h2 id="questionnaires-title">Rascunhos e publicacao</h2>
          <span>Crie questionarios por ciclo, pessoa e relacionamento.</span>
        </div>
        <button type="button" (click)="openQuestionnaireForm()">Novo questionario</button>
      </header>

      @if(errorMessage()){<div class="error" role="alert">{{errorMessage()}}</div>}

      @if(showQuestionnaireForm()){
        <form [formGroup]="questionnaireForm" (ngSubmit)="saveQuestionnaire()">
          <div class="form-head">
            <h3>{{editingQuestionnaireId()?'Editar questionario':'Novo questionario'}}</h3>
            <button class="secondary" type="button" (click)="closeQuestionnaireForm()">Cancelar</button>
          </div>
          <div class="grid">
            <label>Ciclo<select formControlName="cycleId">@for(cycle of cycles();track cycle.id){<option [value]="cycle.id">{{cycle.title}}</option>}</select></label>
            <label>Colaborador<select formControlName="revieweePersonId">@for(person of people();track person.id){<option [value]="person.id">{{person.name}}</option>}</select></label>
            <label>Relacionamento<select formControlName="relationshipType">@for(option of relationshipOptions; track option){<option [value]="option">{{relationshipLabel(option)}}</option>}</select></label>
            <label>Visibilidade<select formControlName="visibilityLevel"><option value="restricted">Restrita</option><option value="shared">Compartilhada</option></select></label>
            <label class="wide">Titulo<input formControlName="title" /></label>
            <label class="wide">Descricao<textarea rows="3" formControlName="description"></textarea></label>
          </div>
          <button type="submit" [disabled]="saving()">Salvar questionario</button>
        </form>
      }

      @if(loading()){
        <p class="state">Carregando questionarios...</p>
      } @else {
        <div class="filters">
          <label>Status<select [value]="statusFilter()" (change)="setStatusFilter($any($event.target).value)"><option value="all">Todos</option><option value="draft">Rascunhos</option><option value="published">Publicados</option><option value="archived">Arquivados</option></select></label>
          <label>Pessoa<select [value]="personFilter()" (change)="setPersonFilter($any($event.target).value)"><option value="all">Todas</option>@for(person of people();track person.id){<option [value]="person.id">{{person.name}}</option>}</select></label>
        </div>
        <div class="layout">
          <div class="list">
            @for(item of filtered();track item.id){
              <button type="button" [class.active]="selected()?.id===item.id" (click)="selectQuestionnaire(item)">
                <strong>{{item.title}}</strong>
                <span>{{personName(item.revieweePersonId)}} · {{relationshipLabel(item.relationshipType)}}</span>
                <small>{{item.status}} · {{coverageLabel(item)}}</small>
              </button>
            } @empty {
              <p class="state">Nenhum questionario encontrado.</p>
            }
          </div>

          @if(selected();as item){
            <article class="detail">
              <div class="detail-head">
                <div>
                  <small>{{item.status}}</small>
                  <h3>{{item.title}}</h3>
                  <p>{{personName(item.revieweePersonId)}} · {{cycleName(item.cycleId)}}</p>
                </div>
                <div class="actions">
                  @if(item.status==='draft'){
                    <button class="secondary" type="button" (click)="openQuestionnaireForm(item)">Editar</button>
                    <button type="button" [disabled]="!canPublish(item)" (click)="publish(item)">Publicar</button>
                  }
                  @if(item.status!=='archived'){<button class="danger" type="button" (click)="archive(item)">Arquivar</button>}
                </div>
              </div>

              <div class="rule">
                <article><span>Atual</span><strong>{{item.questionCount}}</strong></article>
                <article><span>Minimo</span><strong>{{questionRule(item).min}}</strong></article>
                <article><span>Recomendado</span><strong>{{questionRule(item).recommended}}</strong></article>
                <article><span>Regra</span><strong>{{questionRule(item).strict ? 'Estrita' : 'Flexivel'}}</strong></article>
              </div>

              @if(item.status==='draft'){
                <section class="copy-tools">
                  <div>
                    <strong>Preencher a partir de base existente</strong>
                    <p>Carregue a biblioteca padrao da modalidade ou duplique outro questionario do mesmo tipo.</p>
                  </div>
                  <div class="copy-grid">
                    <button type="button" class="secondary" (click)="loadFromLibrary(item)">Carregar da biblioteca base</button>
                    <label>Duplicar de<select [value]="cloneSourceQuestionnaireId()" (change)="cloneSourceQuestionnaireId.set($any($event.target).value)"><option value="">Selecione</option>@for(source of cloneCandidates(item);track source.id){<option [value]="source.id">{{source.title}}</option>}</select></label>
                    <button type="button" class="secondary" [disabled]="!cloneSourceQuestionnaireId()" (click)="cloneFromSelected(item)">Duplicar perguntas</button>
                  </div>
                </section>
                <button class="add" type="button" (click)="openQuestionForm()">Adicionar pergunta</button>
              }

              @if(showQuestionForm()){
                <form [formGroup]="questionForm" (ngSubmit)="saveQuestion()">
                  <div class="form-head">
                    <h3>{{editingQuestionId()?'Editar pergunta':'Nova pergunta'}}</h3>
                    <button class="secondary" type="button" (click)="closeQuestionForm()">Cancelar</button>
                  </div>
                  <div class="grid">
                    <label>Chave da dimensao<input formControlName="dimensionKey" /></label>
                    <label>Titulo da dimensao<input formControlName="dimensionTitle" /></label>
                    <label class="wide">Enunciado<textarea rows="3" formControlName="promptText"></textarea></label>
                    <label>Tipo<select formControlName="inputType"><option value="scale">Escala</option><option value="text">Texto aberto ate 200 caracteres</option><option value="multi-select">Multipla escolha</option></select></label>
                    <label>Ordem<input type="number" min="1" formControlName="sortOrder" /></label>
                    <label class="wide">Opcoes, separadas por |<input formControlName="optionsText" /></label>
                    <label class="check"><input type="checkbox" formControlName="isRequired"/> Obrigatoria</label>
                    <label class="check"><input type="checkbox" formControlName="collectEvidenceOnExtreme"/> Evidencia em extremos</label>
                    <label class="check"><input type="checkbox" formControlName="isSensitive"/> Sensivel</label>
                  </div>
                  <button type="submit">Salvar pergunta</button>
                </form>
              }

              <div class="questions">
                @for(question of item.questions;track question.id;let index=$index){
                  <div>
                    <span>{{index+1}}</span>
                    <section>
                      <strong>{{question.dimensionTitle}}</strong>
                      <p>{{question.promptText}}</p>
                      <small>{{inputTypeLabel(question.inputType)}}</small>
                    </section>
                    @if(item.status==='draft'){
                      <div class="actions">
                        <button class="secondary" type="button" [disabled]="index===0" (click)="moveQuestion(index,-1)">Subir</button>
                        <button class="secondary" type="button" [disabled]="index===item.questions.length-1" (click)="moveQuestion(index,1)">Descer</button>
                        <button class="secondary" type="button" (click)="editQuestion(question)">Editar</button>
                        <button class="danger" type="button" (click)="removeQuestion(question)">Remover</button>
                      </div>
                    }
                  </div>
                } @empty {
                  <p class="state">Adicione perguntas ou carregue a biblioteca base para preparar a publicacao.</p>
                }
              </div>
              <p class="publication">Publicacao: {{coverageLabel(item)}}. Perguntas abertas aceitam ate 200 caracteres na resposta.</p>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `.panel{margin-top:20px;padding:18px;background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:10px}.panel>header,.form-head,.detail-head,.questions>div{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.panel header p{margin:0;color:var(--abc-blue);font-size:13px;font-weight:700;text-transform:uppercase}.panel h2{margin:4px 0}.panel header span,.state,.list span,.list small,.detail p,.questions p,.questions small,.copy-tools p{color:var(--abc-text-muted)}button{padding:9px 12px;background:var(--abc-blue);color:var(--abc-on-blue);border:0;border-radius:var(--abc-radius);font-weight:700}.secondary{background:var(--abc-surface);color:var(--abc-text);border:1px solid var(--abc-border)}.danger{background:var(--abc-surface);color:var(--abc-danger);border:1px solid color-mix(in srgb, var(--abc-danger) 35%, var(--abc-border))}button:disabled{opacity:.5}.error{margin-top:14px;padding:10px;background:color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface));color:var(--abc-danger)}form{margin-top:16px;padding:16px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:8px}.form-head h3{margin:0}.grid,.filters{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.grid label,.filters label,.copy-grid label{display:grid;gap:5px}.grid .wide{grid-column:1/-1}.grid .check{display:flex;align-items:center}.grid .check input{width:auto}input,select,textarea{box-sizing:border-box;width:100%;padding:9px;border:1px solid var(--abc-border);border-radius:var(--abc-radius);font:inherit}.filters{max-width:600px}.layout{display:grid;grid-template-columns:300px 1fr;gap:16px}.list{display:grid;align-content:start;gap:8px}.list button{display:grid;gap:4px;text-align:left;background:var(--abc-surface);color:var(--abc-text);border:1px solid var(--abc-border)}.list button.active{border-color:var(--abc-blue);background:color-mix(in srgb, var(--abc-blue) 8%, var(--abc-surface))}.detail{padding:16px;border:1px solid var(--abc-border);border-radius:8px}.detail h3{margin:4px 0}.actions{display:flex;flex-wrap:wrap;gap:6px}.add{margin:12px 0}.rule{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.rule article{padding:10px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:8px}.rule span{display:block;color:var(--abc-text-muted);font-size:12px}.rule strong{display:block;margin-top:4px}.copy-tools{display:grid;gap:12px;margin-top:14px;padding:12px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:8px}.copy-tools p{margin:4px 0 0}.copy-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr) minmax(0,1fr);gap:10px;align-items:end}.questions{display:grid;gap:8px;margin-top:14px}.questions>div{padding:12px;border:1px solid var(--abc-border);border-radius:8px}.questions>div>span{display:grid;place-items:center;min-width:28px;height:28px;border-radius:50%;background:color-mix(in srgb, var(--abc-blue) 8%, var(--abc-surface));color:var(--abc-blue)}.questions section{flex:1}.questions p{margin:5px 0}.publication{padding:10px;background:var(--abc-surface-muted)}@media(max-width:850px){.layout,.grid,.filters,.rule,.copy-grid{grid-template-columns:1fr}.grid .wide{grid-column:auto}.panel>header,.detail-head,.questions>div{flex-direction:column}}`,
})
export class EvaluationQuestionnairesPanelComponent implements OnInit {
  private readonly api = inject(EvaluationsService);
  private readonly peopleApi = inject(PeopleService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly relationshipOptions = relationshipOptions;
  readonly questionnaires = signal<EvaluationQuestionnaire[]>([]);
  readonly cycles = signal<EvaluationCycle[]>([]);
  readonly people = signal<Person[]>([]);
  readonly library = signal<EvaluationLibrary | null>(null);
  readonly selected = signal<EvaluationQuestionnaire | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly statusFilter = signal('all');
  readonly personFilter = signal('all');
  readonly showQuestionnaireForm = signal(false);
  readonly editingQuestionnaireId = signal('');
  readonly showQuestionForm = signal(false);
  readonly editingQuestionId = signal('');
  readonly cloneSourceQuestionnaireId = signal('');
  readonly filtered = computed(() =>
    this.questionnaires().filter(
      (q) =>
        (this.statusFilter() === 'all' || q.status === this.statusFilter()) &&
        (this.personFilter() === 'all' || q.revieweePersonId === this.personFilter()),
    ),
  );
  readonly questionnaireForm = this.fb.nonNullable.group({
    cycleId: ['', Validators.required],
    revieweePersonId: ['', Validators.required],
    relationshipType: ['self' as EvaluationQuestionnaire['relationshipType'], Validators.required],
    title: ['', Validators.required],
    description: [''],
    visibilityLevel: ['restricted'],
  });
  readonly questionForm = this.fb.nonNullable.group({
    dimensionKey: ['', Validators.required],
    dimensionTitle: ['', Validators.required],
    promptText: ['', Validators.required],
    inputType: ['scale' as 'scale' | 'text' | 'multi-select'],
    sortOrder: [1, [Validators.required, Validators.min(1)]],
    optionsText: [''],
    isRequired: [true],
    collectEvidenceOnExtreme: [false],
    isSensitive: [false],
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.questionnaires().length) this.applyRouteSelection();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.statusFilter.set(params.get('status') || 'all');
      this.personFilter.set(params.get('person') || 'all');
    });
    void this.load();
  }

  personName(id: string): string {
    return this.people().find((p) => p.id === id)?.name || id;
  }

  cycleName(id: string): string {
    return this.cycles().find((c) => c.id === id)?.title || id;
  }

  relationshipLabel(value: string): string {
    return (
      {
        manager: 'Lider sobre colaborador',
        self: 'Autoavaliacao profissional',
        'leader-self': 'Autoavaliacao do lider',
        leader: 'Colaborador sobre lider',
        'peer-same-area': 'Colega da mesma area',
        'cross-functional': 'Colega de outro setor',
      } as Record<string, string>
    )[value] || value;
  }

  inputTypeLabel(value: string): string {
    return value === 'text' ? 'Pergunta aberta ate 200 caracteres' : value === 'multi-select' ? 'Multipla escolha' : 'Escala';
  }

  questionRule(item: EvaluationQuestionnaire): { min: number; recommended: number; strict: boolean } {
    const template = this.libraryTemplate(item.relationshipType);
    const rule = template?.policy?.questionRule;
    return {
      min: Number(rule?.minQuestionCount || 1),
      recommended: Number(rule?.recommendedQuestionCount || template?.questions?.length || item.questionCount || 1),
      strict: Boolean(rule?.strictQuestionCount),
    };
  }

  coverageLabel(item: EvaluationQuestionnaire): string {
    const rule = this.questionRule(item);
    return `${item.questionCount}/${rule.recommended} perguntas${rule.strict ? ' obrigatorias' : ' recomendadas'}`;
  }

  canPublish(q: EvaluationQuestionnaire): boolean {
    return q.status === 'draft' && q.questionCount >= this.questionRule(q).min;
  }

  cloneCandidates(item: EvaluationQuestionnaire): EvaluationQuestionnaire[] {
    return this.questionnaires().filter(
      (candidate) =>
        candidate.id !== item.id &&
        candidate.relationshipType === item.relationshipType &&
        candidate.questions.length > 0,
    );
  }

  selectQuestionnaire(q: EvaluationQuestionnaire): void {
    this.selected.set(q);
    this.cloneSourceQuestionnaireId.set('');
    void this.navigateTo(q.id);
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
    void this.navigateTo(this.selected()?.id || '');
  }

  setPersonFilter(value: string): void {
    this.personFilter.set(value);
    void this.navigateTo(this.selected()?.id || '');
  }

  openQuestionnaireForm(q: EvaluationQuestionnaire | null = null): void {
    this.editingQuestionnaireId.set(q?.id || '');
    this.questionnaireForm.reset({
      cycleId: q?.cycleId || this.cycles()[0]?.id || '',
      revieweePersonId: q?.revieweePersonId || this.people()[0]?.id || '',
      relationshipType: q?.relationshipType || 'self',
      title: q?.title || '',
      description: q?.description || '',
      visibilityLevel: q?.visibilityLevel || 'restricted',
    });
    this.showQuestionnaireForm.set(true);
  }

  closeQuestionnaireForm(): void {
    this.showQuestionnaireForm.set(false);
    this.editingQuestionnaireId.set('');
  }

  async saveQuestionnaire(): Promise<void> {
    if (this.questionnaireForm.invalid) {
      this.questionnaireForm.markAllAsTouched();
      return;
    }
    const value = this.questionnaireForm.getRawValue();
    const current = this.selected();
    const payload: QuestionnairePayload = { ...value, sourceLibraryId: current?.sourceLibraryId || null };
    await this.mutate(async () => {
      const updated = this.editingQuestionnaireId()
        ? await firstValueFrom(this.api.updateQuestionnaire(this.editingQuestionnaireId(), payload))
        : await firstValueFrom(this.api.createQuestionnaire(payload));
      this.closeQuestionnaireForm();
      await this.load(updated.id);
      await this.navigateTo(updated.id);
    });
  }

  openQuestionForm(): void {
    const q = this.selected();
    this.editingQuestionId.set('');
    this.questionForm.reset({
      dimensionKey: '',
      dimensionTitle: '',
      promptText: '',
      inputType: 'scale',
      sortOrder: (q?.questions.length || 0) + 1,
      optionsText: '',
      isRequired: true,
      collectEvidenceOnExtreme: false,
      isSensitive: false,
    });
    this.showQuestionForm.set(true);
  }

  closeQuestionForm(): void {
    this.showQuestionForm.set(false);
    this.editingQuestionId.set('');
  }

  editQuestion(q: EvaluationQuestionnaireQuestion): void {
    this.editingQuestionId.set(q.id);
    this.questionForm.reset({
      dimensionKey: q.dimensionKey || '',
      dimensionTitle: q.dimensionTitle,
      promptText: q.promptText,
      inputType: q.inputType,
      sortOrder: q.sortOrder,
      optionsText: (q.options || []).map((o) => o.label).join(' | '),
      isRequired: q.isRequired !== false,
      collectEvidenceOnExtreme: Boolean(q.collectEvidenceOnExtreme),
      isSensitive: Boolean(q.isSensitive),
    });
    this.showQuestionForm.set(true);
  }

  async saveQuestion(): Promise<void> {
    const selected = this.selected();
    if (!selected || this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }
    const value = this.questionForm.getRawValue();
    const payload = this.questionPayloadFromForm(value);
    if (payload.inputType === 'multi-select' && !payload.options.length) {
      this.errorMessage.set('Perguntas de multipla escolha exigem ao menos uma opcao.');
      return;
    }
    await this.mutate(async () => {
      const updated = this.editingQuestionId()
        ? await firstValueFrom(this.api.updateQuestionnaireQuestion(this.editingQuestionId(), payload))
        : await firstValueFrom(this.api.addQuestionnaireQuestion(selected.id, payload));
      this.replace(updated);
      this.closeQuestionForm();
    });
  }

  async removeQuestion(q: EvaluationQuestionnaireQuestion): Promise<void> {
    if (!confirm('Remover esta pergunta do questionario?')) return;
    await this.mutate(async () => this.replace(await firstValueFrom(this.api.deleteQuestionnaireQuestion(q.id))));
  }

  async moveQuestion(index: number, delta: number): Promise<void> {
    const selected = this.selected();
    if (!selected) return;
    const items = selected.questions.map((q) => q.id);
    [items[index], items[index + delta]] = [items[index + delta], items[index]];
    await this.mutate(async () =>
      this.replace(
        await firstValueFrom(
          this.api.reorderQuestionnaireQuestions(
            selected.id,
            items.map((questionId, i) => ({ questionId, sortOrder: i + 1 })),
          ),
        ),
      ),
    );
  }

  async publish(q: EvaluationQuestionnaire): Promise<void> {
    if (!confirm('Publicar este questionario e gerar a atribuicao correspondente?')) return;
    await this.mutate(async () => this.replace(await firstValueFrom(this.api.publishQuestionnaire(q.id))));
  }

  async archive(q: EvaluationQuestionnaire): Promise<void> {
    if (!confirm('Arquivar este questionario?')) return;
    await this.mutate(async () => this.replace(await firstValueFrom(this.api.archiveQuestionnaire(q.id))));
  }

  async loadFromLibrary(item: EvaluationQuestionnaire): Promise<void> {
    const template = this.libraryTemplate(item.relationshipType);
    if (!template?.questions.length) {
      this.errorMessage.set('Nao foi encontrada biblioteca base para esta modalidade.');
      return;
    }
    if (item.questions.length && !confirm('Isso substituirá as perguntas atuais do rascunho. Continuar?')) return;
    await this.replaceQuestions(item, template.questions);
  }

  async cloneFromSelected(item: EvaluationQuestionnaire): Promise<void> {
    const source = this.questionnaires().find((candidate) => candidate.id === this.cloneSourceQuestionnaireId());
    if (!source?.questions.length) {
      this.errorMessage.set('Selecione um questionario de origem com perguntas.');
      return;
    }
    if (item.questions.length && !confirm('Isso substituirá as perguntas atuais do rascunho. Continuar?')) return;
    await this.replaceQuestions(item, source.questions);
  }

  private async replaceQuestions(
    item: EvaluationQuestionnaire,
    sourceQuestions: Array<EvaluationQuestion | EvaluationQuestionnaireQuestion>,
  ): Promise<void> {
    if (item.status !== 'draft') {
      this.errorMessage.set('Somente questionarios em rascunho podem ser preenchidos.');
      return;
    }
    await this.mutate(async () => {
      let updated = item;
      for (const question of item.questions) {
        updated = await firstValueFrom(this.api.deleteQuestionnaireQuestion(question.id));
      }
      for (const [index, question] of sourceQuestions.entries()) {
        updated = await firstValueFrom(
          this.api.addQuestionnaireQuestion(updated.id, this.questionPayloadFromSource(question, index + 1)),
        );
      }
      this.replace(updated);
      await this.load(updated.id);
    });
  }

  private async load(selectedId = ''): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(
        forkJoin({
          questionnaires: this.api.listQuestionnaires(),
          cycles: this.api.listCycles(),
          people: this.peopleApi.list(),
          library: this.api.getLibrary(),
        }),
      );
      this.questionnaires.set(data.questionnaires);
      this.cycles.set(data.cycles);
      this.people.set(data.people);
      this.library.set(data.library);
      const routeId = this.route.snapshot.paramMap.get('detail') || '';
      this.selected.set(
        data.questionnaires.find((q) => q.id === (selectedId || routeId || this.selected()?.id)) ||
          data.questionnaires[0] ||
          null,
      );
      if (!routeId && this.selected()) await this.navigateTo(this.selected()!.id, true);
    } catch (e) {
      this.setError(e);
    } finally {
      this.loading.set(false);
    }
  }

  private applyRouteSelection(): void {
    const id = this.route.snapshot.paramMap.get('detail') || '';
    if (!id) return;
    const item = this.questionnaires().find((q) => q.id === id);
    if (item) this.selected.set(item);
  }

  private navigateTo(id: string, replaceUrl = false): Promise<boolean> {
    const queryParams: { status?: string; person?: string } = {};
    if (this.statusFilter() !== 'all') queryParams.status = this.statusFilter();
    if (this.personFilter() !== 'all') queryParams.person = this.personFilter();
    return this.router.navigate(
      ['/app/evaluations', this.route.snapshot.paramMap.get('module') || 'company', 'questionnaires', id],
      { queryParams, replaceUrl },
    );
  }

  private libraryTemplate(relationshipType: string): import('./evaluations.service').EvaluationTemplate | undefined {
    return (this.library()?.questionGroups || []).find(
      (template) => template.key === relationshipType || template.relationshipType === relationshipType,
    );
  }

  private questionPayloadFromForm(value: QuestionFormValue): QuestionnaireQuestionPayload {
    const options = this.options(value.optionsText);
    return {
      sectionKey: value.dimensionKey,
      sectionTitle: value.dimensionTitle,
      sectionDescription: '',
      dimensionKey: value.dimensionKey,
      dimensionTitle: value.dimensionTitle,
      promptText: value.promptText,
      helperText: '',
      inputType: value.inputType,
      scaleProfile: value.inputType === 'scale' ? 'performance' : '',
      visibility: 'restricted',
      sortOrder: Number(value.sortOrder),
      isRequired: value.isRequired,
      collectEvidenceOnExtreme: value.collectEvidenceOnExtreme,
      isSensitive: value.isSensitive,
      options,
    };
  }

  private questionPayloadFromSource(
    question: EvaluationQuestion | EvaluationQuestionnaireQuestion,
    sortOrder: number,
  ): QuestionnaireQuestionPayload {
    return {
      sectionKey: question.sectionKey || question.dimensionKey || `secao_${sortOrder}`,
      sectionTitle: question.sectionTitle || question.dimensionTitle || `Pergunta ${sortOrder}`,
      sectionDescription: question.sectionDescription || '',
      dimensionKey: question.dimensionKey || `dimensao_${sortOrder}`,
      dimensionTitle: question.dimensionTitle || `Pergunta ${sortOrder}`,
      promptText: 'promptText' in question ? question.promptText : question.prompt,
      helperText: question.helperText || '',
      inputType: question.inputType,
      scaleProfile:
        question.inputType === 'scale'
          ? ('scaleProfile' in question ? String(question.scaleProfile || 'performance') : 'performance')
          : '',
      visibility: question.visibility || 'restricted',
      sortOrder,
      isRequired: question.isRequired !== false,
      collectEvidenceOnExtreme: Boolean(question.collectEvidenceOnExtreme),
      isSensitive: Boolean(question.isSensitive),
      options: question.inputType === 'multi-select' ? question.options || [] : [],
    };
  }

  private replace(q: EvaluationQuestionnaire): void {
    this.questionnaires.update((items) => items.map((item) => (item.id === q.id ? q : item)));
    this.selected.set(q);
  }

  private async mutate(action: () => Promise<void>): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      await action();
    } catch (e) {
      this.setError(e);
    } finally {
      this.saving.set(false);
    }
  }

  private options(value: string): Array<{ value: string; label: string }> {
    return value
      .split('|')
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, index) => ({ value: `option_${index + 1}`, label }));
  }

  private setError(e: unknown): void {
    this.errorMessage.set(e instanceof ApiError ? e.message : 'Falha ao atualizar questionarios.');
  }
}
