import { Component, computed, input } from '@angular/core';

import { DashboardChartDatum } from './dashboard-bar-chart.component';

@Component({
  selector: 'app-dashboard-line-chart',
  template: `
    @if (items().length) {
      <figure class="line-chart" [attr.aria-label]="ariaLabel()">
        <svg viewBox="0 0 320 160" role="img">
          <title>{{ ariaLabel() }}</title>
          <line x1="24" x2="304" y1="20" y2="20" class="line-chart__grid" />
          <line x1="24" x2="304" y1="80" y2="80" class="line-chart__grid" />
          <line x1="24" x2="304" y1="140" y2="140" class="line-chart__grid" />
          <polyline [attr.points]="linePoints()" class="line-chart__line" />
          @for (item of items(); track item.label; let index = $index) {
            <circle [attr.cx]="x(index)" [attr.cy]="y(item.value)" r="4" class="line-chart__point">
              <title>{{ item.label }}: {{ item.valueLabel }}</title>
            </circle>
            <text [attr.x]="x(index)" y="156" class="line-chart__label">{{ item.label }}</text>
          }
        </svg>
        <div class="line-chart__legend">
          @for (item of items(); track item.label) { <span>{{ item.label }}: <strong>{{ item.valueLabel }}</strong></span> }
        </div>
      </figure>
    } @else {
      <p class="line-chart__empty">Sem dados suficientes para o grafico.</p>
    }
  `,
  styles: `
    .line-chart { margin: 0; }
    svg { display: block; width: 100%; min-height: 180px; overflow: visible; }
    .line-chart__grid { stroke: var(--abc-border); stroke-width: 1; }
    .line-chart__line { fill: none; stroke: var(--abc-blue); stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }
    .line-chart__point { fill: var(--abc-blue); stroke: var(--abc-surface); stroke-width: 2; }
    .line-chart__label { fill: var(--abc-text-muted); font-size: 9px; text-anchor: middle; }
    .line-chart__legend { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 8px; color: var(--abc-text-muted); font-size: 12px; }
    .line-chart__legend strong { color: var(--abc-text); }
    .line-chart__empty { margin: 0; color: var(--abc-text-muted); }
  `,
})
export class DashboardLineChartComponent {
  readonly items = input<readonly DashboardChartDatum[]>([]);
  readonly ariaLabel = input('Grafico de linha');
  readonly valueMax = input(0);
  private readonly maximum = computed(() =>
    Math.max(this.valueMax(), ...this.items().map((item) => item.value), 1),
  );
  readonly linePoints = computed(() =>
    this.items()
      .map((item, index) => `${this.x(index)},${this.y(item.value)}`)
      .join(' '),
  );

  x(index: number): number {
    const itemCount = this.items().length;
    return itemCount <= 1 ? 164 : 24 + (index / (itemCount - 1)) * 280;
  }

  y(value: number): number {
    return 140 - (Math.min(Math.max(value, 0), this.maximum()) / this.maximum()) * 120;
  }
}
