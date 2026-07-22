import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, firstValueFrom, forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { AuditEntry, AuditService } from '../audit/audit.service';
import { AuditTrailComponent } from '../audit/audit-trail.component';
import { Person, PeopleService } from '../people/people.service';
import { ApplauseEntry, ApplausePayload, ApplauseService, ApplauseStatus } from './applause.service';

@Component({
  selector: 'app-applause-page',
  imports: [DatePipe, ReactiveFormsModule, AuditTrailComponent],
  template: `
    <section class="applause" aria-labelledby="applause-title">
      <header class="applause__header"><div><p>Aplause</p><h1 id="applause-title">Reconhecimento entre pessoas</h1><span>Registre contribuicoes que fortalecem a cultura e o trabalho em equipe.</span></div><button class="secondary" type="button" (click)="load()" [disabled]="loading()">Atualizar</button></header>

      @if (errorMessage()) { <div class="error" role="alert"><span>{{ errorMessage() }}</span><button class="secondary" type="button" (click)="errorMessage.set('')">Fechar</button></div> }

      <form class="form-panel" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-heading"><div><p>{{ editing() ? 'Administracao' : 'Novo reconhecimento' }}</p><h2>{{ editing() ? 'Editar Aplause' : 'Reconhecer alguem' }}</h2></div>@if (editing()) { <button class="secondary" type="button" (click)="resetForm()">Cancelar edicao</button> }</div>
        <div class="form-grid">
          <label>Quem recebe<select formControlName="receiverPersonId"><option value="">Selecione uma pessoa</option>@for (person of receiverOptions(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }</select></label>
          <label>Contexto<select formControlName="occasion">@for (occasion of occasions; track occasion) { <option [value]="occasion">{{ occasion }}</option> }</select></label>
          <label>Tipo de reconhecimento<select formControlName="category">@for (category of categories; track category) { <option [value]="category">{{ category }}</option> }</select></label>
          @if (editing()) { <label>Status<select formControlName="status"><option value="Validado">Validado</option><option value="Em revisao">Em revisao</option><option value="Arquivado">Arquivado</option></select></label> }
          <label class="wide">Impacto gerado<input formControlName="impact" placeholder="Ex.: destravou uma entrega critica" /></label>
          <label class="wide">Descricao do reconhecimento<textarea rows="5" formControlName="contextNote" placeholder="Explique o que aconteceu e por que merece destaque."></textarea><small>Use pelo menos 20 caracteres.</small></label>
          <aside class="guidance wide" aria-live="polite">
            <strong>{{ selectedReceiver()?.name || 'Selecione quem recebera o reconhecimento' }}</strong>
            <span>{{ selectedReceiver() ? (selectedReceiver()!.area + ' · ' + (selectedReceiver()!.roleTitle || 'Cargo nao informado')) : 'O destaque sera ligado a uma pessoa do seu escopo.' }}</span>
            <p>{{ form.controls.category.value || 'Tipo de reconhecimento' }} · {{ form.controls.occasion.value || 'Contexto' }} · Diga o que a pessoa fez, qual foi o impacto concreto e por que esse comportamento merece ser repetido.</p>
          </aside>
          @if (validationMessage()) { <p class="validation wide" role="alert">{{ validationMessage() }}</p> }
        </div>
        <button type="submit" [disabled]="saving() || !receiverOptions().length">{{ saving() ? 'Salvando...' : editing() ? 'Salvar alteracoes' : 'Registrar Aplause' }}</button>
      </form>

      @if (loading()) { <p class="state">Carregando reconhecimentos...</p> }
      @else {
        <div class="metrics"><article><strong>{{ activeEntries().length }}</strong><span>Reconhecimentos ativos</span></article><article><strong>{{ receivedCount() }}</strong><span>Recebidos por voce</span></article><article><strong>{{ sentCount() }}</strong><span>Enviados por voce</span></article></div>
        <section class="panel" aria-labelledby="entries-title"><div class="panel__heading"><div><p>Historico</p><h2 id="entries-title">Reconhecimentos</h2></div><span>{{ activeEntries().length }} no seu escopo</span></div>
          @if (!activeEntries().length) { <p class="state">Nenhum reconhecimento encontrado no seu escopo.</p> }
          @else { <div class="cards">@for (entry of activeEntries(); track entry.id) { <article class="card"><div class="card__top"><div><strong>{{ entry.senderName }} → {{ entry.receiverName }}</strong><span>{{ entry.createdAt | date:'dd/MM/yyyy' }}</span></div><span class="badge">{{ entry.status }}</span></div><h3>{{ entry.category }}</h3><p class="impact">{{ entry.impact }}</p><p>{{ entry.contextNote }}</p>@if (canManage()) { <div class="card-actions"><button class="secondary" type="button" (click)="edit(entry)">Editar</button><button class="danger" type="button" (click)="archive(entry)">Arquivar</button></div> }</article> }</div> }
        </section>
      }

      @if (canViewAudit()) { <app-audit-trail [entries]="auditEntries()" title="Trilha do Aplause" subtitle="Reconhecimentos e manutencoes recentes" emptyMessage="Eventos do Aplause aparecerao aqui." /> }
    </section>
  `,
  styles: `
    .applause{max-width:1080px}.applause__header,.error,.form-heading,.panel__heading,.card__top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.applause__header p,.form-heading p,.panel__heading p{margin:0;color:#7f56d9;font-size:13px;font-weight:700;text-transform:uppercase}.applause__header h1,.form-heading h2,.panel__heading h2{margin:4px 0}.applause__header span,.panel__heading>span,.state,.card p,.card__top span,.guidance span{color:#667085}button{padding:9px 12px;background:#6941c6;color:#fff;border:0;border-radius:6px;font-weight:600}.secondary{background:#fff;color:#344054;border:1px solid #98a2b3}.danger{background:#fff;color:#b42318;border:1px solid #fda29b}button:disabled{opacity:.6}.error{margin-top:20px;padding:12px;color:#b42318;background:#fef3f2;border:1px solid #fecdca;border-radius:8px}.form-panel,.metrics article,.panel,.card,.guidance{background:#fff;border:1px solid #d0d5dd;border-radius:10px}.form-panel{margin-top:22px;padding:18px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0}.form-grid label{display:grid;gap:6px;color:#344054;font-size:14px;font-weight:600}.form-grid .wide{grid-column:1/-1}.form-grid small{color:#667085;font-weight:400}.guidance{display:grid;gap:6px;padding:14px;background:#faf5ff;border-color:#d6bbfb}.guidance strong{color:#53389e}.guidance p{margin:4px 0 0;color:#6941c6}.validation{margin:0;padding:10px 12px;color:#b42318;background:#fef3f2;border:1px solid #fecdca;border-radius:8px}input,select,textarea{box-sizing:border-box;width:100%;padding:9px 10px;border:1px solid #98a2b3;border-radius:6px;background:#fff;color:#101828;font:inherit}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px}.metrics article{display:grid;gap:4px;padding:18px}.metrics strong{font-size:26px}.metrics span{color:#667085}.panel{margin-top:20px;padding:18px}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.card{padding:16px}.card__top>div{display:grid;gap:4px}.badge{padding:4px 8px;border-radius:999px;background:#f4ebff;color:#6941c6;font-size:12px;font-weight:700}.card h3{margin:16px 0 6px}.card .impact{color:#344054;font-weight:600}.card-actions{display:flex;gap:8px;margin-top:16px}.state{margin:20px 0 4px}@media(max-width:760px){.metrics,.cards,.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.applause__header,.panel__heading{align-items:stretch;flex-direction:column}}
  `,
})
export class ApplausePageComponent implements OnInit {
  private readonly api = inject(ApplauseService);
  private readonly peopleApi = inject(PeopleService);
  private readonly auditApi = inject(AuditService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly categories = ['Colaboracao', 'Apoio em momento critico', 'Resolucao de problema', 'Postura exemplar', 'Compartilhamento de conhecimento'];
  readonly occasions = ['Projeto', 'Reuniao', 'Entrega critica', 'Suporte ao time', 'Treinamento', 'Atendimento ao cliente', 'Outro'];
  readonly entries = signal<ApplauseEntry[]>([]);
  readonly people = signal<Person[]>([]);
  readonly auditEntries = signal<AuditEntry[]>([]);
  readonly editing = signal<ApplauseEntry | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly canManage = computed(() => ['admin', 'hr', 'manager'].includes(this.auth.user()?.roleKey || ''));
  readonly canViewAudit = computed(() => ['admin', 'hr', 'manager'].includes(this.auth.user()?.roleKey || ''));
  readonly receiverOptions = computed(() => this.people().filter((person) => person.id !== this.auth.user()?.person?.id));
  readonly selectedReceiver = computed(() => this.receiverOptions().find((person) => person.id === this.form.controls.receiverPersonId.value) || null);
  readonly activeEntries = computed(() => this.entries().filter((entry) => entry.status !== 'Arquivado'));
  readonly receivedCount = computed(() => this.activeEntries().filter((entry) => entry.receiverPersonId === this.auth.user()?.person?.id).length);
  readonly sentCount = computed(() => this.activeEntries().filter((entry) => entry.senderPersonId === this.auth.user()?.person?.id).length);
  readonly form = this.fb.nonNullable.group({ receiverPersonId:['', Validators.required], occasion:['Projeto', Validators.required], category:['Colaboracao', Validators.required], impact:['', Validators.required], contextNote:['', [Validators.required, Validators.minLength(20)]], status:['Validado' as ApplauseStatus, Validators.required] });

  ngOnInit(): void { void this.load(); }
  edit(entry: ApplauseEntry): void { this.editing.set(entry); const parsed = this.parseContext(entry.contextNote); this.form.reset({ receiverPersonId:entry.receiverPersonId, occasion:parsed.occasion, category:entry.category, impact:entry.impact, contextNote:parsed.note, status:entry.status }); }
  resetForm(): void { this.editing.set(null); this.form.reset({ receiverPersonId:this.receiverOptions()[0]?.id || '', occasion:'Projeto', category:'Colaboracao', impact:'', contextNote:'', status:'Validado' }); }
  validationMessage(): string { const value = this.form.getRawValue(); if (!value.receiverPersonId) return 'Selecione quem recebera o reconhecimento.'; if (!value.impact.trim()) return 'Informe o impacto gerado.'; if (value.contextNote.trim().length < 20) return 'Descreva o reconhecimento com pelo menos 20 caracteres.'; return ''; }

  async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const payload: ApplausePayload = { receiverPersonId:value.receiverPersonId, category:value.category, impact:value.impact, contextNote:`[Contexto: ${value.occasion}] ${value.contextNote.trim()}` };
    this.saving.set(true); this.errorMessage.set('');
    try { const editing = this.editing(); if (editing) await firstValueFrom(this.api.update(editing.id, { ...payload, status:value.status })); else await firstValueFrom(this.api.create(payload)); this.resetForm(); await this.load(); }
    catch (error) { this.setError(error, 'Falha ao salvar o reconhecimento.'); }
    finally { this.saving.set(false); }
  }

