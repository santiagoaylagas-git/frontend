import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

import { RangoAgenda } from '../../../core/models/agenda.model';
import { Medico, Sede } from '../../../core/models/catalogo.model';
import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { MedicoService } from '../../../core/services/medico.service';
import { TurnoService } from '../../../core/services/turno.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { confirmar } from '../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import {
  DatosRangoDialogo,
  RangoDialogo,
} from '../../../shared/components/rango-dialogo/rango-dialogo';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { aFechaIso, deFechaIso, hoyIso, sumarDias } from '../../../shared/utils/fechas';

/** Agenda propia del médico: un día por vez (por defecto hoy), en todas sus sedes. */
@Component({
  selector: 'app-mi-agenda',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  templateUrl: './mi-agenda.html',
})
export class MiAgenda {
  private readonly agenda = inject(AgendaService);
  private readonly turnos = inject(TurnoService);
  private readonly catalogo = inject(CatalogoService);
  private readonly medicos = inject(MedicoService);
  private readonly auth = inject(AuthService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  readonly columnas = ['horario', 'especialidad', 'sede', 'turnos', 'acciones'];

  readonly fecha = signal(hoyIso());
  readonly fechaComoDate = computed(() => deFechaIso(this.fecha()));
  readonly rangos = signal<RangoAgenda[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  private sedes: Sede[] = [];
  private yo: Medico | null = null;

  constructor() {
    this.cargarDatosDelMedico();
  }

  /** Sedes y especialidades del propio médico, para el formulario de rangos. */
  cargarDatosDelMedico(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({ sedes: this.catalogo.sedes(), medicos: this.medicos.listar() }).subscribe({
      next: ({ sedes, medicos }) => {
        this.sedes = sedes;
        this.yo = medicos.find((m) => m.id === this.auth.perfil()?.id) ?? null;
        this.cargar();
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.agenda.listar({ fecha: this.fecha() }).subscribe({
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

  irAHoy(): void {
    this.fecha.set(hoyIso());
    this.cargar();
  }

  agregar(): void {
    this.abrirDialogo({});
  }

  modificar(rango: RangoAgenda): void {
    if (rango.turnos_confirmados === 0) {
      this.abrirDialogo({ rango });
      return;
    }
    // Se pasan las horas de los turnos confirmados para validar antes de enviar.
    this.turnos.delMedico(rango.fecha).subscribe({
      next: (turnos) =>
        this.abrirDialogo({
          rango,
          horasConfirmadas: turnos
            .filter((t) => t.id_agenda === rango.id && t.estado === 'confirmado')
            .map((t) => t.hora),
        }),
      error: (error) => this.avisos.open(mensajeDeError(error), 'Cerrar', { duration: 6000 }),
    });
  }

  eliminar(rango: RangoAgenda): void {
    confirmar(this.dialogo, {
      titulo: 'Eliminar rango horario',
      mensaje: `¿Está seguro de eliminar el rango de ${rango.hora_entrada} a ${rango.hora_salida} en ${rango.sede}?`,
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

  private abrirDialogo(extra: Partial<DatosRangoDialogo>): void {
    if (!this.yo) {
      this.avisos.open('No se encontraron tus especialidades. Recargá la página.', 'Cerrar', {
        duration: 6000,
      });
      return;
    }
    const datos: DatosRangoDialogo = {
      fecha: this.fecha(),
      medicos: [this.yo],
      idMedico: this.yo.id,
      sedes: this.sedes,
      idSedeSugerida: this.auth.perfil()?.id_sede,
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
