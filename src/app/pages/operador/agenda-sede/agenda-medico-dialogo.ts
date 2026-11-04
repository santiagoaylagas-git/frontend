import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { RangoAgenda } from '../../../core/models/agenda.model';
import { Medico, Sede } from '../../../core/models/catalogo.model';
import { AgendaService } from '../../../core/services/agenda.service';
import { mensajeDeError } from '../../../core/services/errores';
import { TurnoService } from '../../../core/services/turno.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { confirmar } from '../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import {
  DatosRangoDialogo,
  RangoDialogo,
} from '../../../shared/components/rango-dialogo/rango-dialogo';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';

export interface DatosAgendaMedico {
  medico: Medico;
  fecha: string;
  /** Sede del operador: la única donde puede modificar. */
  idSede: number;
  sedes: Sede[];
}

/** El operador agrega, modifica o elimina los rangos horarios de un médico en su sede. */
@Component({
  selector: 'app-agenda-medico-dialogo',
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
    <h2 mat-dialog-title>Agenda de {{ datos.medico.apellido }}, {{ datos.medico.nombre }}</h2>
    <mat-dialog-content>
      <p class="texto-secundario">{{ datos.fecha | fecha: 'larga' }} — rangos en tu sede</p>

      @if (cargando()) {
        <app-cargando />
      } @else if (error()) {
        <app-aviso [mensaje]="error()" [reintentable]="true" (reintentar)="cargar()" />
      } @else if (rangos().length === 0) {
        <app-aviso tipo="vacio" mensaje="El médico no tiene rangos horarios ese día en tu sede." />
      } @else {
        <table mat-table [dataSource]="rangos()" class="tabla">
          <ng-container matColumnDef="horario">
            <th mat-header-cell *matHeaderCellDef>Horario</th>
            <td mat-cell *matCellDef="let r">{{ r.hora_entrada }} a {{ r.hora_salida }} h</td>
          </ng-container>
          <ng-container matColumnDef="especialidad">
            <th mat-header-cell *matHeaderCellDef>Especialidad</th>
            <td mat-cell *matCellDef="let r">{{ r.especialidad }}</td>
          </ng-container>
          <ng-container matColumnDef="turnos">
            <th mat-header-cell *matHeaderCellDef>Turnos confirmados</th>
            <td mat-cell *matCellDef="let r">{{ r.turnos_confirmados }}</td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="columna-acciones">Acciones</th>
            <td mat-cell *matCellDef="let r" class="columna-acciones">
              <button
                matIconButton
                matTooltip="Modificar"
                aria-label="Modificar"
                (click)="modificar(r)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <span
                [matTooltip]="
                  r.turnos_confirmados > 0
                    ? 'No se puede eliminar: tiene ' +
                      r.turnos_confirmados +
                      ' turno(s) confirmado(s)'
                    : 'Eliminar'
                "
              >
                <button
                  matIconButton
                  aria-label="Eliminar"
                  [disabled]="r.turnos_confirmados > 0"
                  (click)="eliminar(r)"
                >
                  <mat-icon [class.icono-peligro]="r.turnos_confirmados === 0">delete</mat-icon>
                </button>
              </span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
        </table>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton (click)="agregar()">
        <mat-icon>add</mat-icon>
        Agregar rango
      </button>
      <button matButton="filled" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class AgendaMedicoDialogo {
  private readonly agenda = inject(AgendaService);
  private readonly turnos = inject(TurnoService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  readonly datos = inject<DatosAgendaMedico>(MAT_DIALOG_DATA);

  readonly columnas = ['horario', 'especialidad', 'turnos', 'acciones'];
  readonly rangos = signal<RangoAgenda[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.agenda
      .listar({
        fecha: this.datos.fecha,
        id_sede: this.datos.idSede,
        id_medico: this.datos.medico.id,
      })
      .subscribe({
        next: (rangos) => {
          this.rangos.set(rangos);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  agregar(): void {
    this.abrirRango({});
  }

  modificar(rango: RangoAgenda): void {
    if (rango.turnos_confirmados === 0) {
      this.abrirRango({ rango });
      return;
    }
    this.turnos.deLaSede(rango.fecha, rango.id_medico, 'confirmado').subscribe({
      next: (turnos) =>
        this.abrirRango({
          rango,
          horasConfirmadas: turnos.filter((t) => t.id_agenda === rango.id).map((t) => t.hora),
        }),
      error: (error) => this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 6000 }),
    });
  }

  eliminar(rango: RangoAgenda): void {
    confirmar(this.dialogo, {
      titulo: 'Eliminar rango horario',
      mensaje: `¿Está seguro de eliminar el rango de ${rango.hora_entrada} a ${rango.hora_salida} (${rango.especialidad})?`,
      textoConfirmar: 'Sí, eliminar',
      peligro: true,
    }).subscribe((confirmado) => {
      if (!confirmado) return;
      this.agenda.eliminar(rango.id).subscribe({
        next: () => {
          this.avisos.open('Rango horario eliminado.', 'Cerrar', { duration: 4000 });
          this.cargar();
        },
        error: (error) => this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 8000 }),
      });
    });
  }

  private abrirRango(extra: Partial<DatosRangoDialogo>): void {
    const datos: DatosRangoDialogo = {
      fecha: this.datos.fecha,
      medicos: [this.datos.medico],
      idMedico: this.datos.medico.id,
      sedes: this.datos.sedes,
      sedeFija: this.datos.idSede,
      ...extra,
    };
    this.dialogo
      .open(RangoDialogo, { data: datos, width: '560px' })
      .afterClosed()
      .subscribe((guardado) => {
        if (guardado) {
          this.avisos.open('Agenda actualizada.', 'Cerrar', { duration: 4000 });
          this.cargar();
        }
      });
  }
}
