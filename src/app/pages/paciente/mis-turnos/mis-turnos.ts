import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';

import { TurnoPaciente } from '../../../core/models/turno.model';
import { mensajeDeError } from '../../../core/services/errores';
import { TurnoService } from '../../../core/services/turno.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { confirmar } from '../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { EstadoTurnoEtiqueta } from '../../../shared/components/estado-turno/estado-turno';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { momentoTurno } from '../../../shared/utils/fechas';

/**
 * "Mis turnos": del más próximo al menos próximo, con el detalle desplegable.
 * Los turnos atendidos muestran además el resumen del historial clínico.
 */
@Component({
  selector: 'app-mis-turnos',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    FechaPipe,
    Aviso,
    Cargando,
    EstadoTurnoEtiqueta,
  ],
  templateUrl: './mis-turnos.html',
  styleUrl: './mis-turnos.scss',
})
export class MisTurnos {
  private readonly turnos = inject(TurnoService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  readonly lista = signal<TurnoPaciente[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  /** Turnos que todavía no pasaron, del más cercano al más lejano. */
  readonly proximos = computed(() =>
    this.lista()
      .filter((t) => this.momento(t) >= Date.now())
      .sort((a, b) => this.momento(a) - this.momento(b)),
  );

  /** Turnos ya pasados, del más reciente al más antiguo. */
  readonly anteriores = computed(() =>
    this.lista()
      .filter((t) => this.momento(t) < Date.now())
      .sort((a, b) => this.momento(b) - this.momento(a)),
  );

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.turnos.misTurnos().subscribe({
      next: (turnos) => {
        this.lista.set(turnos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  cancelar(turno: TurnoPaciente): void {
    confirmar(this.dialogo, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar el turno de ${turno.especialidad} del ${this.fechaCorta(turno)} a las ${turno.hora} h?`,
      textoConfirmar: 'Sí, cancelar turno',
      peligro: true,
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.turnos.cancelar(turno.id)),
      )
      .subscribe({
        next: () => {
          this.avisos.open('Turno cancelado.', 'Cerrar', { duration: 4000 });
          this.cargar();
        },
        error: (error) => this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 8000 }),
      });
  }

  private momento(turno: TurnoPaciente): number {
    return momentoTurno(turno.fecha, turno.hora).getTime();
  }

  private fechaCorta(turno: TurnoPaciente): string {
    return new FechaPipe().transform(turno.fecha);
  }
}
