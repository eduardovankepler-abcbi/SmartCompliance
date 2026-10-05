import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.user()) {
    await auth.restoreSession();
  }

  const user = auth.user();

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  return user.mustChangePassword ? router.createUrlTree(['/change-password']) : true;
};
