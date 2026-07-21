import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const areaManagementGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roleKey = auth.user()?.roleKey;

  return roleKey === 'admin' || roleKey === 'hr'
    ? true
    : router.createUrlTree(['/app', 'people']);
};
