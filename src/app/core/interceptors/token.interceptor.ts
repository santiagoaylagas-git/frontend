import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Agrega el JWT a cada petición saliente y, si el backend responde 401,
 * cierra la sesión y manda al login.
 */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.obtenerToken();

  const conToken = token
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : peticion;

  return siguiente(conToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.estaLogueado()) {
        auth.cerrarSesion();
        router.navigate(['/login'], { queryParams: { vencida: true } });
      }
      return throwError(() => error);
    }),
  );
};
