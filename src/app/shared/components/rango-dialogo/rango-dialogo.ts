import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { DatosRango, RangoAgenda } from '../../../core/models/agenda.model';
import { Medico, Sede } from '../../../core/models/catalogo.model';
import { AgendaService } from '../../../core/services/agenda.service';
import { mensajeDeError } from '../../../core/services/errores';
import {
  DURACION_TURNO_MINUTOS,
  aFechaIso,
  deFechaIso,
  horaAMinutos,
  horariosDelDia,
} from '../../utils/fechas';
import { Aviso } from '../aviso/aviso';

export interface DatosRangoDialogo {
  /** Rango a modificar; si no viene, es un alta. */
  rango?: RangoAgenda;
  /** Fecha propuesta para el alta (AAAA-MM-DD). */
  fecha: string;
  /** Médicos entre los que se puede elegir (uno solo si el médico es fijo). */
  medicos: Medico[];
  /** Médico preseleccionado (y fijo, si es el único de la lista). */
  idMedico?: number;
  sedes: Sede[];
  /** Operador: la sede es siempre la suya y no se puede cambiar. */
  sedeFija?: number | null;
  /** Médico: se preselecciona su sede, pero puede atender en otra. */
  idSedeSugerida?: number | null;
  /** Horas de los turnos confirmados del rango que se modifica. */
  horasConfirmadas?: string[];
}

/** La hora de salida tiene que ser posterior a la de entrada (y dejar lugar a un turno). */
const validarHorario: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
  const entrada = grupo.get('hora_entrada')?.value as string | null;
  const salida = grupo.get('hora_salida')?.value as string | null;
  if (!entrada || !salida) return null;
  return horaAMinutos(salida) - horaAMinutos(entrada) >= DURACION_TURNO_MINUTOS
    ? null
    : { horario: true };
};

/** Alta y modificación de un rango horario de la agenda. */
@Component({
  selector: 'app-rango-dialogo',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    Aviso,
  ],
  templateUrl: './rango-dialogo.html',
  styleUrl: './rango-dialogo.scss',
})
export class RangoDialogo {
  private readonly fb = inject(FormBuilder);
  private readonly agenda = inject(AgendaService);
  private readonly dialogo = inject(MatDialogRef<RangoDialogo, boolean>);
  readonly datos = inject<DatosRangoDialogo>(MAT_DIALOG_DATA);

  readonly esEdicion = !!this.datos.rango;
  readonly medicoFijo = this.esEdicion || this.datos.medicos.length === 1;
  readonly horarios = horariosDelDia();
  readonly horasConfirmadas = [...(this.datos.horasConfirmadas ?? [])].sort();

  readonly enviando = signal(false);
  readonly errorBackend = signal('');

  readonly formulario = this.fb.group(
    {
      id_medico: [this.datos.rango?.id_medico ?? this.datos.idMedico ?? null, Validators.required],
      fecha: [
        deFechaIso(this.datos.rango?.fecha ?? this.datos.fecha) as Date | null,
        Validators.required,
      ],
      hora_entrada: [this.datos.rango?.hora_entrada ?? null, Validators.required],
      hora_salida: [this.datos.rango?.hora_salida ?? null, Validators.required],
      id_especialidad: [this.datos.rango?.id_especialidad ?? null, Validators.required],
      id_sede: [
        this.datos.rango?.id_sede ?? this.datos.sedeFija ?? this.datos.idSedeSugerida ?? null,
        Validators.required,
      ],
    },
    { validators: [validarHorario, (grupo) => this.validarTurnosConfirmados(grupo)] },
  );

  private readonly idMedico = toSignal(this.formulario.controls.id_medico.valueChanges, {
    initialValue: this.formulario.controls.id_medico.value,
  });

  readonly medico = computed(() => this.datos.medicos.find((m) => m.id === this.idMedico()));
  readonly especialidades = computed(() => this.medico()?.especialidades ?? []);

  constructor() {
    if (this.medicoFijo) {
      this.formulario.controls.id_medico.disable();
    }
    if (this.datos.sedeFija) {
      this.formulario.controls.id_sede.disable();
    }
    this.preseleccionarEspecialidad();

    this.formulario.controls.id_medico.valueChanges.subscribe(() => {
      this.formulario.controls.id_especialidad.setValue(null);
      this.preseleccionarEspecialidad();
    });
  }

  guardar(): void {
    this.errorBackend.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.getRawValue();
    const rango: DatosRango = {
      id_medico: v.id_medico!,
      fecha: aFechaIso(v.fecha!),
      hora_entrada: v.hora_entrada!,
      hora_salida: v.hora_salida!,
      id_especialidad: v.id_especialidad!,
      id_sede: v.id_sede!,
    };

    const peticion = this.datos.rango
      ? this.agenda.modificar(this.datos.rango.id, rango)
      : this.agenda.crear(rango);

    this.enviando.set(true);
    peticion.subscribe({
      next: () => this.dialogo.close(true),
      error: (error) => {
        this.enviando.set(false);
        this.errorBackend.set(mensajeDeError(error));
      },
    });
  }

  nombreMedico(medico: Medico): string {
    return `${medico.apellido}, ${medico.nombre}`;
  }

  private preseleccionarEspecialidad(): void {
    const especialidades = this.especialidades();
    if (especialidades.length === 1) {
      this.formulario.controls.id_especialidad.setValue(especialidades[0].id);
    }
  }

  /**
   * Si el rango tiene turnos confirmados, no se puede cambiar de día, sede ni
   * especialidad, ni achicar el horario dejando algún turno afuera.
   */
  private validarTurnosConfirmados(grupo: AbstractControl): ValidationErrors | null {
    const rango = this.datos.rango;
    if (!rango || this.horasConfirmadas.length === 0) return null;

    const valor = (campo: string) => grupo.get(campo)?.value;
    const fechaElegida = valor('fecha') as Date | null;
    const entrada = valor('hora_entrada') as string | null;
    const salida = valor('hora_salida') as string | null;
    if (
      (fechaElegida ? aFechaIso(fechaElegida) : null) !== rango.fecha ||
      valor('id_sede') !== rango.id_sede ||
      valor('id_especialidad') !== rango.id_especialidad
    ) {
      return { contextoConTurnos: true };
    }
    if (!entrada || !salida) return null;

    const primera = horaAMinutos(this.horasConfirmadas[0]);
    const ultima = horaAMinutos(this.horasConfirmadas[this.horasConfirmadas.length - 1]);
    if (horaAMinutos(entrada) > primera || horaAMinutos(salida) < ultima + DURACION_TURNO_MINUTOS) {
      return { turnosAfuera: true };
    }
    return null;
  }
}
