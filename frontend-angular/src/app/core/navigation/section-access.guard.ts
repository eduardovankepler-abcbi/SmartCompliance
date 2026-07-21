import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { getNavigationSection, visibleNavigationGroups } from './navigation.config';

export const sectionAccessGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roleKey = auth.user()?.roleKey ?? null;
  const section = getNavigationSection(route.paramMap.get('section'));

  if (section?.roles.includes(roleKey ?? '')) {
    return true;
  }

  const firstVisibleSection = visibleNavigationGroups(roleKey)[0]?.sections[0];
  return firstVisibleSection
    ? router.createUrlTree(['/app', firstVisibleSection.key])
    : router.createUrlTree(['/login']);
};
