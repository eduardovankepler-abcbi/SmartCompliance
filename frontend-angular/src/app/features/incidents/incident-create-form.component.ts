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
      <div class="incident-form__heading"><strong>Novo relato</strong><span>Canal estruturado de etica e conduta</span></div>
      <section class="incident-form__main">
        <label>Titulo <input formControlName="title" /></label>
        <label>Descricao detalhada <textarea rows="8" formControlName="description"></textarea><small>Descreva o fato, onde aconteceu, quem foi impactado e qualquer contexto util para a triagem.</small></label>
      </section>
      <aside class="incident-form__triage">
        <div><strong>Triagem inicial</strong><span>Classifique e encaminhe o relato</span></div>
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
        <p>{{ selectedAreaName() || 'Defina a area responsavel' }} · {{ selectedAssigneeName() || 'Sem responsavel inicial definido' }}</p>
      </aside>
      @if (validationMessage()) { <p class="validation wide" role="alert">{{ validationMessage() }}</p> }
      <div class="actions"><button type="button" class="secondary" (click)="cancelled.emit()">Cancelar</button><button [disabled]="saving()">{{ saving() ? 'Registrando...' : 'Registrar relato' }}</button></div>
    </form>
  `,
  styles: `.incident-form{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.9fr);gap:16px;margin-top:20px;padding:18px;background:#111827;border:1px solid #253044;border-radius:8px;color:#f8fafc}.incident-form__heading{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:16px}.incident-form__heading strong{font-size:18px}.incident-form__heading span,.incident-form__triage span,small,.incident-form__triage p{color:#98a2b3}.incident-form__main,.incident-form__triage{display:grid;gap:14px;align-content:start}.incident-form__triage{align-self:start;padding:16px;background:#0f172a;border:1px solid #253044;border-radius:8px}.incident-form__triage>div{display:flex;align-items:start;justify-content:space-between;gap:12px}.incident-form__triage p{margin:0;font-size:12px}label{display:grid;gap:6px;color:#cbd5e1}.wide,.actions{grid-column:1/-1}input,select,textarea{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #253044;border-radius:8px;background:#0b1220;color:#f8fafc;font:inherit}textarea{min-height:186px;resize:vertical}.validation{margin:0;padding:10px 12px;color:#fecaca;background:#450a0a;border:1px solid #7f1d1d;border-radius:8px}.actions{display:grid;grid-template-columns:auto minmax(220px,1fr);gap:8px}button{padding:11px 14px;background:#dc2626;color:#fff;border:0;border-radius:8px;font-weight:700}.secondary{background:#111827;color:#e2e8f0;border:1px solid #334155}@media(max-width:820px){.incident-form{grid-template-columns:1fr}.incident-form__heading,.incident-form__triage>div{display:grid}.actions{grid-template-columns:1fr}}`,
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

  selectedAreaName(): string {
    return this.form().get('responsibleArea')?.value || '';
  }

  selectedAssigneeName(): string {
    const assigneeId = this.form().get('assignedPersonId')?.value;
    return this.people().find((person) => person.id === assigneeId)?.name || '';
  }

  validationMessage(): string {
    const value = this.form().getRawValue();
    if (!String(value.title || '').trim()) return 'Informe o titulo do relato.';
    if (!String(value.description || '').trim()) return 'Descreva o relato para orientar a triagem.';
    if (!String(value.responsibleArea || '').trim()) return 'Selecione a area responsavel.';
    if (value.anonymity === 'identified' && !String(value.reporterLabel || '').trim()) return 'Informe o nome do relator identificado.';
    return '';
  }

  areaChanged(): void {
    const areaName = this.form().get('responsibleArea')?.value;
    const area = this.areas().find((item) => item.name === areaName);
    this.form().get('assignedPersonId')?.setValue(area?.managerPersonId || '');
  }
}
