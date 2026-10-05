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
      const detail = event as { url?: string; urlAfterRedirects?: string; reason?: string };
      console.log('[router-event]', {
        type: event.constructor.name,
        url: detail.url ?? null,
        finalUrl: detail.urlAfterRedirects ?? null,
        reason: detail.reason ?? null,
      });
    });
  }
}
