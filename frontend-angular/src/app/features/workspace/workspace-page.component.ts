import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { getNavigationSection, navigationSections } from '../../core/navigation/navigation.config';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-workspace-page',
  imports: [RouterLink],
  template: `
    <section aria-labelledby="workspace-title">
      <p class="workspace__eyebrow">{{ section().groupLabel }}</p>
      <h1 id="workspace-title">{{ section().label }}</h1>
      <p>{{ section().description }}</p>
      @if (canManageAreas()) {
        <a class="workspace__link" routerLink="/app/people/areas">Gerenciar areas</a>
      }
    </section>
  `,
  styles: `
    .workspace__eyebrow {
      margin: 0 0 8px;
      color: #175cd3;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    p {
      margin: 8px 0 0;
      color: #475467;
    }

    .workspace__link {
      display: inline-block;
      margin-top: 20px;
      color: #175cd3;
      font-weight: 600;
    }
  `,
})
export class WorkspacePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  protected readonly section = toSignal(
    this.route.paramMap.pipe(
      map((params) => getNavigationSection(params.get('section')) ?? navigationSections[0]),
    ),
    { initialValue: navigationSections[0] },
  );
  protected readonly canManageAreas = computed(
    () =>
      this.section().key === 'people' &&
      ['admin', 'hr'].includes(this.auth.user()?.roleKey ?? ''),
  );
}
