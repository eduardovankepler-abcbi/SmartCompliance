import { Component, computed, input } from '@angular/core';

export interface DashboardChartDatum {
  label: string;
  value: number;
  valueLabel: string;
}

@Component({
  selector: 'app-dashboard-bar-chart',
  template: `
    @if (items().length) {
      <div class="bar-chart" [attr.aria-label]="ariaLabel()" role="img">
        @for (item of items(); track item.label) {
          <div class="bar-chart__row">
            <div class="bar-chart__labels"><span>{{ item.label }}</span><strong>{{ item.valueLabel }}</strong></div>
            <div class="bar-chart__track"><span class="bar-chart__fill" [style.width.%]="width(item.value)"></span></div>
          </div>
        }
      </div>
    } @else {
      <p class="bar-chart__empty">Sem dados suficientes para o grafico.</p>
    }
  `,
  styles: `
    .bar-chart { display: grid; gap: 14px; }
    .bar-chart__row { display: grid; gap: 6px; }
    .bar-chart__labels { display: flex; justify-content: space-between; gap: 12px; color: #475467; font-size: 13px; }
    .bar-chart__labels strong { color: #101828; }
    .bar-chart__track { height: 10px; overflow: hidden; background: #eaecf0; border-radius: 999px; }
    .bar-chart__fill { display: block; min-width: 2px; height: 100%; background: #175cd3; border-radius: inherit; }
    .bar-chart__empty { margin: 0; color: #667085; }
  `,
})
export class DashboardBarChartComponent {
  readonly items = input<readonly DashboardChartDatum[]>([]);
  readonly ariaLabel = input('Grafico de barras');
  readonly valueMax = input(0);
  private readonly calculatedMaximum = computed(() =>
    Math.max(this.valueMax(), ...this.items().map((item) => item.value), 1),
  );

  width(value: number): number {
    return Math.min(100, Math.max(0, (value / this.calculatedMaximum()) * 100));
  }
}
