import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../models/usuario.model';
import { AuthService } from '../services/auth.service';

/**
 * Restringe una sección a los roles indicados en `data.roles` de la ruta.
 * Un usuario que escribe a mano la URL de otra sección termina en "Acceso denegado".
 */
export const rolGuard: CanActivateFn = (ruta) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const permitidos = (ruta.data['roles'] ?? []) as Rol[];
  const rol = auth.rol();

  if (rol && permitidos.includes(rol)) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};
