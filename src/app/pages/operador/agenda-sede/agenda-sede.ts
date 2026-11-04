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
import { forkJoin } from 'rxjs';

import { RangoAgenda } from '../../../core/models/agenda.model';
import { Medico, Sede } from '../../../core/models/catalogo.model';
import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { MedicoService } from '../../../core/services/medico.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { RangoDialogo } from '../../../shared/components/rango-dialogo/rango-dialogo';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { aFechaIso, deFechaIso, hoyIso, sumarDias } from '../../../shared/utils/fechas';
import { AgendaMedicoDialogo } from './agenda-medico-dialogo';
import { TurnosMedicoDialogo } from './turnos-medico-dialogo';

/** Una fila por médico con agenda ese día en la sede elegida. */
interface FilaMedico {
  idMedico: number;
  nombre: string;
  especialidades: string;
  rangos: RangoAgenda[];
}

/**
 * Agenda y turnos del operador: médicos con agenda para una fecha y sede. Puede consultar
 * cualquier sede, pero solo modificar la agenda y los turnos de la suya.
 */
@Component({
  selector: 'app-agenda-sede',
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
  ],
  templateUrl: './agenda-sede.html',
  styles: `
    .rango {
      display: block;
    }
  `,
})
export class AgendaSede {
  private readonly agenda = inject(AgendaService);
  private readonly catalogo = inject(CatalogoService);
  private readonly medicosApi = inject(MedicoService);
  private readonly auth = inject(AuthService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  readonly columnas = ['medico', 'especialidad', 'horario', 'acciones'];
  readonly miSede = this.auth.perfil()?.id_sede ?? null;

  readonly fecha = signal(hoyIso());
  readonly fechaComoDate = computed(() => deFechaIso(this.fecha()));
  readonly idSede = signal<number | null>(this.miSede);
  readonly sedes = signal<Sede[]>([]);
  readonly medicos = signal<Medico[]>([]);
  readonly rangos = signal<RangoAgenda[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  /** Las acciones solo están disponibles en la sede del operador. */
  readonly esMiSede = computed(() => this.idSede() === this.miSede);
  readonly nombreSede = computed(
    () => this.sedes().find((s) => s.id === this.idSede())?.nombre ?? '',
  );

  readonly filas = computed<FilaMedico[]>(() => {
    const porMedico = new Map<number, FilaMedico>();
    for (const rango of this.rangos()) {
      const fila = porMedico.get(rango.id_medico) ?? {
        idMedico: rango.id_medico,
        nombre: `${rango.medico_apellido}, ${rango.medico_nombre}`,
        especialidades: '',
        rangos: [],
      };
      fila.rangos.push(rango);
      porMedico.set(rango.id_medico, fila);
    }
    return [...porMedico.values()].map((fila) => ({
      ...fila,
      especialidades: [...new Set(fila.rangos.map((r) => r.especialidad))].join(', '),
    }));
  });

  constructor() {
    this.inicializar();
  }

  inicializar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({ sedes: this.catalogo.sedes(), medicos: this.medicosApi.listar() }).subscribe({
      next: ({ sedes, medicos }) => {
        this.sedes.set(sedes);
        this.medicos.set(medicos);
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
    this.agenda.listar({ fecha: this.fecha(), id_sede: this.idSede() ?? undefined }).subscribe({
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

  cambiarSede(idSede: number): void {
    this.idSede.set(idSede);
    this.cargar();
  }

  /** "Nueva agenda": cualquier médico, aunque todavía no tenga agenda, en la sede del operador. */
  nuevaAgenda(): void {
    this.dialogo
      .open(RangoDialogo, {
        width: '560px',
        data: {
          fecha: this.fecha(),
          medicos: this.medicos(),
          sedes: this.sedes(),
          sedeFija: this.miSede,
        },
      })
      .afterClosed()
      .subscribe((guardado) => {
        if (guardado) {
          this.avisos.open('Agenda cargada.', 'Cerrar', { duration: 4000 });
          this.cargar();
        }
      });
  }

  editarAgenda(fila: FilaMedico): void {
    const medico = this.medicos().find((m) => m.id === fila.idMedico);
    if (!medico) return;
    this.dialogo
      .open(AgendaMedicoDialogo, {
        width: '760px',
        data: { medico, fecha: this.fecha(), idSede: this.miSede, sedes: this.sedes() },
      })
      .afterClosed()
      .subscribe(() => this.cargar());
  }

  verTurnos(fila: FilaMedico): void {
    this.dialogo
      .open(TurnosMedicoDialogo, {
        width: '760px',
        data: { nombreMedico: fila.nombre, idMedico: fila.idMedico, fecha: this.fecha() },
      })
      .afterClosed()
      .subscribe(() => this.cargar());
  }
}
