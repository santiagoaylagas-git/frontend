import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, of } from 'rxjs';

import { Especialidad, Sede } from '../../../core/models/catalogo.model';
import { Cobertura } from '../../../core/models/cobertura.model';
import { DatosUsuario, ETIQUETAS_ROL, Rol } from '../../../core/models/usuario.model';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { aFechaIso, deFechaIso } from '../../../shared/utils/fechas';

/** Tipos de usuario que el administrador puede dar de alta desde esta pantalla. */
const ROLES_ALTA: Rol[] = ['operador', 'medico', 'admin'];

/**
 * Alta y edición de usuarios. El operador y el médico tienen sede; el administrador no.
 * Al médico se le asignan además sus especialidades. El paciente se edita con su cobertura.
 */
@Component({
  selector: 'app-usuario-dialogo',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    Aviso,
    Cargando,
  ],
  templateUrl: './usuario-dialogo.html',
  styles: `
    .formulario {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-top: 0.5rem;
    }
    .fila {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1rem;
    }
  `,
})
export class UsuarioDialogo {
  private readonly fb = inject(FormBuilder);
  private readonly usuarios = inject(UsuarioService);
  private readonly catalogo = inject(CatalogoService);
  private readonly dialogo = inject(MatDialogRef<UsuarioDialogo, boolean>);
  private readonly id = inject<{ id?: number }>(MAT_DIALOG_DATA).id;

  readonly esEdicion = this.id !== undefined;
  readonly rolesAlta = ROLES_ALTA.map((rol) => ({ rol, etiqueta: ETIQUETAS_ROL[rol] }));
  readonly etiquetas = ETIQUETAS_ROL;
  readonly fechaMaxima = new Date();

  readonly sedes = signal<Sede[]>([]);
  readonly especialidades = signal<Especialidad[]>([]);
  readonly coberturas = signal<Cobertura[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly errorBackend = signal('');
  readonly ocultarPassword = signal(true);

  readonly formulario = this.fb.nonNullable.group({
    rol: ['medico' as Rol, Validators.required],
    nombre: ['', [Validators.required, Validators.maxLength(30)]],
    apellido: ['', [Validators.required, Validators.maxLength(30)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(30)]],
    telefono: ['', [Validators.pattern(/^\d{6,10}$/)]],
    fecha_nacimiento: [null as Date | null, Validators.required],
    password: [
      '',
      this.esEdicion ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)],
    ],
    id_sede: [null as number | null],
    id_cobertura: [null as number | null],
    especialidades: [[] as number[]],
  });

  readonly rol = toSignal(this.formulario.controls.rol.valueChanges, {
    initialValue: this.formulario.controls.rol.value,
  });
  readonly llevaSede = computed(() => this.rol() === 'medico' || this.rol() === 'operador');

  constructor() {
    if (this.esEdicion) {
      // El tipo de usuario no se cambia una vez creado.
      this.formulario.controls.rol.disable();
    }
    this.formulario.controls.rol.valueChanges.subscribe(() => this.aplicarReglasDelRol());
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      sedes: this.catalogo.sedes(),
      especialidades: this.catalogo.especialidades(),
      coberturas: this.catalogo.coberturas(),
      usuario: this.esEdicion ? this.usuarios.obtener(this.id!) : of(null),
    }).subscribe({
      next: ({ sedes, especialidades, coberturas, usuario }) => {
        this.sedes.set(sedes);
        this.especialidades.set(especialidades);
        this.coberturas.set(coberturas);
        if (usuario) {
          this.formulario.patchValue({
            ...usuario,
            telefono: usuario.telefono ?? '',
            fecha_nacimiento: deFechaIso(usuario.fecha_nacimiento),
          });
        }
        this.aplicarReglasDelRol();
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    this.errorBackend.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const v = this.formulario.getRawValue();
    const usuario: DatosUsuario = {
      rol: v.rol,
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      dni: v.dni,
      email: v.email.trim(),
      telefono: v.telefono,
      fecha_nacimiento: aFechaIso(v.fecha_nacimiento!),
      id_sede: this.llevaSede() ? v.id_sede : null,
      id_cobertura: v.rol === 'paciente' ? v.id_cobertura : null,
      especialidades: v.rol === 'medico' ? v.especialidades : [],
      ...(v.password ? { password: v.password } : {}),
    };

    const peticion = this.esEdicion
      ? this.usuarios.modificar(this.id!, usuario)
      : this.usuarios.crear(usuario);

    this.enviando.set(true);
    peticion.subscribe({
      next: () => this.dialogo.close(true),
      error: (error) => {
        this.enviando.set(false);
        this.errorBackend.set(mensajeDeError(error));
      },
    });
  }

  /** Sede obligatoria para médico y operador; especialidades para el médico; cobertura para el paciente. */
  private aplicarReglasDelRol(): void {
    const rol = this.formulario.controls.rol.value;
    const { id_sede, especialidades, id_cobertura } = this.formulario.controls;

    id_sede.setValidators(rol === 'medico' || rol === 'operador' ? Validators.required : null);
    especialidades.setValidators(rol === 'medico' ? Validators.required : null);
    id_cobertura.setValidators(rol === 'paciente' ? Validators.required : null);

    for (const control of [id_sede, especialidades, id_cobertura]) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }
}
