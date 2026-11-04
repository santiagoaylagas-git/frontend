import { Component, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { Notificacion } from '../../core/models/notificacion.model';
import { ETIQUETAS_ROL } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { NotificacionService } from '../../core/services/notificacion.service';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatProgressBarModule,
    FechaPipe,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly avisos = inject(MatSnackBar);
  readonly notificacionesApi = inject(NotificacionService);

  /** El contenedor de la aplicación escucha esto para abrir o cerrar el menú lateral. */
  readonly alternarMenu = output<void>();

  readonly estaLogueado = this.auth.estaLogueado;
  readonly nombreCompleto = this.auth.nombreCompleto;
  readonly rol = this.auth.rol;
  readonly notificaciones = this.notificacionesApi.notificaciones;
  readonly noLeidas = this.notificacionesApi.noLeidas;

  constructor() {
    // Las notificaciones se refrescan al entrar y cada vez que el usuario navega, así
    // ve las que le generaron otros usuarios sin necesidad de actualización en tiempo real.
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.estaLogueado()) {
          this.notificacionesApi.cargar();
        }
      });
  }

  etiquetaRol(): string {
    const rol = this.rol();
    return rol ? ETIQUETAS_ROL[rol] : '';
  }

  marcarLeida(notificacion: Notificacion, evento: Event): void {
    // Evita que el clic cierre el menú desplegable.
    evento.stopPropagation();
    this.notificacionesApi.marcarLeida(notificacion.id).subscribe({
      error: (error) => this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 5000 }),
    });
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/']);
  }
}
