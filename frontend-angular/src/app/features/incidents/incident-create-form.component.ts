import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Area } from '../areas/areas.service';
import { Person } from '../people/people.service';

const categories = ['Conduta Impropria', 'Assedio', 'Conflito de Interesse', 'Outro'] as const;
const classifications = [
  'Conduta e Relacionamento',
  'Integridade e Etica',
  'Assedio e Respeito',
  'Fraude e Desvio',
  'Processos e Controles',
  'Nao classificado',
] as const;

@Component({
  selector: 'app-incident-create-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="incident-form" [formGroup]="form()" (ngSubmit)="submitted.emit()">
      <label>Titulo <input formControlName="title" /></label>
      <label class="wide">Descricao <textarea rows="6" formControlName="description"></textarea></label>
      <label>Categoria
        <select formControlName="category">@for (item of categories; track item) { <option [value]="item">{{ item }}</option> }</select>
      </label>
      <label>Classificacao inicial
        <select formControlName="classification">@for (item of classifications; track item) { <option [value]="item">{{ item }}</option> }</select>
      </label>
      <label>Identificacao
        <select formControlName="anonymity"><option value="anonymous">Anonimo</option><option value="identified">Identificado</option></select>
      </label>
      @if (form().get('anonymity')?.value === 'identified') { <label>Nome do relator <input formControlName="reporterLabel" /></label> }
      <label>Area responsavel
        <select formControlName="responsibleArea" (change)="areaChanged()">
          @for (area of areas(); track area.id) { <option [value]="area.name">{{ area.name }}</option> }
        </select>
      </label>
      <label>Responsavel inicial
        <select formControlName="assignedPersonId"><option value="">Nao definido</option>
          @for (person of peopleForArea(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }
        </select>
      </label>
      <div class="actions"><button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button><button [disabled]="saving()">{{ saving() ? 'Registrando...' : 'Registrar relato' }}</button></div>
    </form>
  `,
  styles: `.incident-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px;padding:20px;background:#fff;border:1px solid #d0d5dd;border-radius:8px}label{display:grid;gap:6px}.wide,.actions{grid-column:1/-1}input,select,textarea{padding:8px;border:1px solid #98a2b3;border-radius:6px;font:inherit}.actions{display:flex;justify-content:end;gap:8px}button{padding:9px 12px;background:#175cd3;color:#fff;border:0;border-radius:6px}.secondary{background:#fff;color:#344054;border:1px solid #98a2b3}@media(max-width:640px){.incident-form{grid-template-columns:1fr}}`,
})
export class IncidentCreateFormComponent {
  readonly form = input.required<FormGroup>();
  readonly areas = input<readonly Area[]>([]);
  readonly people = input<readonly Person[]>([]);
  readonly saving = input(false);
  readonly submitted = output<void>();
  readonly cancelled = output<void>();
  readonly categories = categories;
  readonly classifications = classifications;

  peopleForArea(): Person[] {
    const area = this.form().get('responsibleArea')?.value;
    return this.people().filter((person) => person.area === area);
  }

  areaChanged(): void {
    const areaName = this.form().get('responsibleArea')?.value;
    const area = this.areas().find((item) => item.name === areaName);
    this.form().get('assignedPersonId')?.setValue(area?.managerPersonId || '');
  }
}
