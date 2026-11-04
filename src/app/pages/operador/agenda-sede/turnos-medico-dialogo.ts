import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';

import { Turno } from '../../../core/models/turno.model';
import { mensajeDeError } from '../../../core/services/errores';
import { TurnoService } from '../../../core/services/turno.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { confirmar } from '../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';

/** Turnos confirmados de un médico en la sede del operador, con la opción de cancelarlos. */
@Component({
  selector: 'app-turnos-medico-dialogo',
  imports: [
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  template: `
    <h2 mat-dialog-title>Turnos confirmados de {{ datos.nombreMedico }}</h2>
    <mat-dialog-content>
      <p class="texto-secundario">{{ datos.fecha | fecha: 'larga' }} — tu sede</p>
      @if (cargando()) {
        <app-cargando />
      } @else if (error()) {
        <app-aviso [mensaje]="error()" [reintentable]="true" (reintentar)="cargar()" />
      } @else if (turnos().length === 0) {
        <app-aviso
          tipo="vacio"
          mensaje="El médico no tiene turnos confirmados ese día en tu sede."
        />
      } @else {
        <table mat-table [dataSource]="turnos()" class="tabla">
          <ng-container matColumnDef="hora">
            <th mat-header-cell *matHeaderCellDef>Hora</th>
            <td mat-cell *matCellDef="let t">
              <strong>{{ t.hora }}</strong>
            </td>
          </ng-container>
          <ng-container matColumnDef="paciente">
            <th mat-header-cell *matHeaderCellDef>Paciente</th>
            <td mat-cell *matCellDef="let t">
              {{ t.paciente_apellido }}, {{ t.paciente_nombre }}
              <div class="texto-secundario">DNI {{ t.paciente_dni }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="especialidad">
            <th mat-header-cell *matHeaderCellDef>Especialidad</th>
            <td mat-cell *matCellDef="let t">{{ t.especialidad }}</td>
          </ng-container>
          <ng-container matColumnDef="nota">
            <th mat-header-cell *matHeaderCellDef>Nota</th>
            <td mat-cell *matCellDef="let t">{{ t.nota }}</td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="columna-acciones"></th>
            <td mat-cell *matCellDef="let t" class="columna-acciones">
              <button matButton (click)="cancelar(t)">
                <mat-icon class="icono-peligro">event_busy</mat-icon>
                Cancelar
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
        </table>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton="filled" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class TurnosMedicoDialogo {
  private readonly turnosApi = inject(TurnoService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  readonly datos = inject<{ nombreMedico: string; idMedico: number; fecha: string }>(
    MAT_DIALOG_DATA,
  );

  readonly columnas = ['hora', 'paciente', 'especialidad', 'nota', 'acciones'];
  readonly turnos = signal<Turno[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.turnosApi.deLaSede(this.datos.fecha, this.datos.idMedico, 'confirmado').subscribe({
      next: (turnos) => {
        this.turnos.set(turnos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  cancelar(turno: Turno): void {
    confirmar(this.dialogo, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar el turno de ${turno.paciente_nombre} ${turno.paciente_apellido} de las ${turno.hora} h? Se les avisará al paciente y al médico.`,
      textoConfirmar: 'Sí, cancelar turno',
      peligro: true,
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.turnosApi.cancelar(turno.id)),
      )
      .subscribe({
        next: () => {
          this.avisos.open('Turno cancelado.', 'Cerrar', { duration: 4000 });
          this.cargar();
        },
        error: (error) => this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 8000 }),
      });
  }
}
