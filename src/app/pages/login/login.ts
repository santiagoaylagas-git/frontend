import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly aviso = inject(MatSnackBar);

  readonly enviando = signal(false);
  readonly errorBackend = signal('');
  readonly ocultarPassword = signal(true);
  readonly sesionVencida = signal(
    this.ruta.snapshot.queryParamMap.get('vencida') === 'true',
  );

  readonly formulario = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    password: ['', [Validators.required]],
  });

  enviar(): void {
    this.errorBackend.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);

    this.auth.login(this.formulario.getRawValue()).subscribe({
      next: (perfil) => {
        this.enviando.set(false);
        this.aviso.open(`Bienvenido, ${perfil.nombre}`, 'Cerrar', { duration: 4000 });

        const destino = this.ruta.snapshot.queryParamMap.get('redirigir') ?? '/';
        this.router.navigateByUrl(destino);
      },
      error: (error) => {
        this.enviando.set(false);
        this.errorBackend.set(mensajeDeError(error));
      },
    });
  }
}
