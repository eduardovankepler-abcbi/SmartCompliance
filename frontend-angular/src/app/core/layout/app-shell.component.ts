import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideClipboardCheck,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMoon,
  LucideRefreshCw,
  LucideShieldAlert,
  LucideSparkles,
  LucideSun,
  LucideTrendingUp,
  LucideUserCog,
  LucideUsers,
} from '@lucide/angular';
import { filter } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { getNavigationSection, visibleNavigationGroups } from '../navigation/navigation.config';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'smartCompliance.sidebarCollapsed';
const THEME_STORAGE_KEY = 'smartCompliance.theme';

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
    LucideMoon,
    LucideRefreshCw,
    LucideShieldAlert,
    LucideSparkles,
    LucideSun,
    LucideTrendingUp,
    LucideUserCog,
    LucideUsers,
  ],
  template: `
    <div class="shell" [class.shell--collapsed]="isSidebarCollapsed()">
      @if (!isSidebarCollapsed()) {
        <button
          class="shell__scrim"
          type="button"
          aria-label="Fechar menu lateral"
          (click)="toggleSidebar()"
        ></button>
      }
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
            <button
              type="button"
              (click)="toggleTheme()"
              [attr.aria-label]="themeToggleLabel()"
              [title]="themeToggleLabel()"
            >
              @if (isDarkTheme()) {
                <svg lucideSun aria-hidden="true" />
                <span>Claro</span>
              } @else {
                <svg lucideMoon aria-hidden="true" />
                <span>Escuro</span>
              }
            </button>
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
  styles: ``,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly activePath = signal(this.router.url);
  protected readonly isSidebarCollapsed = signal(
    localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true',
  );
  protected readonly isDarkTheme = signal(localStorage.getItem(THEME_STORAGE_KEY) === 'dark');
  protected readonly navigation = computed(() =>
    visibleNavigationGroups(this.auth.user()?.roleKey ?? null),
  );
  protected readonly sidebarToggleLabel = computed(() =>
    this.isSidebarCollapsed() ? 'Expandir menu lateral' : 'Recolher menu lateral',
  );
  protected readonly themeToggleLabel = computed(() =>
    this.isDarkTheme() ? 'Ativar tema claro' : 'Ativar tema escuro',
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
    this.applyThemeClass();
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

  toggleTheme(): void {
    const next = !this.isDarkTheme();
    this.isDarkTheme.set(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    this.applyThemeClass();
  }

  private applyThemeClass(): void {
    const dark = this.isDarkTheme();
    document.documentElement.classList.toggle('theme-dark', dark);
    document.body.classList.toggle('theme-dark', dark);
  }
}
