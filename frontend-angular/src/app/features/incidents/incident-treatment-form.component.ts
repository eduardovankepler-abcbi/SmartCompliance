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
      <div class="actions"><button class="secondary" (click)="cancelled.emit()">Cancelar</button><button (click)="save(classification.value, status.value, area.value, assignee.value)">Salvar tratamento</button></div>
    </div>
  `,
  styles: `.treatment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px;padding:14px;background:#f9fafb;border-radius:6px}label{display:grid;gap:5px}select{padding:8px}.actions{grid-column:1/-1;display:flex;justify-content:end;gap:8px}button{padding:8px 12px;background:#175cd3;color:#fff;border:0;border-radius:5px}.secondary{background:#fff;color:#344054;border:1px solid #98a2b3}`,
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
  save(classification: string, status: string, responsibleArea: string, assignedPersonId: string): void {
    this.saved.emit({ classification, status: status as IncidentStatus, responsibleArea, assignedPersonId: assignedPersonId || null });
  }
}
