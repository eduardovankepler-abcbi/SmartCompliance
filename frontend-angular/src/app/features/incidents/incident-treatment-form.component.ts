import { Component, effect, input, output, signal } from '@angular/core';

import { Area } from '../areas/areas.service';
import { Person } from '../people/people.service';
import { Incident, IncidentStatus, UpdateIncidentPayload } from './incidents.service';

@Component({
  selector: 'app-incident-treatment-form',
  template: `
    <div class="treatment">
      <label>Classificacao <select [value]="incident().classification" #classification>@for (item of classifications; track item) { <option [value]="item">{{ item }}</option> }</select></label>
      <label>Status <select [value]="incident().status" #status>@for (item of statuses; track item) { <option [value]="item">{{ item }}</option> }</select></label>
      <label>Area responsavel <select [value]="selectedArea()" #area (change)="changeArea(area.value, assignee)">@for (item of areas(); track item.id) { <option [value]="item.name">{{ item.name }}</option> }</select></label>
      <label>Responsavel designado <select [value]="incident().assignedPersonId || ''" #assignee><option value="">Nao definido</option>@for (person of peopleForArea(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }</select></label>
      <label class="wide">Motivo de conclusao <textarea rows="3" [value]="incident().closureNote" #closureNote></textarea></label>
      <div class="actions"><button class="secondary" (click)="cancelled.emit()">Cancelar</button><button (click)="save(classification.value, status.value, area.value, assignee.value, closureNote.value)">Salvar tratamento</button></div>
    </div>
  `,
  styles: `.treatment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px;padding:14px;background:var(--abc-surface-muted);border-radius:var(--abc-radius)}label{display:grid;gap:5px}select,textarea{padding:8px}.wide,.actions{grid-column:1/-1}.actions{display:flex;justify-content:end;gap:8px}button{padding:8px 12px;background:var(--abc-blue);color:var(--abc-on-blue);border:0;border-radius:var(--abc-radius);font-weight:700}.secondary{background:var(--abc-surface);color:var(--abc-text);border:1px solid var(--abc-border)}`,
})
export class IncidentTreatmentFormComponent {
  readonly incident = input.required<Incident>();
  readonly areas = input<readonly Area[]>([]);
  readonly people = input<readonly Person[]>([]);
  readonly saved = output<UpdateIncidentPayload>();
  readonly cancelled = output<void>();
  readonly selectedArea = signal('');
  readonly classifications = ['Conduta e Relacionamento', 'Integridade e Etica', 'Assedio e Respeito', 'Fraude e Desvio', 'Processos e Controles', 'Nao classificado'];
  readonly statuses: IncidentStatus[] = ['Em triagem', 'Em apuracao', 'Aguardando retorno', 'Concluido'];

  constructor() { effect(() => this.selectedArea.set(this.incident().responsibleArea)); }

  peopleForArea(): Person[] { return this.people().filter((person) => person.area === this.selectedArea()); }
  changeArea(areaName: string, assignee: HTMLSelectElement): void {
    this.selectedArea.set(areaName);
    const area = this.areas().find((item) => item.name === areaName);
    assignee.value = area?.managerPersonId || '';
  }
  save(classification: string, status: string, responsibleArea: string, assignedPersonId: string, closureNote: string): void {
    this.saved.emit({ classification, status: status as IncidentStatus, responsibleArea, assignedPersonId: assignedPersonId || null, closureNote });
  }
}
