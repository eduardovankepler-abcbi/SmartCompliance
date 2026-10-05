import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const dashboardAccessGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roleKey = auth.user()?.roleKey;
  console.log('[dashboard-access-guard]', { path: state.url, roleKey: roleKey ?? null });

  return roleKey === 'admin' || roleKey === 'hr' || roleKey === 'manager'
    ? true
    : router.createUrlTree(['/app', 'compliance']);
};

