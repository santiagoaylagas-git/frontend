import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';

import { Cobertura } from '../../../core/models/cobertura.model';
import { NuevoPaciente } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { aFechaIso } from '../../utils/fechas';
import { Aviso } from '../aviso/aviso';

/** Datos del paciente recién creado que se emiten al terminar el alta. */
export interface PacienteCreado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
}

/**
 * Formulario de alta de paciente, con los datos y validaciones del registro.
 * Se reutiliza en el registro público y en el alta de pacientes del operador.
 */
@Component({
  selector: 'app-formulario-paciente',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    Aviso,
  ],
  templateUrl: './formulario-paciente.html',
  styleUrl: './formulario-paciente.scss',
})
export class FormularioPaciente {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly catalogo = inject(CatalogoService);

  readonly textoBoton = input('Crear cuenta');
  readonly creado = output<PacienteCreado>();

  readonly listaCoberturas = signal<Cobertura[]>([]);
  readonly errorCoberturas = signal('');
  readonly errorBackend = signal('');
  readonly enviando = signal(false);
  readonly ocultarPassword = signal(true);

  /** No se admiten fechas de nacimiento futuras. */
  readonly fechaMaxima = new Date();

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(30)]],
    apellido: ['', [Validators.required, Validators.maxLength(30)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(30)]],
    telefono: ['', [Validators.pattern(/^\d{6,10}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fecha_nacimiento: [null as Date | null, [Validators.required]],
    id_cobertura: [null as number | null, [Validators.required]],
  });

  constructor() {
    this.cargarCoberturas();
  }

  cargarCoberturas(): void {
    this.errorCoberturas.set('');
    this.catalogo.coberturas().subscribe({
      next: (coberturas) => this.listaCoberturas.set(coberturas),
      error: (error) => this.errorCoberturas.set(mensajeDeError(error)),
    });
  }

  enviar(): void {
    this.errorBackend.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const paciente: NuevoPaciente = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      dni: valores.dni,
      email: valores.email.trim(),
      password: valores.password,
      fecha_nacimiento: aFechaIso(valores.fecha_nacimiento!),
      id_cobertura: valores.id_cobertura!,
      ...(valores.telefono ? { telefono: valores.telefono } : {}),
    };

    this.enviando.set(true);
    this.auth.registro(paciente).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.creado.emit({
          id: respuesta.datos.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          dni: paciente.dni,
        });
      },
      error: (error) => {
        this.enviando.set(false);
        this.errorBackend.set(mensajeDeError(error));
      },
    });
  }

  /** Deja el formulario vacío y sin errores, para cargar otro paciente. */
  reiniciar(): void {
    this.formulario.reset();
    this.errorBackend.set('');
  }
}
