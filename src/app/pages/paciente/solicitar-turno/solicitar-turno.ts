import { Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { PacienteTurno } from '../../../core/models/paciente.model';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeDeError } from '../../../core/services/errores';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { SolicitudTurno } from '../../../shared/components/solicitud-turno/solicitud-turno';

/** Solicitud de turno del paciente. La cobertura no se elige: es la que tiene registrada. */
@Component({
  selector: 'app-solicitar-turno',
  imports: [MatCardModule, MatIconModule, SolicitudTurno, Aviso, Cargando],
  template: `
    <div class="encabezado-pagina">
      <div>
        <h1><mat-icon>event_available</mat-icon>Solicitar turno</h1>
        <p class="subtitulo">
          Elegí la especialidad, la sede, el profesional, el día y el horario.
        </p>
      </div>
    </div>

    @if (cargando()) {
      <app-cargando />
    } @else if (error()) {
      <app-aviso [mensaje]="error()" [reintentable]="true" (reintentar)="cargarPerfil()" />
    } @else if (paciente(); as p) {
      <mat-card appearance="outlined">
        <mat-card-content>
          <app-solicitud-turno [paciente]="p" (confirmado)="confirmado()" />
        </mat-card-content>
      </mat-card>
    }
  `,
})
export class SolicitarTurno {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly avisos = inject(MatSnackBar);

  readonly cargando = signal(true);
  readonly error = signal('');

  readonly paciente = computed<PacienteTurno | null>(() => {
    const perfil = this.auth.perfil();
    return perfil
      ? {
          id: perfil.id,
          nombre: perfil.nombre,
          apellido: perfil.apellido,
          cobertura: perfil.cobertura ?? null,
        }
      : null;
  });

  constructor() {
    this.cargarPerfil();
  }

  /** Se recarga el perfil para mostrar la cobertura vigente en el resumen. */
  cargarPerfil(): void {
    this.cargando.set(true);
    this.error.set('');
    this.auth.cargarPerfil().subscribe({
      next: () => this.cargando.set(false),
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  confirmado(): void {
    this.avisos.open('¡Listo! Tu turno quedó confirmado.', 'Cerrar', { duration: 5000 });
    this.router.navigate(['/paciente/turnos']);
  }
}
