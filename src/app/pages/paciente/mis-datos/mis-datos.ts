import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

import { Cobertura } from '../../../core/models/cobertura.model';
import { Perfil } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { calcularEdad } from '../../../shared/utils/fechas';

/** La nueva contraseña y su repetición tienen que coincidir. */
function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
  const nueva = grupo.get('password')?.value;
  const repetida = grupo.get('repetirPassword')?.value;
  return nueva && nueva !== repetida ? { noCoinciden: true } : null;
}

/**
 * Datos personales del paciente: todo se muestra, pero solo se pueden modificar
 * email, contraseña, teléfono y cobertura.
 */
@Component({
  selector: 'app-mis-datos',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  templateUrl: './mis-datos.html',
  styleUrl: './mis-datos.scss',
})
export class MisDatos {
  private readonly auth = inject(AuthService);
  private readonly catalogo = inject(CatalogoService);
  private readonly avisos = inject(MatSnackBar);

  readonly perfil = signal<Perfil | null>(null);
  readonly coberturas = signal<Cobertura[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly errorBackend = signal('');
  readonly ocultarPassword = signal(true);

  readonly formulario = inject(FormBuilder).nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(30)]],
      telefono: ['', [Validators.pattern(/^\d{6,10}$/)]],
      id_cobertura: [null as number | null, Validators.required],
      password: ['', [Validators.minLength(6)]],
      repetirPassword: [''],
    },
    { validators: passwordsIguales },
  );

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      perfil: this.auth.cargarPerfil(),
      coberturas: this.catalogo.coberturas(),
    }).subscribe({
      next: ({ perfil, coberturas }) => {
        this.coberturas.set(coberturas);
        this.mostrar(perfil);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  edad(perfil: Perfil): number {
    return calcularEdad(perfil.fecha_nacimiento);
  }

  guardar(): void {
    this.errorBackend.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.enviando.set(true);
    this.auth
      .actualizarDatosPersonales({
        email: v.email.trim(),
        telefono: v.telefono,
        id_cobertura: v.id_cobertura!,
        ...(v.password ? { password: v.password } : {}),
      })
      .subscribe({
        next: (perfil) => {
          this.enviando.set(false);
          this.mostrar(perfil);
          this.avisos.open(
            v.password ? 'Datos y contraseña actualizados.' : 'Datos actualizados.',
            'Cerrar',
            { duration: 4000 },
          );
        },
        error: (error) => {
          this.enviando.set(false);
          this.errorBackend.set(mensajeDeError(error));
        },
      });
  }

  private mostrar(perfil: Perfil): void {
    this.perfil.set(perfil);
    this.formulario.reset({
      email: perfil.email,
      telefono: perfil.telefono ?? '',
      id_cobertura: perfil.id_cobertura,
      password: '',
      repetirPassword: '',
    });
  }
}
