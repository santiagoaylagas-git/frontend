import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';

import { Sede } from '../../../core/models/catalogo.model';
import { Turno } from '../../../core/models/turno.model';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { TurnoService } from '../../../core/services/turno.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { confirmar } from '../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { EstadoTurnoEtiqueta } from '../../../shared/components/estado-turno/estado-turno';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import {
  aFechaIso,
  calcularEdad,
  deFechaIso,
  hoyIso,
  momentoTurno,
  sumarDias,
} from '../../../shared/utils/fechas';
import { AtenderDialogo } from './atender-dialogo';

/**
 * Turnos del médico para un día, en todas las sedes donde atiende (o en una sola).
 * Al hacer clic en un turno se despliegan las notas del paciente.
 */
@Component({
  selector: 'app-turnos-programados',
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    FechaPipe,
    Aviso,
    Cargando,
    EstadoTurnoEtiqueta,
  ],
  templateUrl: './turnos-programados.html',
  styleUrl: './turnos-programados.scss',
})
export class TurnosProgramados {
  private readonly turnos = inject(TurnoService);
  private readonly catalogo = inject(CatalogoService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  readonly columnas = [
    'expandir',
    'hora',
    'paciente',
    'edad',
    'sede',
    'especialidad',
    'estado',
    'acciones',
  ];

  readonly fecha = signal(hoyIso());
  readonly fechaComoDate = computed(() => deFechaIso(this.fecha()));
  readonly idSede = signal<number | null>(null);
  readonly sedes = signal<Sede[]>([]);
  readonly lista = signal<Turno[]>([]);
  readonly expandido = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  /** Ordenados por proximidad: primero los que faltan, después los que ya pasaron. */
  readonly ordenados = computed(() => {
    const ahora = Date.now();
    const momento = (t: Turno) => momentoTurno(t.fecha, t.hora).getTime();
    const proximos = this.lista().filter((t) => momento(t) >= ahora);
    const pasados = this.lista().filter((t) => momento(t) < ahora);
    return [
      ...proximos.sort((a, b) => momento(a) - momento(b)),
      ...pasados.sort((a, b) => momento(b) - momento(a)),
    ];
  });

  constructor() {
    this.catalogo.sedes().subscribe({ next: (sedes) => this.sedes.set(sedes) });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.turnos.delMedico(this.fecha(), this.idSede()).subscribe({
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

  cambiarFecha(fecha: Date | null): void {
    if (fecha) {
      this.fecha.set(aFechaIso(fecha));
      this.cargar();
    }
  }

  moverDia(dias: number): void {
    this.fecha.set(sumarDias(this.fecha(), dias));
    this.cargar();
  }

  cambiarSede(idSede: number | null): void {
    this.idSede.set(idSede);
    this.cargar();
  }

  alternar(turno: Turno): void {
    this.expandido.set(this.expandido() === turno.id ? null : turno.id);
  }

  edad(turno: Turno): number {
    return calcularEdad(turno.paciente_fecha_nacimiento);
  }

  atender(turno: Turno, evento: Event): void {
    evento.stopPropagation();
    this.dialogo
      .open(AtenderDialogo, { data: turno, width: '560px' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.avisos.open('Turno marcado como atendido y historial clínico registrado.', 'Cerrar', {
          duration: 5000,
        });
        this.cargar();
      });
  }

  cancelar(turno: Turno, evento: Event): void {
    evento.stopPropagation();
    confirmar(this.dialogo, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar el turno de ${turno.paciente_nombre} ${turno.paciente_apellido} de las ${turno.hora} h? Se le avisará al paciente.`,
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
}
