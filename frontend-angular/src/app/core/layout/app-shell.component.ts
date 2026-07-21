import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { visibleNavigationGroups } from '../navigation/navigation.config';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'smartCompliance.sidebarCollapsed';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell" [class.shell--collapsed]="isSidebarCollapsed()">
      <aside class="sidebar">
        <div class="sidebar__topbar">
          <span class="sidebar__brand">Smart Compliance</span>
          <button
            class="sidebar__toggle"
            type="button"
            (click)="toggleSidebar()"
            [attr.aria-label]="sidebarToggleLabel()"
            [title]="sidebarToggleLabel()"
          >
            {{ isSidebarCollapsed() ? '>' : '<' }}
          </button>
        </div>

        <nav class="sidebar__navigation" aria-label="Navegacao principal">
          @for (group of navigation(); track group.key) {
            <section class="sidebar__group">
              <p class="sidebar__group-label">{{ group.label }}</p>
              <div class="sidebar__links">
                @for (section of group.sections; track section.key) {
                  <a
                    class="sidebar__link"
                    [routerLink]="['/app', section.key]"
                    routerLinkActive="sidebar__link--active"
                    [attr.aria-label]="section.label"
                    [title]="section.label"
                  >
                    <span class="sidebar__link-mark">{{ section.shortLabel }}</span>
                    <span class="sidebar__link-label">{{ section.label }}</span>
                  </a>
                }
              </div>
            </section>
          }
        </nav>

        <div class="sidebar__profile">
          <strong>{{ auth.user()?.person?.name || auth.user()?.email }}</strong>
          <span>{{ auth.user()?.roleKey }}</span>
          <button type="button" (click)="logout()">Sair</button>
        </div>
      </aside>

      <main class="shell__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      display: grid;
      grid-template-columns: 248px minmax(0, 1fr);
      min-height: 100vh;
      background: #f7f8fa;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      color: #ffffff;
      background: #1d2939;
      border-right: 1px solid #101828;
    }

    .sidebar__topbar {
      display: flex;
      align-items: center;
      min-height: 64px;
      padding: 0 16px;
      border-bottom: 1px solid #344054;
    }

    .sidebar__brand {
      font-size: 18px;
      font-weight: 700;
    }

    .sidebar__toggle,
    .sidebar__profile button {
      min-height: 32px;
      color: #ffffff;
      cursor: pointer;
      background: transparent;
      border: 1px solid #667085;
      border-radius: 6px;
    }

    .sidebar__toggle {
      width: 32px;
      margin-left: auto;
    }

    .sidebar__navigation {
      flex: 1;
      padding: 16px 8px;
      overflow-y: auto;
    }

    .sidebar__group + .sidebar__group {
      margin-top: 24px;
    }

    .sidebar__group-label {
      margin: 0 8px 8px;
      color: #98a2b3;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .sidebar__links {
      display: grid;
      gap: 4px;
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      padding: 0 10px;
      color: #d0d5dd;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 6px;
    }

    .sidebar__link:hover,
    .sidebar__link--active {
      color: #ffffff;
      background: #344054;
    }

    .sidebar__link-mark {
      display: grid;
      width: 24px;
      height: 24px;
      color: #98a2b3;
      font-size: 11px;
      font-weight: 700;
      place-items: center;
      background: #344054;
      border-radius: 4px;
    }

    .sidebar__link--active .sidebar__link-mark {
      color: #ffffff;
      background: #175cd3;
    }

    .sidebar__profile {
      display: grid;
      gap: 6px;
      padding: 16px;
      border-top: 1px solid #344054;
    }

    .sidebar__profile span {
      color: #98a2b3;
      font-size: 13px;
      text-transform: capitalize;
    }

    .sidebar__profile button {
      margin-top: 8px;
    }

    .shell__content {
      min-width: 0;
      padding: 32px;
    }

    .shell--collapsed {
      grid-template-columns: 64px minmax(0, 1fr);
    }

    .shell--collapsed .sidebar__brand,
    .shell--collapsed .sidebar__group-label,
    .shell--collapsed .sidebar__link-label,
    .shell--collapsed .sidebar__profile {
      display: none;
    }

    .shell--collapsed .sidebar__topbar {
      justify-content: center;
      padding: 0;
    }

    .shell--collapsed .sidebar__toggle {
      margin: 0;
    }

    .shell--collapsed .sidebar__link {
      justify-content: center;
      padding: 0;
    }

    @media (max-width: 720px) {
      .shell,
      .shell--collapsed {
        grid-template-columns: 1fr;
      }

      .sidebar {
        min-height: auto;
      }

      .sidebar__navigation {
        display: flex;
        gap: 8px;
        padding: 8px;
        overflow-x: auto;
      }

      .sidebar__group,
      .sidebar__group + .sidebar__group {
        min-width: max-content;
        margin: 0;
      }

      .sidebar__group-label,
      .sidebar__profile {
        display: none;
      }

      .shell__content {
        padding: 24px;
      }
    }
  `,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly isSidebarCollapsed = signal(
    localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true',
  );
  protected readonly navigation = computed(() =>
    visibleNavigationGroups(this.auth.user()?.roleKey ?? null),
  );
  protected readonly sidebarToggleLabel = computed(() =>
    this.isSidebarCollapsed() ? 'Expandir menu lateral' : 'Recolher menu lateral',
  );

  toggleSidebar(): void {
    const collapsed = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
