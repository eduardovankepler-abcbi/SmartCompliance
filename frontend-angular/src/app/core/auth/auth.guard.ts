import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  console.log('[auth-guard]', { phase: 'start', path: state.url, hasUser: Boolean(auth.user()) });
  if (!auth.user()) {
    await auth.restoreSession();
  }

  const user = auth.user();
  console.log('[auth-guard]', { phase: 'resolved', path: state.url, hasUser: Boolean(user) });

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  return user.mustChangePassword ? router.createUrlTree(['/change-password']) : true;
};

