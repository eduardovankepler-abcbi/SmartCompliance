import { Routes } from '@angular/router';

import { AppShellComponent } from './core/layout/app-shell.component';
import { authGuard } from './core/auth/auth.guard';
import { competenciesAccessGuard } from './core/auth/competencies-access.guard';
import { dashboardAccessGuard } from './core/auth/dashboard-access.guard';
import { guestGuard } from './core/auth/guest.guard';
import { sectionAccessGuard } from './core/navigation/section-access.guard';
import { areaManagementGuard } from './core/auth/area-management.guard';
import { peopleAccessGuard } from './core/auth/people-access.guard';
import { usersAccessGuard } from './core/auth/users-access.guard';
import { AreasPageComponent } from './features/areas/areas-page.component';
import { ApplausePageComponent } from './features/applause/applause-page.component';
import { CompetenciesPageComponent } from './features/competencies/competencies-page.component';
import { IncidentsPageComponent } from './features/incidents/incidents-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { DevelopmentPageComponent } from './features/development/development-page.component';
import { EvaluationsPageComponent } from './features/evaluations/evaluations-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { PeoplePageComponent } from './features/people/people-page.component';
import { UsersPageComponent } from './features/users/users-page.component';
import { WorkspacePageComponent } from './features/workspace/workspace-page.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'people/areas',
        component: AreasPageComponent,
        canActivate: [areaManagementGuard],
      },
      {
        path: 'people/competencies',
        component: CompetenciesPageComponent,
        canActivate: [competenciesAccessGuard],
      },
      {
        path: 'dashboard',
        component: DashboardPageComponent,
        canActivate: [dashboardAccessGuard],
      },
      { path: 'compliance', component: IncidentsPageComponent },
      { path: 'development', component: DevelopmentPageComponent },
      { path: 'applause', component: ApplausePageComponent },
      { path: 'evaluations', component: EvaluationsPageComponent },
      {
        path: 'people',
        component: PeoplePageComponent,
        canActivate: [peopleAccessGuard],
      },
      {
        path: 'users',
        component: UsersPageComponent,
        canActivate: [usersAccessGuard],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: ':section',
        component: WorkspacePageComponent,
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
