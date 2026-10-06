import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [],
})
export class App {
  private readonly router = inject(Router);

  constructor() {
    this.router.events.subscribe((event) => {
      const detail = event as { url?: string; urlAfterRedirects?: string; reason?: string; error?: unknown };
      console.log('[router-event]', {
        type: event.constructor.name,
        eventType: event.type,
        url: detail.url ?? null,
        finalUrl: detail.urlAfterRedirects ?? null,
        reason: detail.reason ?? null,
        error: detail.error instanceof Error ? detail.error.message : String(detail.error ?? ''),
        errorStack: detail.error instanceof Error ? detail.error.stack ?? '' : '',
        detail: event.toString(),
      });
    });
  }
}