  async archive(entry: ApplauseEntry): Promise<void> {
    this.saving.set(true); this.errorMessage.set('');
    try { await firstValueFrom(this.api.update(entry.id, { receiverPersonId:entry.receiverPersonId, category:entry.category, impact:entry.impact, contextNote:entry.contextNote, status:'Arquivado' })); await this.load(); }
    catch (error) { this.setError(error, 'Falha ao arquivar o reconhecimento.'); }
    finally { this.saving.set(false); }
  }

  async load(): Promise<void> {
    this.loading.set(true); this.errorMessage.set('');
    try { const auditRequest = this.canViewAudit() ? this.auditApi.list('applause').pipe(catchError(() => of([] as AuditEntry[]))) : of([] as AuditEntry[]); const data = await firstValueFrom(forkJoin({ entries:this.api.list(), people:this.peopleApi.list(), audit:auditRequest })); this.entries.set(data.entries); this.people.set(data.people); this.auditEntries.set(data.audit); if (!this.editing() && !this.form.controls.receiverPersonId.value) this.form.controls.receiverPersonId.setValue(this.receiverOptions()[0]?.id || ''); }
    catch (error) { this.setError(error, 'Falha ao carregar o Aplause.'); }
    finally { this.loading.set(false); }
  }

  private parseContext(value: string): { occasion: string; note: string } { const match = value.match(/^\[(?:Contexto|Ocasiao):\s*([^\]]+)\]\s*(.*)$/s); return match ? { occasion:match[1], note:match[2] } : { occasion:'Outro', note:value }; }
  private setError(error: unknown, fallback: string): void { this.errorMessage.set(error instanceof ApiError ? error.message : fallback); }
}
