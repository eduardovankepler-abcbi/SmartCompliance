import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import {
  CustomEvaluationLibrary,
  CustomLibraryDraft,
  EvaluationLibrary,
  EvaluationQuestion,
  EvaluationsService,
  LibraryQuestionPayload,
} from './evaluations.service';

interface QuestionCategory {
  key: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-evaluation-library-panel',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel" aria-labelledby="library-title">
      <header>
        <div>
          <p>Banco global</p>
          <h2 id="library-title">Biblioteca de perguntas</h2>
          <span>{{ library()?.manualLibrary?.questionCount || 0 }} perguntas editaveis</span>
        </div>
        @if (canEdit()) { <button type="button" (click)="openForm()">Nova pergunta</button> }
      </header>

      @if (errorMessage()) { <div class="error" role="alert">{{ errorMessage() }}</div> }
      @if (loading()) {
        <p class="state">Carregando biblioteca...</p>
      } @else {
        <section class="chooser" aria-labelledby="relationship-title">
          <strong id="relationship-title">Modalidade</strong>
          <div class="button-row">
            @for (group of groups(); track group.key) {
              <button type="button" class="secondary" [class.active]="relationshipType() === group.key" (click)="selectRelationship(group.key)">
                {{ relationshipLabel(group.key) }} <span>{{ group.questions.length }}</span>
              </button>
            }
          </div>
        </section>

        <section class="chooser" aria-labelledby="category-title">
          <strong id="category-title">Categorias</strong>
          <div class="button-row">
            @for (category of categories(); track category.key) {
              <button type="button" class="secondary" [class.active]="activeCategory() === category.key" (click)="selectCategory(category.key)">
                {{ category.label }} <span>{{ category.count }}</span>
              </button>
            }
          </div>
        </section>

        @if (showForm()) {
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-head">
              <h3>{{ editingId() ? 'Editar pergunta' : 'Nova pergunta' }}</h3>
              <button class="secondary" type="button" (click)="closeForm()">Cancelar</button>
            </div>
            <div class="grid">
              <label>Chave da categoria<input formControlName="sectionKey" /></label>
              <label>Categoria<input formControlName="sectionTitle" /></label>
              <label>Chave da dimensao<input formControlName="dimensionKey" /></label>
              <label>Titulo da dimensao<input formControlName="dimensionTitle" /></label>
              <label class="wide">Enunciado<textarea rows="3" formControlName="prompt"></textarea></label>
              <label>Tipo<select formControlName="inputType"><option value="scale">Escala</option><option value="text">Texto</option><option value="multi-select">Multipla escolha</option></select></label>
              <label>Visibilidade<select formControlName="visibility"><option value="restricted">Restrita</option><option value="shared">Compartilhada</option><option value="private">Privada</option><option value="confidential">Confidencial</option></select></label>
              <label>Ordem<input type="number" min="1" formControlName="sortOrder" /></label>
              <label class="wide">Opcoes, separadas por |<input formControlName="optionsText" /></label>
              <label class="check"><input type="checkbox" formControlName="isRequired" /> Obrigatoria</label>
              <label class="check"><input type="checkbox" formControlName="collectEvidenceOnExtreme" /> Evidencia em extremos</label>
              <label class="check"><input type="checkbox" formControlName="isSensitive" /> Sensivel</label>
            </div>
            <button type="submit" [disabled]="saving()">Salvar pergunta</button>
          </form>
        }

        <div class="questions">
          @for (group of visibleQuestionGroups(); track group.key) {
            <section class="question-group">
              <div class="question-group__head">
                <div>
                  <small>Categoria</small>
                  <h3>{{ group.label }}</h3>
                </div>
                <span>{{ group.questions.length }} perguntas</span>
              </div>
              @for (question of group.questions; track question.id) {
                <article>
                  <div>
                    <small>#{{ question.sortOrder || questionIndex(question) + 1 }} · {{ question.inputType }}</small>
                    <strong>{{ question.dimensionTitle }}</strong>
                    <p>{{ question.prompt }}</p>
                  </div>
                  @if (canEdit()) {
                    <div class="actions">
                      <button class="secondary" type="button" [disabled]="questionIndex(question) === 0" (click)="move(questionIndex(question), -1)">Subir</button>
                      <button class="secondary" type="button" [disabled]="questionIndex(question) === selectedQuestions().length - 1" (click)="move(questionIndex(question), 1)">Descer</button>
                      <button class="secondary" type="button" (click)="edit(question)">Editar</button>
                      <button class="danger" type="button" (click)="remove(question)">Remover</button>
                    </div>
                  }
                </article>
              }
            </section>
          } @empty {
            <p class="state">Nenhuma pergunta nesta modalidade.</p>
          }
        </div>

        @if (canManageCustom()) {
          <section class="custom">
            <div class="custom__head">
              <div>
                <h3>Bibliotecas customizadas</h3>
                <span>Importe CSV/XLSX, valide o rascunho e publique quando estiver pronto.</span>
              </div>
              <button class="secondary" type="button" (click)="downloadTemplate()">Baixar template XLSX</button>
            </div>
            <div class="upload">
              <label>Arquivo CSV ou XLSX<input type="file" accept=".csv,.xlsx" (change)="chooseFile($any($event.target).files?.[0])" /></label>
              <button type="button" [disabled]="!selectedFile() || saving()" (click)="importFile()">Importar e validar</button>
            </div>
            @if(draft();as item){
              <article class="draft">
                <strong>{{item.fileName}}</strong>
                <span>{{item.summary.templates || item.templates.length}} templates · {{item.summary.questions}} perguntas</span>
                @if(item.errors.length){
                  <div class="import-errors"><b>{{item.errors.length}} erro(s) de validacao</b>@for(error of item.errors;track error){<p>{{error}}</p>}</div>
                } @else {
                  <form [formGroup]="publishForm" (ngSubmit)="publish()">
                    <label>Nome da biblioteca<input formControlName="name" /></label>
                    <label>Descricao<textarea rows="2" formControlName="description"></textarea></label>
                    <button type="submit" [disabled]="saving()">Publicar biblioteca</button>
                  </form>
                }
              </article>
            }
          </section>
          <section class="custom">
            <h3>Publicadas</h3>
            <div class="published">
              @for(item of customLibraries();track item.id){
                <article>
                  @if(editingLibraryId()===item.id){
                    <form [formGroup]="editLibraryForm" (ngSubmit)="updateLibrary(item)">
                      <label>Nome<input formControlName="name" /></label>
                      <label>Descricao<textarea rows="2" formControlName="description"></textarea></label>
                      <div class="actions">
                        <button type="submit" [disabled]="saving()">Salvar biblioteca</button>
                        <button class="secondary" type="button" (click)="editingLibraryId.set('')">Cancelar</button>
                      </div>
                    </form>
                  } @else {
                    <strong>{{item.name}}</strong>
                    <p>{{item.description || 'Sem descricao.'}}</p>
                    <small>{{item.templateCount}} templates · {{item.questionCount}} perguntas · {{item.sourceFileName || 'edicao manual'}}</small>
                    <button class="secondary" type="button" (click)="editCustomLibrary(item)">Editar</button>
                  }
                </article>
              } @empty {
                <p class="state">Nenhuma biblioteca customizada publicada.</p>
              }
            </div>
          </section>
        }
      }
    </section>
  `,
  styles: `.panel{margin-top:20px;padding:18px;background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:10px}.panel>header,.form-head,.question-group__head,.questions article,.custom__head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.panel header p{margin:0;color:var(--abc-blue);font-size:13px;font-weight:700;text-transform:uppercase}.panel h2{margin:4px 0}.panel header span,.custom__head span,.state,article p,article small,.question-group__head span,.question-group__head small{color:var(--abc-text-muted)}button{padding:9px 12px;background:var(--abc-blue);color:var(--abc-on-blue);border:0;border-radius:var(--abc-radius);font-weight:700}.secondary{background:var(--abc-surface);color:var(--abc-text);border:1px solid var(--abc-border)}.secondary.active{background:var(--abc-blue);border-color:var(--abc-blue);color:var(--abc-on-blue)}.danger{background:var(--abc-surface);color:var(--abc-danger);border:1px solid color-mix(in srgb, var(--abc-danger) 35%, var(--abc-border))}.chooser{display:grid;gap:8px;margin-top:18px}.button-row{display:flex;flex-wrap:wrap;gap:8px}.button-row span{margin-left:6px;opacity:.75}select,input,textarea{box-sizing:border-box;width:100%;padding:9px;border:1px solid var(--abc-border);border-radius:var(--abc-radius);font:inherit}form{margin-top:18px;padding:16px;background:var(--abc-surface-muted);border:1px solid var(--abc-border);border-radius:8px}.form-head h3,.custom h3,.question-group h3{margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.grid label,.upload label,.draft label,.published label{display:grid;gap:5px}.grid .wide{grid-column:1/-1}.grid .check{display:flex;align-items:center}.grid .check input{width:auto}.questions,.published{display:grid;gap:14px;margin-top:18px}.question-group{display:grid;gap:10px;padding:14px;background:color-mix(in srgb, var(--abc-blue) 3%, var(--abc-surface));border:1px solid var(--abc-border);border-radius:8px}.questions article,.published article,.draft{padding:14px;border:1px solid var(--abc-border);border-radius:8px;background:var(--abc-surface)}.questions article>div:first-child{display:grid;gap:5px}.questions p{margin:0}.actions,.upload{display:flex;flex-wrap:wrap;gap:6px}.error{margin-top:14px;padding:10px;background:color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface));color:var(--abc-danger)}.custom{margin-top:28px;padding-top:18px;border-top:1px solid var(--abc-border)}.upload{align-items:end;margin-top:14px}.upload label{min-width:260px}.draft{display:grid;gap:8px;margin-top:14px;background:var(--abc-surface-muted)}.import-errors{padding:10px;background:color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface));color:var(--abc-danger)}.import-errors p{margin:5px 0}.published article{display:grid;gap:7px}.published article button{width:max-content}@media(max-width:760px){.grid{grid-template-columns:1fr}.grid .wide{grid-column:auto}.questions article,.panel>header,.custom__head,.question-group__head{flex-direction:column}}`,
})
export class EvaluationLibraryPanelComponent implements OnInit {
  private readonly api = inject(EvaluationsService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly library = signal<EvaluationLibrary | null>(null);
  readonly relationshipType = signal('manager');
  readonly activeCategory = signal('all');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly draft = signal<CustomLibraryDraft | null>(null);
  readonly editingLibraryId = signal('');

  readonly canEdit = computed(() => this.auth.user()?.roleKey === 'hr');
  readonly canManageCustom = computed(() => ['admin', 'hr'].includes(this.auth.user()?.roleKey || ''));
  readonly groups = computed(() => this.library()?.questionGroups || []);
  readonly selectedQuestions = computed(() => this.groups().find((g) => g.key === this.relationshipType())?.questions || []);
  readonly customLibraries = computed(() => this.library()?.customLibraries || []);
  readonly categories = computed(() => this.buildCategories(this.selectedQuestions()));
  readonly visibleQuestionGroups = computed(() => {
    const questions = this.selectedQuestions();
    const selectedCategory = this.activeCategory();
    const categories =
      selectedCategory === 'all'
        ? this.categories().filter((category) => category.key !== 'all')
        : this.categories().filter((category) => category.key === selectedCategory);

    return categories.map((category) => ({
      ...category,
      questions: questions.filter((question) => this.categoryKey(question) === category.key),
    }));
  });

  readonly form = this.fb.nonNullable.group({
    sectionKey: [''],
    sectionTitle: ['', Validators.required],
    dimensionKey: ['', Validators.required],
    dimensionTitle: ['', Validators.required],
    prompt: ['', Validators.required],
    inputType: ['scale' as EvaluationQuestion['inputType']],
    visibility: ['restricted'],
    sortOrder: [1, [Validators.required, Validators.min(1)]],
    optionsText: [''],
    isRequired: [true],
    collectEvidenceOnExtreme: [false],
    isSensitive: [false],
  });
  readonly publishForm = this.fb.nonNullable.group({ name: ['', Validators.required], description: [''] });
  readonly editLibraryForm = this.fb.nonNullable.group({ name: ['', Validators.required], description: [''] });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.applyRouteRelationship());
    void this.load();
  }

  relationshipLabel(v: string): string {
    return (
      {
        manager: 'Lider sobre colaborador',
        self: 'Autoavaliacao profissional',
        'leader-self': 'Autoavaliacao do lider',
        'peer-same-area': 'Colega da mesma area',
        peer: 'Par',
        leader: 'Colaborador sobre lider',
        company: 'Empresa',
        'cross-functional': 'Colega de outro setor',
      } as Record<string, string>
    )[v] || v;
  }

  selectRelationship(v: string): void {
    this.relationshipType.set(v);
    this.activeCategory.set('all');
    this.closeForm();
    void this.navigateToRelationship(v);
  }

  selectCategory(categoryKey: string): void {
    this.activeCategory.set(categoryKey);
  }

  questionIndex(question: EvaluationQuestion): number {
    return this.selectedQuestions().findIndex((item) => item.id === question.id);
  }

  openForm(): void {
    const category = this.categories().find((item) => item.key === this.activeCategory());
    this.editingId.set('');
    this.form.reset({
      sectionKey: category?.key === 'all' ? '' : category?.key || '',
      sectionTitle: category?.key === 'all' ? '' : category?.label || '',
      dimensionKey: '',
      dimensionTitle: '',
      prompt: '',
      inputType: 'scale',
      visibility: 'restricted',
      sortOrder: this.selectedQuestions().length + 1,
      optionsText: '',
      isRequired: true,
      collectEvidenceOnExtreme: false,
      isSensitive: false,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set('');
  }

  edit(q: EvaluationQuestion): void {
    this.editingId.set(q.id);
    this.activeCategory.set(this.categoryKey(q));
    this.form.reset({
      sectionKey: q.sectionKey || this.categoryKey(q),
      sectionTitle: q.sectionTitle || 'Sem categoria',
      dimensionKey: q.dimensionKey || '',
      dimensionTitle: q.dimensionTitle,
      prompt: q.prompt,
      inputType: q.inputType,
      visibility: q.visibility || 'restricted',
      sortOrder: q.sortOrder || 1,
      optionsText: (q.options || []).map((o) => o.label).join(' | '),
      isRequired: q.isRequired !== false,
      collectEvidenceOnExtreme: Boolean(q.collectEvidenceOnExtreme),
      isSensitive: Boolean(q.isSensitive),
    });
    this.showForm.set(true);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.inputType === 'multi-select' && !this.options(v.optionsText).length) {
      this.errorMessage.set('Perguntas de multipla escolha exigem ao menos uma opcao.');
      return;
    }
    const payload: LibraryQuestionPayload = {
      relationshipType: this.relationshipType(),
      sectionKey: v.sectionKey || v.dimensionKey,
      sectionTitle: v.sectionTitle || v.dimensionTitle,
      sectionDescription: '',
      dimensionKey: v.dimensionKey,
      dimensionTitle: v.dimensionTitle,
      prompt: v.prompt,
      helperText: '',
      inputType: v.inputType,
      visibility: v.visibility,
      sortOrder: Number(v.sortOrder),
      isRequired: v.isRequired,
      collectEvidenceOnExtreme: v.collectEvidenceOnExtreme,
      isSensitive: v.isSensitive,
      options: this.options(v.optionsText),
    };
    await this.mutate(() =>
      this.editingId() ? this.api.updateLibraryQuestion(this.editingId(), payload) : this.api.createLibraryQuestion(payload),
    );
    this.activeCategory.set(this.categoryKey(payload));
    this.closeForm();
  }

  chooseFile(file: File | undefined): void {
    this.selectedFile.set(file || null);
    this.draft.set(null);
  }

  async downloadTemplate(): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const blob = await firstValueFrom(this.api.downloadCustomLibraryTemplate());
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'biblioteca-avaliacoes-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      this.setError(e);
    } finally {
      this.saving.set(false);
    }
  }

  async importFile(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;
    await this.mutateCustom(async () => {
      const draft = await firstValueFrom(this.api.importCustomLibrary(file));
      this.draft.set(draft);
      this.publishForm.reset({ name: file.name.replace(/\.[^.]+$/, ''), description: '' });
    });
  }

  async publish(): Promise<void> {
    const draft = this.draft();
    if (!draft || this.publishForm.invalid) return;
    await this.mutateCustom(async () => {
      await firstValueFrom(this.api.publishCustomLibrary({ draftId: draft.id, ...this.publishForm.getRawValue() }));
      this.draft.set(null);
      this.selectedFile.set(null);
      await this.load();
    });
  }

  editCustomLibrary(library: CustomEvaluationLibrary): void {
    this.editingLibraryId.set(library.id);
    this.editLibraryForm.reset({ name: library.name, description: library.description || '' });
  }

  async updateLibrary(library: CustomEvaluationLibrary): Promise<void> {
    if (this.editLibraryForm.invalid) return;
    await this.mutateCustom(async () => {
      await firstValueFrom(this.api.updateCustomLibrary(library.id, { ...this.editLibraryForm.getRawValue(), templates: library.templates }));
      this.editingLibraryId.set('');
      await this.load();
    });
  }

  async remove(q: EvaluationQuestion): Promise<void> {
    if (!confirm('Remover esta pergunta da biblioteca?')) return;
    await this.mutate(() => this.api.deleteLibraryQuestion(q.id));
  }

  async move(index: number, delta: number): Promise<void> {
    if (index < 0) return;
    const ids = this.selectedQuestions().map((q) => q.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    await this.mutate(() => this.api.reorderLibraryQuestions(this.relationshipType(), ids));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.api.getLibrary());
      this.library.set(data);
      const routeKey = this.route.snapshot.paramMap.get('detail') || '';
      if (data.questionGroups.some((g) => g.key === routeKey)) this.relationshipType.set(routeKey);
      else if (!data.questionGroups.some((g) => g.key === this.relationshipType())) this.relationshipType.set(data.questionGroups[0]?.key || 'manager');
      this.ensureActiveCategoryExists();
      if (!routeKey && this.relationshipType()) await this.navigateToRelationship(this.relationshipType(), true);
    } catch (e) {
      this.setError(e);
    } finally {
      this.loading.set(false);
    }
  }

  private applyRouteRelationship(): void {
    const key = this.route.snapshot.paramMap.get('detail') || '';
    if (!key || !this.groups().some((g) => g.key === key)) return;
    this.relationshipType.set(key);
    this.activeCategory.set('all');
    this.closeForm();
  }

  private navigateToRelationship(key: string, replaceUrl = false): Promise<boolean> {
    return this.router.navigate(['/app/evaluations', this.route.snapshot.paramMap.get('module') || 'company', 'library', key], { replaceUrl });
  }

  private async mutate(call: () => ReturnType<EvaluationsService['getLibrary']>): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      this.library.set(await firstValueFrom(call()));
      this.ensureActiveCategoryExists();
    } catch (e) {
      this.setError(e);
    } finally {
      this.saving.set(false);
    }
  }

  private async mutateCustom(call: () => Promise<void>): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      await call();
      this.ensureActiveCategoryExists();
    } catch (e) {
      this.setError(e);
    } finally {
      this.saving.set(false);
    }
  }

  private buildCategories(questions: EvaluationQuestion[]): QuestionCategory[] {
    const categories = new Map<string, QuestionCategory>();
    for (const question of questions) {
      const key = this.categoryKey(question);
      const label = question.sectionTitle || 'Sem categoria';
      const current = categories.get(key);
      categories.set(key, { key, label, count: (current?.count || 0) + 1 });
    }
    return [{ key: 'all', label: 'Todas', count: questions.length }, ...categories.values()];
  }

  private categoryKey(question: Pick<EvaluationQuestion, 'sectionKey' | 'sectionTitle' | 'dimensionKey'>): string {
    return question.sectionKey || this.slug(question.sectionTitle || question.dimensionKey || 'sem-categoria');
  }

  private ensureActiveCategoryExists(): void {
    if (!this.categories().some((category) => category.key === this.activeCategory())) {
      this.activeCategory.set('all');
    }
  }

  private slug(value: string): string {
    return (
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'sem-categoria'
    );
  }

  private options(value: string): Array<{ value: string; label: string }> {
    return value
      .split('|')
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, index) => ({ value: `option_${index + 1}`, label }));
  }

  private setError(e: unknown): void {
    this.errorMessage.set(e instanceof ApiError ? e.message : 'Falha ao atualizar a biblioteca.');
  }
}
