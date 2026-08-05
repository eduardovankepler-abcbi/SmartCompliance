import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const auditAccessGuard: CanActivateFn = () => {
  const role = inject(AuthService).user()?.roleKey;
  return role === 'admin' || role === 'hr' || role === 'compliance' || role === 'manager'
    ? true
    : inject(Router).createUrlTree(['/app', 'compliance']);
};
