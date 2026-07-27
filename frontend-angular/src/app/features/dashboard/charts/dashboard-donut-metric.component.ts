import { Component, input } from '@angular/core';

import { DashboardDonutMetric } from '../dashboard.service';

@Component({
  selector: 'app-dashboard-donut-metric',
  template: `
    <article class="donut" [attr.aria-label]="metric().label">
      <svg viewBox="0 0 100 100" role="img">
        <title>{{ metric().label }}: {{ metric().percentage }}%</title>
        <circle class="donut__track" cx="50" cy="50" r="40" />
        <circle class="donut__value" cx="50" cy="50" r="40" [attr.stroke-dasharray]="dashArray()" />
        <text x="50" y="55" class="donut__percentage">{{ metric().percentage }}%</text>
      </svg>
      <strong>{{ metric().label }}</strong>
      <span>{{ metric().detail }}</span>
    </article>
  `,
  styles: `
    .donut { text-align: center; }
    svg { width: 112px; height: 112px; transform: rotate(-90deg); }
    circle { fill: none; stroke-width: 10; }
    .donut__track { stroke: var(--abc-border); }
    .donut__value { stroke: var(--abc-blue); stroke-linecap: round; }
    .donut__percentage { fill: var(--abc-text); font-size: 16px; font-weight: 700; text-anchor: middle; transform: rotate(90deg); transform-origin: center; }
    strong, span { display: block; }
    strong { margin-top: 4px; color: var(--abc-text); font-size: 13px; }
    span { margin-top: 4px; color: var(--abc-text-muted); font-size: 12px; }
  `,
})
export class DashboardDonutMetricComponent {
  readonly metric = input.required<DashboardDonutMetric>();

  dashArray(): string {
    const circumference = 251.33;
    return `${(Math.max(0, Math.min(this.metric().percentage, 100)) / 100) * circumference} ${circumference}`;
  }
}
