import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { Area, AreasService } from '../areas/areas.service';
import { AuditService, AuditEntry } from '../audit/audit.service';
import { AuditTrailComponent } from '../audit/audit-trail.component';
import { EmploymentType, Person, PersonPayload, PeopleService, WorkMode } from './people.service';

@Component({
  selector: 'app-people-page',
  imports: [ReactiveFormsModule, AuditTrailComponent],
  template: `
    <section class="people" aria-labelledby="people-title">
      <header class="people__header">
        <div>
          <p class="people__eyebrow">Cadastro</p>
          <h1 id="people-title">Pessoas</h1>
          <p>Organize a estrutura, a hierarquia e os vinculos da organizacao.</p>
        </div>
        <button type="button" (click)="startCreate()">Nova pessoa</button>
      </header>

      @if (errorMessage()) { <p class="people__error" role="alert">{{ errorMessage() }}</p> }

      <section class="people__modules" aria-label="Modulos de cadastro">
        <article>
          <div><span>Cadastro de pessoas</span><strong>{{ people().length }}</strong><small>Pessoas no escopo</small></div>
          <button type="button" class="people__secondary" (click)="startCreate()">Abrir cadastro de pessoas</button>
        </article>
        <article>
          <div><span>Estrutura organizacional</span><strong>{{ areas().length }}</strong><small>Areas cadastradas</small></div>
          <a class="people__link" href="/app/people/areas">Gerenciar areas</a>
        </article>
      </section>

      <section class="people__steps" aria-label="Passo a passo do cadastro">
        <article [class.people__step--done]="areas().length > 0"><strong>1. Area base</strong><span>{{ areas().length ? 'Ha pelo menos uma area disponivel para iniciar o cadastro.' : 'Cadastre uma area antes de criar pessoas.' }}</span></article>
        <article [class.people__step--done]="form.controls.name.value.trim()"><strong>2. Pessoa preenchida</strong><span>Informe nome, cargo, vinculo e unidade.</span></article>
        <article [class.people__step--done]="form.controls.managerPersonId.value || form.controls.isAreaManager.value === 'yes'"><strong>3. Estrutura pronta</strong><span>Defina gestor direto ou lideranca da area.</span></article>
        <article [class.people__step--done]="people().length > 0"><strong>4. Acesso</strong><span>Crie usuario depois que a estrutura da pessoa estiver pronta.</span></article>
      </section>

      @if (isEditing() && !editingPerson()) {
        <form class="people__form" [formGroup]="form" (ngSubmit)="save()">
          <label>Nome <input formControlName="name" autocomplete="name" /></label>
          <label>Cargo <input formControlName="roleTitle" autocomplete="organization-title" /></label>
          <label>
            Area
            <select formControlName="area">
              <option value="" disabled>Selecione uma area</option>
              @for (area of areas(); track area.id) { <option [value]="area.name">{{ area.name }}</option> }
            </select>
          </label>
          <label>
            Gestor direto
            <select formControlName="managerPersonId">
              <option value="">Sem gestor direto definido</option>
              @for (manager of managerOptions(); track manager.id) {
                <option [value]="manager.id">{{ manager.name }} · {{ manager.area }}</option>
              }
            </select>
          </label>
          <label>
            Lider da area
            <select formControlName="isAreaManager">
              <option value="no">Nao</option>
              <option value="yes">Sim</option>
            </select>
          </label>
          <label>Unidade de trabalho <input formControlName="workUnit" autocomplete="organization" /></label>
          <label>
            Modalidade
            <select formControlName="workMode">
              <option value="onsite">Presencial</option>
              <option value="hybrid">Hibrido</option>
              <option value="remote">100% Home Office</option>
            </select>
          </label>
          <label>
            Vinculo
            <select formControlName="employmentType">
              <option value="internal">Interno</option>
              <option value="consultant">Consultor</option>
            </select>
          </label>
          @if (validationMessage()) { <p class="people__validation" role="alert">{{ validationMessage() }}</p> }
          @if (leadershipWarning()) { <p class="people__warning">{{ leadershipWarning() }}</p> }
          <div class="people__form-actions">
            <button type="button" class="people__secondary" (click)="cancelEdit()">Cancelar</button>
            <button type="submit" [disabled]="isSaving() || areas().length === 0">
              {{ isSaving() ? 'Salvando...' : editingPerson() ? 'Salvar alteracoes' : 'Cadastrar pessoa' }}
            </button>
          </div>
          @if (areas().length === 0) { <p class="people__validation">Cadastre uma area antes de cadastrar pessoas.</p> }
        </form>
      }

      @if (isLoading()) {
        <p class="people__state">Carregando estrutura de pessoas...</p>
      } @else if (people().length === 0) {
        <p class="people__state">Nenhuma pessoa cadastrada no seu escopo.</p>
      } @else {
        <div class="people__table-wrap">
          <table>
            <thead><tr><th>Pessoa</th><th>Area e cargo</th><th>Hierarquia</th><th>Vinculo</th><th><span class="visually-hidden">Acoes</span></th></tr></thead>
            <tbody>
              @for (person of people(); track person.id) {
                <tr>
                  <td><strong>{{ person.name }}</strong><small>{{ person.workUnit || '-' }} · {{ workModeLabel(person.workMode) }}</small></td>
                  <td>{{ person.area }}<small>{{ person.roleTitle }}</small></td>
                  <td>Gestor: {{ person.managerName || '-' }}<small>Lider da area: {{ person.areaManagerName || '-' }}</small></td>
                  <td>{{ employmentTypeLabel(person.employmentType) }}</td>
                  <td><button type="button" class="people__secondary" (click)="startEdit(person)">Editar</button></td>
                </tr>
                @if (editingPerson()?.id === person.id) {
                  <tr class="people__inline-row">
                    <td colspan="5">
                      <form class="people__form people__inline-form" [formGroup]="form" (ngSubmit)="save()">
                        <label>Nome <input formControlName="name" autocomplete="name" /></label>
                        <label>Cargo <input formControlName="roleTitle" autocomplete="organization-title" /></label>
                        <label>
                          Area
                          <select formControlName="area">
                            <option value="" disabled>Selecione uma area</option>
                            @for (area of areas(); track area.id) { <option [value]="area.name">{{ area.name }}</option> }
                          </select>
                        </label>
                        <label>
                          Gestor direto
                          <select formControlName="managerPersonId">
                            <option value="">Sem gestor direto definido</option>
                            @for (manager of managerOptions(); track manager.id) {
                              <option [value]="manager.id">{{ manager.name }} · {{ manager.area }}</option>
                            }
                          </select>
                        </label>
                        <label>
                          Lider da area
                          <select formControlName="isAreaManager">
                            <option value="no">Nao</option>
                            <option value="yes">Sim</option>
                          </select>
                        </label>
                        <label>Unidade de trabalho <input formControlName="workUnit" autocomplete="organization" /></label>
                        <label>
                          Modalidade
                          <select formControlName="workMode">
                            <option value="onsite">Presencial</option>
                            <option value="hybrid">Hibrido</option>
                            <option value="remote">100% Home Office</option>
                          </select>
                        </label>
                        <label>
                          Vinculo
                          <select formControlName="employmentType">
                            <option value="internal">Interno</option>
                            <option value="consultant">Consultor</option>
                          </select>
                        </label>
                        @if (validationMessage()) { <p class="people__validation" role="alert">{{ validationMessage() }}</p> }
                        @if (leadershipWarning()) { <p class="people__warning">{{ leadershipWarning() }}</p> }
                        <div class="people__form-actions">
                          <button type="button" class="people__secondary" (click)="cancelEdit()">Cancelar</button>
                          <button type="submit" [disabled]="isSaving()">{{ isSaving() ? 'Salvando...' : 'Salvar vinculos' }}</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
      <app-audit-trail [entries]="auditEntries()" title="Trilha da estrutura" subtitle="Criacoes e atualizacoes recentes de cadastro" emptyMessage="Eventos de pessoas aparecerao aqui." />
    </section>
  `,
  styles: `
    .people { max-width: 1120px; } .people__header { display:flex; align-items:start; justify-content:space-between; gap:24px; }
    .people__eyebrow { margin:0 0 8px; color:#84adff; font-size:13px; font-weight:700; text-transform:uppercase; } h1 { margin:0; font-size:24px; }
    .people__header p:not(.people__eyebrow), .people__state, .people__modules small, .people__steps span { color:#98a2b3; } button { min-height:36px; padding:0 12px; color:#fff; font-weight:600; cursor:pointer; background:#dc2626; border:0; border-radius:6px; }
    button:disabled { cursor:wait; background:#7f1d1d; } .people__secondary { color:#e2e8f0; background:#111827; border:1px solid #334155; }
    .people__modules, .people__steps { display:grid; gap:14px; margin-top:24px; }
    .people__modules { grid-template-columns:repeat(2, minmax(0, 1fr)); }
    .people__steps { grid-template-columns:repeat(4, minmax(0, 1fr)); }
    .people__modules article, .people__steps article, .people__error, .people__form, .people__table-wrap { color:#f8fafc; background:#111827; border:1px solid #253044; border-radius:8px; }
    .people__modules article, .people__steps article { display:grid; gap:12px; padding:16px; }
    .people__modules span { display:block; color:#84adff; font-size:12px; font-weight:700; text-transform:uppercase; }
    .people__modules strong { display:block; margin-top:6px; font-size:24px; }
    .people__link { display:inline-flex; align-items:center; justify-content:center; min-height:36px; padding:0 12px; color:#e2e8f0; font-weight:600; text-decoration:none; background:#111827; border:1px solid #334155; border-radius:6px; }
    .people__step--done { border-color:#1d4ed8 !important; background:#0f172a !important; }
    .people__error, .people__form, .people__table-wrap { margin-top:24px; }
    .people__error, .people__validation, .people__warning { padding:12px; } .people__error, .people__validation { color:#fecaca; background:#450a0a; border:1px solid #7f1d1d; border-radius:6px; }
    .people__warning { color:#fed7aa; background:#431407; border:1px solid #7c2d12; border-radius:6px; }
    .people__form { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; padding:20px; } label { display:grid; gap:6px; color:#cbd5e1; font-weight:600; }
    input, select { box-sizing:border-box; width:100%; min-height:40px; padding:8px 10px; color:#f8fafc; background:#0b1220; border:1px solid #334155; border-radius:6px; font:inherit; }
    .people__validation, .people__warning, .people__form-actions { grid-column:1 / -1; margin:0; } .people__form-actions { display:flex; gap:8px; justify-content:end; }
    .people__state { margin:24px 0; } .people__table-wrap { overflow-x:auto; } table { width:100%; border-collapse:collapse; } th, td { padding:14px 16px; text-align:left; vertical-align:top; border-bottom:1px solid #eaecf0; }
    th { color:#98a2b3; font-size:12px; text-transform:uppercase; } th, td { border-bottom-color:#253044; } td strong, td small { display:block; } td small { margin-top:4px; color:#98a2b3; } td:last-child, th:last-child { width:1%; white-space:nowrap; }
    .people__inline-row td { padding:0 16px 16px; background:#0f172a; } .people__inline-form { margin-top:0; padding:16px; background:#0b1220; }
    .visually-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
    @media (max-width:960px) { .people__steps { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
    @media (max-width:720px) { .people__header { align-items:stretch; flex-direction:column; } .people__modules, .people__steps, .people__form { grid-template-columns:1fr; } }
  `,
})
export class PeoplePageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly areasService = inject(AreasService);
  private readonly peopleService = inject(PeopleService);
  private readonly auditService = inject(AuditService);
  private readonly formBuilder = inject(FormBuilder);

  readonly areas = signal<Area[]>([]);
  readonly people = signal<Person[]>([]);
  readonly auditEntries = signal<AuditEntry[]>([]);
  readonly editingPerson = signal<Person | null>(null);
  readonly errorMessage = signal('');
  readonly isEditing = signal(false);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    roleTitle: ['', [Validators.required, Validators.maxLength(160)]],
    area: ['', Validators.required],
    workUnit: ['', [Validators.required, Validators.maxLength(160)]],
    workMode: ['hybrid' as WorkMode],
    managerPersonId: [''],
    isAreaManager: ['no' as 'yes' | 'no'],
    employmentType: ['internal' as EmploymentType],
  });
  readonly managerOptions = computed(() => {
    const editingId = this.editingPerson()?.id;
    const roleKey = this.auth.user()?.roleKey;
    if (roleKey === 'manager') {
      const ownPersonId = this.auth.user()?.person?.id;
      return this.people().filter((person) => person.id === ownPersonId && person.id !== editingId);
    }
    return this.people().filter((person) => person.id !== editingId);
  });
  validationMessage(): string {
    const value = this.form.getRawValue();
    if (!value.name.trim()) return 'Informe o nome da pessoa.';
    if (!value.roleTitle.trim()) return 'Informe o cargo da pessoa.';
    if (!value.area) return 'Selecione a area da pessoa.';
    if (!value.workUnit.trim()) return 'Informe a unidade de trabalho.';
    if (value.managerPersonId && value.managerPersonId === this.editingPerson()?.id) return 'Uma pessoa nao pode ser gestora direta de si mesma.';
    const duplicate = this.people().some((person) =>
      person.id !== this.editingPerson()?.id &&
      person.name.trim().toLocaleLowerCase() === value.name.trim().toLocaleLowerCase() &&
      person.area === value.area &&
      person.roleTitle.trim().toLocaleLowerCase() === value.roleTitle.trim().toLocaleLowerCase(),
    );
    return duplicate ? 'Ja existe uma pessoa com mesmo nome, area e cargo.' : '';
  }

  leadershipWarning(): string {
    const value = this.form.getRawValue();
    if (value.isAreaManager !== 'yes') return '';
    const selectedArea = this.areas().find((area) => area.name === value.area);
    const currentLeaderId = selectedArea?.managerPersonId;
    if (currentLeaderId && currentLeaderId !== this.editingPerson()?.id) {
      return `Salvar vai substituir ${selectedArea?.managerName || 'a lideranca atual'} como lider da area.`;
    }
    return '';
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
    this.startCreate();
  }

  startCreate(): void {
    this.errorMessage.set('');
    this.editingPerson.set(null);
    this.form.reset({ name: '', roleTitle: '', area: this.areas()[0]?.name ?? '', workUnit: '', workMode: 'hybrid', managerPersonId: this.defaultManagerId(), isAreaManager: 'no', employmentType: 'internal' });
    this.isEditing.set(true);
  }

  startEdit(person: Person): void {
    this.errorMessage.set('');
    this.editingPerson.set(person);
    this.form.reset({ name: person.name, roleTitle: person.roleTitle, area: person.area, workUnit: person.workUnit || '', workMode: person.workMode || 'hybrid', managerPersonId: person.managerPersonId || '', isAreaManager: person.areaManagerPersonId === person.id ? 'yes' : 'no', employmentType: person.employmentType });
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editingPerson.set(null);
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.validationMessage()) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set('');
    this.isSaving.set(true);
    try {
      const value = this.form.getRawValue();
      const payload: PersonPayload = { ...value, managerPersonId: value.managerPersonId || null };
      const person = this.editingPerson();
      if (person) await firstValueFrom(this.peopleService.update(person.id, payload));
      else await firstValueFrom(this.peopleService.create(payload));
      this.cancelEdit();
      await this.loadData();
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : 'Nao foi possivel salvar a pessoa.');
    } finally { this.isSaving.set(false); }
  }

  workModeLabel(value: WorkMode | null): string {
    return value === 'onsite' ? 'Presencial' : value === 'remote' ? '100% Home Office' : 'Hibrido';
  }

  employmentTypeLabel(value: EmploymentType): string { return value === 'consultant' ? 'Consultor' : 'Interno'; }

  private defaultManagerId(): string {
    return this.auth.user()?.roleKey === 'manager' ? this.auth.user()?.person?.id || '' : '';
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true); this.errorMessage.set('');
    try {
      const { areas, people, audit } = await firstValueFrom(forkJoin({ areas: this.areasService.list(), people: this.peopleService.list(), audit: this.auditService.list('registry') }));
      this.areas.set(areas); this.people.set(people); this.auditEntries.set(audit);
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : 'Nao foi possivel carregar a estrutura de pessoas.');
    } finally { this.isLoading.set(false); }
  }
}
