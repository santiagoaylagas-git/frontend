import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Sin sesión no se accede a ninguna ruta protegida: se redirige al login. */
export const sesionGuard: CanActivateFn = (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaLogueado()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirigir: estado.url },
  });
};
