import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { competenciesAccessGuard } from './core/auth/competencies-access.guard';
import { dashboardAccessGuard } from './core/auth/dashboard-access.guard';
import { guestGuard } from './core/auth/guest.guard';
import { sectionAccessGuard } from './core/navigation/section-access.guard';
import { areaManagementGuard } from './core/auth/area-management.guard';
import { auditAccessGuard } from './core/auth/audit-access.guard';
import { peopleAccessGuard } from './core/auth/people-access.guard';
import { usersAccessGuard } from './core/auth/users-access.guard';
import { passwordChangeGuard } from './core/auth/password-change.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./features/auth/change-password-page.component').then((m) => m.ChangePasswordPageComponent),
    canActivate: [passwordChangeGuard],
  },
  {
    path: 'app',
    loadComponent: () => import('./core/layout/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'people/areas',
        loadComponent: () => import('./features/areas/areas-page.component').then((m) => m.AreasPageComponent),
        canActivate: [areaManagementGuard],
      },
      {
        path: 'people/competencies',
        loadComponent: () =>
          import('./features/competencies/competencies-page.component').then((m) => m.CompetenciesPageComponent),
        canActivate: [competenciesAccessGuard],
      },
      {
        path: 'dashboard/pdi',
        loadComponent: () =>
          import('./features/dashboard/dashboard-pdi-page.component').then((m) => m.DashboardPdiPageComponent),
        canActivate: [dashboardAccessGuard],
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
        canActivate: [dashboardAccessGuard],
      },
      {
        path: 'compliance',
        loadComponent: () => import('./features/incidents/incidents-page.component').then((m) => m.IncidentsPageComponent),
      },
      {
        path: 'development',
        loadComponent: () =>
          import('./features/development/development-page.component').then((m) => m.DevelopmentPageComponent),
      },
      {
        path: 'applause',
        loadComponent: () => import('./features/applause/applause-page.component').then((m) => m.ApplausePageComponent),
      },
      {
        path: 'audit',
        loadComponent: () => import('./features/audit/audit-page.component').then((m) => m.AuditPageComponent),
        canActivate: [auditAccessGuard],
      },
      {
        path: 'evaluations',
        pathMatch: 'full',
        redirectTo: 'evaluations/company/respond',
      },
      {
        path: 'evaluations/:module',
        loadComponent: () =>
          import('./features/evaluations/evaluations-page.component').then((m) => m.EvaluationsPageComponent),
      },
      {
        path: 'evaluations/:module/:workspace',
        loadComponent: () =>
          import('./features/evaluations/evaluations-page.component').then((m) => m.EvaluationsPageComponent),
      },
      {
        path: 'evaluations/:module/:workspace/:detail',
        loadComponent: () =>
          import('./features/evaluations/evaluations-page.component').then((m) => m.EvaluationsPageComponent),
      },
      {
        path: 'people',
        loadComponent: () => import('./features/people/people-page.component').then((m) => m.PeoplePageComponent),
        canActivate: [peopleAccessGuard],
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users-page.component').then((m) => m.UsersPageComponent),
        canActivate: [usersAccessGuard],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: ':section',
        loadComponent: () => import('./features/workspace/workspace-page.component').then((m) => m.WorkspacePageComponent),
        canActivate: [sectionAccessGuard],
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
