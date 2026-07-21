import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const peopleAccessGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roleKey = auth.user()?.roleKey;

  return roleKey === 'admin' || roleKey === 'hr' || roleKey === 'manager'
    ? true
    : router.createUrlTree(['/app', 'compliance']);
};
