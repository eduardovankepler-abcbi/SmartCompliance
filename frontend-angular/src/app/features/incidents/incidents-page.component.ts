import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/http/api-error';
import { Area, AreasService } from '../areas/areas.service';
import { Person, PeopleService } from '../people/people.service';
import { AuditEntry, AuditService } from '../audit/audit.service';
import { AuditTrailComponent } from '../audit/audit-trail.component';
import { IncidentCreateFormComponent } from './incident-create-form.component';
import { IncidentTreatmentFormComponent } from './incident-treatment-form.component';
import { Incident, IncidentAnonymity, IncidentsService, UpdateIncidentPayload } from './incidents.service';

@Component({
  selector: 'app-incidents-page',
  imports: [DatePipe, ReactiveFormsModule, IncidentCreateFormComponent, IncidentTreatmentFormComponent, AuditTrailComponent],
  template: `
    <section class="incidents" aria-labelledby="incidents-title">
      <header class="incidents__header"><div><p>Compliance</p><h1 id="incidents-title">Incidentes</h1><span>Registre relatos e acompanhe a fila dentro do seu escopo.</span></div><button (click)="openCreate()">Novo relato</button></header>
      @if (errorMessage()) { <div class="error" role="alert"><span>{{ errorMessage() }}</span><button class="secondary" (click)="load()">Tentar novamente</button></div> }
      @if (creating()) { <app-incident-create-form [form]="form" [areas]="areas()" [people]="people()" [saving]="saving()" (submitted)="create()" (cancelled)="cancelCreate()" /> }
      @if (loading()) { <p class="state">Carregando fila...</p> }
      @else if (!incidents().length) { <p class="state">Nenhum incidente no seu escopo.</p> }
      @else { <section class="queue" aria-label="Fila de tratamento"><header><h2>Fila de tratamento</h2><span>Casos visiveis para RH, administracao e compliance</span></header>@for (incident of incidents(); track incident.id) {
        <article><div class="row"><strong>{{ incident.title }}</strong><span>{{ incident.status }}</span></div><p>{{ incident.category }} · {{ incident.classification }}</p><p>{{ incident.description }}</p><small>Area responsavel: {{ incident.responsibleArea }} · Responsavel: {{ incident.assignedTo }} · Abertura: {{ incident.createdAt | date:'short' }}</small>
          @if (canTreat()) { <button class="secondary" (click)="editing.set(incident)">Tratar</button> }
          @if (editing()?.id === incident.id) { <app-incident-treatment-form [incident]="incident" [areas]="areas()" [people]="people()" (saved)="update(incident, $event)" (cancelled)="editing.set(null)" /> }
        </article> }</section> }
      <app-audit-trail [entries]="auditEntries()" title="Trilha de Compliance" subtitle="Relatos e tratamentos recentes" emptyMessage="Eventos de incidentes aparecerao aqui." />
    </section>
  `,
  styles: `.incidents{max-width:1040px}.incidents__header,.row,.error,.queue header{display:flex;align-items:start;justify-content:space-between;gap:16px}.incidents__header p{margin:0;color:var(--abc-blue);font-weight:700;text-transform:uppercase;font-size:13px}h1{margin:4px 0}.incidents__header span,.state,article p,article small,.queue header span{color:var(--abc-text-muted)}button{padding:9px 12px;background:var(--abc-blue);color:var(--abc-on-blue);border:0;border-radius:var(--abc-radius);font-weight:700}.secondary{background:var(--abc-surface);color:var(--abc-text);border:1px solid var(--abc-border)}.error{margin-top:20px;padding:12px;color:var(--abc-danger);background:color-mix(in srgb, var(--abc-danger) 8%, var(--abc-surface));border:1px solid color-mix(in srgb, var(--abc-danger) 24%, var(--abc-border));border-radius:8px}.queue{display:grid;gap:14px;margin-top:16px;padding:16px;background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:8px}.queue h2{margin:0;color:var(--abc-text);font-size:18px}.queue article{padding:14px;background:var(--abc-surface);border:1px solid var(--abc-border);border-radius:8px;color:var(--abc-text);box-shadow:0 8px 24px color-mix(in srgb, var(--abc-navy) 6%, transparent)}.queue article p{margin:10px 0;color:var(--abc-text)}.queue article small{display:block;color:var(--abc-text-muted)}.queue article .row span{padding:5px 10px;color:color-mix(in srgb, var(--abc-danger) 28%, var(--abc-surface));background:color-mix(in srgb, var(--abc-danger) 55%, var(--abc-navy));border-radius:999px;font-size:12px}.queue article>.secondary{margin-top:12px;background:var(--abc-surface);color:var(--abc-text);border-color:var(--abc-border)}.state{margin-top:24px}@media(max-width:720px){.incidents__header,.row,.error,.queue header{display:grid}}`,
})
export class IncidentsPageComponent implements OnInit {
  private readonly api = inject(IncidentsService);
  private readonly areasApi = inject(AreasService);
  private readonly peopleApi = inject(PeopleService);
  private readonly auditApi = inject(AuditService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly incidents = signal<Incident[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly people = signal<Person[]>([]);
  readonly auditEntries = signal<AuditEntry[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly editing = signal<Incident | null>(null);
  readonly errorMessage = signal('');
  readonly canTreat = computed(() => ['admin', 'hr', 'compliance'].includes(this.auth.user()?.roleKey || ''));
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required], description: ['', Validators.required],
    category: ['Conduta Impropria', Validators.required], classification: ['Nao classificado', Validators.required],
    anonymity: ['anonymous' as IncidentAnonymity], reporterLabel: [''],
    responsibleArea: ['', Validators.required], assignedPersonId: [''],
  });

  async ngOnInit(): Promise<void> {
    await this.load();
    this.openCreate();
  }
  openCreate(): void {
    const area = this.areas()[0];
    this.form.reset({ title:'', description:'', category:'Conduta Impropria', classification:'Nao classificado', anonymity:'anonymous', reporterLabel:'', responsibleArea:area?.name || '', assignedPersonId:area?.managerPersonId || '' });
    this.creating.set(true);
  }
  cancelCreate(): void { this.creating.set(false); this.form.reset(); }
  async create(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.errorMessage.set('');
    try { const value = this.form.getRawValue(); await firstValueFrom(this.api.create({ ...value, assignedPersonId:value.assignedPersonId || null })); this.cancelCreate(); await this.load(); }
    catch (error) { this.errorMessage.set(error instanceof ApiError ? error.message : 'Falha ao registrar relato.'); }
    finally { this.saving.set(false); }
  }
  async update(incident: Incident, payload: UpdateIncidentPayload): Promise<void> {
    this.errorMessage.set('');
    try { await firstValueFrom(this.api.update(incident.id, payload)); this.editing.set(null); await this.load(); }
    catch (error) { this.errorMessage.set(error instanceof ApiError ? error.message : 'Falha ao atualizar incidente.'); }
  }
  async load(): Promise<void> {
    this.loading.set(true); this.errorMessage.set('');
    try { const data = await firstValueFrom(forkJoin({ incidents:this.api.list(), areas:this.areasApi.list(), people:this.peopleApi.list(), audit:this.auditApi.list('incident') })); this.incidents.set(data.incidents); this.areas.set(data.areas); this.people.set(data.people); this.auditEntries.set(data.audit); }
    catch (error) { this.errorMessage.set(error instanceof ApiError ? error.message : 'Falha ao carregar incidentes.'); }
    finally { this.loading.set(false); }
  }
}
