import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideClipboardCheck,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideRefreshCw,
  LucideShieldAlert,
  LucideSparkles,
  LucideTrendingUp,
  LucideUserCog,
  LucideUsers,
} from '@lucide/angular';
import { filter } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { getNavigationSection, visibleNavigationGroups } from '../navigation/navigation.config';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'smartCompliance.sidebarCollapsed';

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideChevronLeft,
    LucideChevronRight,
    LucideClipboardCheck,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideRefreshCw,
    LucideShieldAlert,
    LucideSparkles,
    LucideTrendingUp,
    LucideUserCog,
    LucideUsers,
  ],
  template: `
    <div class="shell" [class.shell--collapsed]="isSidebarCollapsed()">
      <aside class="sidebar">
        <div class="sidebar__topbar">
          <div class="sidebar__brand-card">
            <img src="logo_abc_app.png" alt="abc technology group" />
          </div>
          <button
            class="sidebar__toggle"
            type="button"
            (click)="toggleSidebar()"
            [attr.aria-label]="sidebarToggleLabel()"
            [attr.aria-expanded]="!isSidebarCollapsed()"
            [title]="sidebarToggleLabel()"
          >
            @if (isSidebarCollapsed()) {
              <svg lucideChevronRight aria-hidden="true" />
            } @else {
              <svg lucideChevronLeft aria-hidden="true" />
            }
          </button>
        </div>
        <div class="sidebar__app-name">SmartCompliance</div>

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
                    <span class="sidebar__link-mark">
                      @switch (section.key) {
                        @case ('dashboard') {
                          <svg lucideLayoutDashboard aria-hidden="true" />
                        }
                        @case ('compliance') {
                          <svg lucideShieldAlert aria-hidden="true" />
                        }
                        @case ('evaluations') {
                          <svg lucideClipboardCheck aria-hidden="true" />
                        }
                        @case ('development') {
                          <svg lucideTrendingUp aria-hidden="true" />
                        }
                        @case ('applause') {
                          <svg lucideSparkles aria-hidden="true" />
                        }
                        @case ('people') {
                          <svg lucideUsers aria-hidden="true" />
                        }
                        @case ('users') {
                          <svg lucideUserCog aria-hidden="true" />
                        }
                      }
                    </span>
                    <span class="sidebar__link-label">{{ section.label }}</span>
                  </a>
                }
              </div>
            </section>
          }
        </nav>

        <div class="sidebar__profile">
          <div class="sidebar__avatar">{{ profileInitials() }}</div>
          <div class="sidebar__profile-copy">
            <strong>{{ auth.user()?.person?.name || auth.user()?.email }}</strong>
            <span>{{ auth.user()?.roleKey }}</span>
          </div>
          <button type="button" (click)="logout()">Sair</button>
        </div>
        <p class="sidebar__footer">Grupo ABC © 2026</p>
      </aside>

      <main class="shell__content">
        <header class="topbar">
          <div>
            <p>SmartCompliance</p>
            <p class="topbar__title">{{ activeSection()?.label || 'Workspace' }}</p>
            <span>{{ activeSection()?.description || 'Ambiente executivo e operacional.' }}</span>
          </div>
          <div class="topbar__actions">
            <button type="button" (click)="refresh()" aria-label="Atualizar dados" title="Atualizar dados">
              <svg lucideRefreshCw aria-hidden="true" />
              <span>Atualizar</span>
            </button>
            <button type="button" (click)="logout()" aria-label="Sair" title="Sair">
              <svg lucideLogOut aria-hidden="true" />
              <span>Sair</span>
            </button>
            <div class="topbar__avatar" [attr.aria-label]="profileSummary()" [title]="profileSummary()">
              {{ profileInitials() }}
            </div>
          </div>
        </header>
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell {
      --shell-text: var(--abc-text);
      display: grid;
      grid-template-columns: 256px minmax(0, 1fr);
      min-height: 100vh;
      color: var(--shell-text);
      background: var(--abc-surface-muted);
      transition: grid-template-columns 180ms ease;
    }

    .sidebar {
      position: sticky;
      top: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 100vh;
      height: 100vh;
      padding: 12px 14px 14px;
      color: var(--abc-on-blue);
      overflow: hidden;
      background: var(--abc-navy);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .sidebar__topbar {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sidebar__brand-card {
      flex: 1;
      min-width: 0;
      padding: 8px 10px;
      background: var(--abc-surface);
      border: 1px solid var(--abc-border);
      border-radius: var(--abc-radius);
      overflow: hidden;
    }

    .sidebar__brand-card img {
      display: block;
      width: 100%;
      height: 42px;
      object-fit: contain;
    }

    .sidebar__app-name {
      padding: 0 4px 2px;
      color: var(--abc-on-blue);
      font-size: 14px;
      font-weight: 800;
      text-align: center;
    }

    .sidebar__toggle,
    .sidebar__profile button {
      color: var(--abc-on-blue);
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--abc-radius);
    }

    .sidebar__toggle:hover,
    .sidebar__profile button:hover,
    .sidebar__link:hover {
      transform: translateY(-1px);
    }

    .sidebar__toggle {
      width: 38px;
      height: 38px;
      margin-left: auto;
      display: grid;
      place-items: center;
      background: transparent;
    }

    .sidebar__toggle svg,
    .sidebar__link-mark svg,
    .topbar__actions button svg {
      width: 18px;
      height: 18px;
      stroke-width: 2;
    }

    .sidebar__navigation {
      flex: 1;
      padding: 4px 4px 6px 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar__group + .sidebar__group {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .sidebar__group-label {
      margin: 0 4px 5px;
      color: rgba(201, 210, 227, 0.6);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.2em;
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
      min-height: 44px;
      padding: 8px 10px;
      color: #f5f7fb;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid transparent;
      border-radius: var(--abc-radius);
    }

    .sidebar__link:hover,
    .sidebar__link--active {
      color: var(--abc-on-blue);
      background: var(--abc-blue);
    }

    .sidebar__link-mark {
      display: grid;
      width: 34px;
      height: 34px;
      color: rgba(255, 255, 255, 0.88);
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.055);
      border-radius: var(--abc-radius);
    }

    .sidebar__link--active .sidebar__link-mark {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
    }

    .sidebar__profile {
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--abc-radius);
    }

    .sidebar__avatar {
      display: grid;
      width: 38px;
      height: 38px;
      color: var(--abc-on-blue);
      font-size: 13px;
      font-weight: 800;
      place-items: center;
      background: var(--abc-blue);
      border-radius: var(--abc-radius);
    }

    .sidebar__profile-copy {
      min-width: 0;
      display: grid;
      gap: 2px;
    }

    .sidebar__profile strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar__profile span {
      color: rgba(201, 210, 227, 0.72);
      font-size: 13px;
      text-transform: capitalize;
    }

    .sidebar__profile button {
      grid-column: 1 / -1;
      margin-top: 8px;
      min-height: 34px;
    }

    .sidebar__footer {
      margin: 0;
      color: rgba(201, 210, 227, 0.48);
      font-size: 12px;
      text-align: center;
    }

    .shell__content {
      min-width: 0;
      padding: 32px;
    }

    .topbar__title {
      margin: 0.67em 0;
      color: var(--abc-text);
      font-size: 2em;
      font-weight: 700;
      line-height: 1.2;
    }

    .topbar__actions button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .shell--collapsed {
      grid-template-columns: 88px minmax(0, 1fr);
    }

    .shell--collapsed .sidebar__brand-card,
    .shell--collapsed .sidebar__app-name,
    .shell--collapsed .sidebar__group-label,
    .shell--collapsed .sidebar__link-label,
    .shell--collapsed .sidebar__profile,
    .shell--collapsed .sidebar__footer {
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
      width: 48px;
      height: 48px;
      justify-content: center;
      padding: 6px;
    }

  `,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly activePath = signal(this.router.url);
  protected readonly isSidebarCollapsed = signal(
    localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true',
  );
  protected readonly navigation = computed(() =>
    visibleNavigationGroups(this.auth.user()?.roleKey ?? null),
  );
  protected readonly sidebarToggleLabel = computed(() =>
    this.isSidebarCollapsed() ? 'Expandir menu lateral' : 'Recolher menu lateral',
  );
  protected readonly activeSection = computed(() => {
    const [, , sectionKey] = this.activePath().split('/');
    return getNavigationSection(sectionKey ?? null);
  });
  protected readonly profileInitials = computed(() => {
    const value = this.auth.user()?.person?.name || this.auth.user()?.email || 'SC';
    return value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'SC';
  });
  protected readonly profileSummary = computed(() => {
    const user = this.auth.user();
    return `${user?.person?.name || user?.email || 'Usuario'} · ${user?.roleKey || 'perfil'}`;
  });

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.activePath.set(this.router.url);
    });
  }

  toggleSidebar(): void {
    const collapsed = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  refresh(): void {
    location.reload();
  }
}
