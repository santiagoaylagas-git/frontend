import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { forkJoin } from 'rxjs';

import { Especialidad, Medico, Sede } from '../../../core/models/catalogo.model';
import { PacienteTurno } from '../../../core/models/paciente.model';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { MedicoService } from '../../../core/services/medico.service';
import { TurnoService } from '../../../core/services/turno.service';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { aFechaIso, deFechaIso } from '../../utils/fechas';
import { Aviso } from '../aviso/aviso';
import { Cargando } from '../cargando/cargando';

const PASO_HORARIO = 4;

/**
 * Solicitud de turno paso a paso: especialidad → sede → médico → fecha → horario →
 * nota y confirmación. Cada paso filtra las opciones del siguiente.
 *
 * Se reutiliza en "Solicitar turno" del paciente y en "Asignar turno" del operador
 * (que lo usa con la sede fija en la suya y para el paciente que eligió).
 */
@Component({
  selector: 'app-solicitud-turno',
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatCardModule,
    MatProgressBarModule,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  templateUrl: './solicitud-turno.html',
  styleUrl: './solicitud-turno.scss',
})
export class SolicitudTurno implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalogo = inject(CatalogoService);
  private readonly medicosApi = inject(MedicoService);
  private readonly turnos = inject(TurnoService);

  /** Paciente para quien se pide el turno (su cobertura es la que se usa). */
  readonly paciente = input.required<PacienteTurno>();
  /** Si se indica, la sede no se elige: es la del operador. */
  readonly sedeFija = input<number | null>(null);
  readonly confirmado = output<void>();

  private readonly stepper = viewChild.required(MatStepper);

  readonly formulario = this.fb.group({
    especialidad: [null as number | null, Validators.required],
    sede: [null as number | null, Validators.required],
    medico: [null as number | null, Validators.required],
    fecha: [null as string | null, Validators.required],
    hora: [null as string | null, Validators.required],
    nota: ['', [Validators.required, Validators.maxLength(40)]],
  });

  readonly especialidades = signal<Especialidad[]>([]);
  readonly sedes = signal<Sede[]>([]);
  readonly medicos = signal<Medico[]>([]);
  readonly fechas = signal<string[]>([]);
  readonly horarios = signal<string[]>([]);

  readonly cargandoCatalogos = signal(true);
  readonly cargandoMedicos = signal(false);
  readonly cargandoFechas = signal(false);
  readonly cargandoHorarios = signal(false);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly errorConfirmacion = signal('');

  readonly valores = toSignal(this.formulario.valueChanges, {
    initialValue: this.formulario.getRawValue(),
  });

  readonly especialidadElegida = computed(() =>
    this.especialidades().find((e) => e.id === this.valores().especialidad),
  );
  readonly sedeElegida = computed(() => this.sedes().find((s) => s.id === this.valores().sede));
  readonly medicoElegido = computed(() =>
    this.medicos().find((m) => m.id === this.valores().medico),
  );

  /** Solo se pueden elegir en el calendario los días en que el médico tiene agenda. */
  readonly filtroFechas = (fecha: Date | null): boolean =>
    !!fecha && this.fechas().includes(aFechaIso(fecha));

  readonly primeraFecha = computed(() =>
    this.fechas().length ? deFechaIso(this.fechas()[0]) : null,
  );
  readonly ultimaFecha = computed(() => {
    const lista = this.fechas();
    return lista.length ? deFechaIso(lista[lista.length - 1]) : null;
  });
  readonly fechaSeleccionada = computed(() => {
    const fecha = this.valores().fecha;
    return fecha ? deFechaIso(fecha) : null;
  });

  constructor() {
    const c = this.formulario.controls;

    // Cada cambio vacía los pasos siguientes y recarga las opciones que dependen de él.
    c.especialidad.valueChanges.subscribe(() => this.alCambiarEspecialidadOSede());
    c.sede.valueChanges.subscribe(() => this.alCambiarEspecialidadOSede());
    c.medico.valueChanges.subscribe((medico) => {
      this.limpiar('fecha', 'hora');
      this.fechas.set([]);
      if (medico) this.cargarFechas();
    });
    c.fecha.valueChanges.subscribe((fecha) => {
      this.limpiar('hora');
      this.horarios.set([]);
      if (fecha) this.cargarHorarios();
    });
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.cargandoCatalogos.set(true);
    this.error.set('');
    forkJoin({
      especialidades: this.catalogo.especialidades(),
      sedes: this.catalogo.sedes(),
    }).subscribe({
      next: ({ especialidades, sedes }) => {
        this.especialidades.set(especialidades);
        this.sedes.set(sedes);
        if (this.sedeFija()) {
          this.formulario.controls.sede.setValue(this.sedeFija(), { emitEvent: false });
        }
        this.cargandoCatalogos.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargandoCatalogos.set(false);
      },
    });
  }

  elegirFecha(fecha: Date | null): void {
    if (fecha) {
      this.formulario.controls.fecha.setValue(aFechaIso(fecha));
    }
  }

  confirmar(): void {
    this.errorConfirmacion.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.getRawValue();
    this.enviando.set(true);
    this.turnos
      .crear({
        id_especialidad: v.especialidad!,
        id_sede: v.sede!,
        id_medico: v.medico!,
        fecha: v.fecha!,
        hora: v.hora!,
        nota: (v.nota ?? '').trim(),
        ...(this.sedeFija() ? { id_paciente: this.paciente().id } : {}),
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.confirmado.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.enviando.set(false);
          this.errorConfirmacion.set(mensajeDeError(error));
          // El horario se ocupó o dejó de estar disponible: se vuelve a elegir horario.
          if (error.status === 409 || error.status === 400) {
            this.formulario.controls.hora.setValue(null);
            this.cargarHorarios();
            this.stepper().selectedIndex = PASO_HORARIO;
          }
        },
      });
  }

  /** Vuelve al primer paso con el formulario vacío, para pedir otro turno. */
  reiniciar(): void {
    this.stepper().reset();
    this.medicos.set([]);
    this.fechas.set([]);
    this.horarios.set([]);
    this.errorConfirmacion.set('');
    if (this.sedeFija()) {
      this.formulario.controls.sede.setValue(this.sedeFija(), { emitEvent: false });
    }
  }

  private alCambiarEspecialidadOSede(): void {
    this.limpiar('medico', 'fecha', 'hora');
    this.medicos.set([]);
    this.fechas.set([]);
    this.horarios.set([]);
    const { especialidad, sede } = this.formulario.getRawValue();
    if (especialidad && sede) {
      this.cargarMedicos(especialidad, sede);
    }
  }

  cargarMedicos(
    especialidad = this.formulario.value.especialidad,
    sede = this.formulario.value.sede,
  ): void {
    if (!especialidad || !sede) return;
    this.cargandoMedicos.set(true);
    this.error.set('');
    this.medicosApi
      .listar({ id_especialidad: especialidad, id_sede: sede, disponibles: true })
      .subscribe({
        next: (medicos) => {
          this.medicos.set(medicos);
          this.cargandoMedicos.set(false);
        },
        error: (error) => {
          this.error.set(mensajeDeError(error));
          this.cargandoMedicos.set(false);
        },
      });
  }

  cargarFechas(): void {
    const { medico, especialidad, sede } = this.formulario.getRawValue();
    if (!medico || !especialidad || !sede) return;
    this.cargandoFechas.set(true);
    this.error.set('');
    this.turnos.fechasDisponibles(medico, especialidad, sede).subscribe({
      next: (fechas) => {
        this.fechas.set(fechas);
        this.cargandoFechas.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargandoFechas.set(false);
      },
    });
  }

  cargarHorarios(): void {
    const { medico, especialidad, sede, fecha } = this.formulario.getRawValue();
    if (!medico || !especialidad || !sede || !fecha) return;
    this.cargandoHorarios.set(true);
    this.error.set('');
    this.turnos.horariosDisponibles(medico, fecha, especialidad, sede).subscribe({
      next: (respuesta) => {
        this.horarios.set(respuesta.horarios);
        this.cargandoHorarios.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargandoHorarios.set(false);
      },
    });
  }

  private limpiar(...campos: ('medico' | 'fecha' | 'hora')[]): void {
    for (const campo of campos) {
      this.formulario.controls[campo].setValue(null, { emitEvent: false });
    }
  }
}
