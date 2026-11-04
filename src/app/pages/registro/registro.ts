import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { FormularioPaciente } from '../../shared/components/formulario-paciente/formulario-paciente';

/** Registro público de pacientes. El formulario es el mismo que usa el operador. */
@Component({
  selector: 'app-registro',
  imports: [RouterLink, MatCardModule, MatButtonModule, FormularioPaciente],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private readonly router = inject(Router);
  private readonly aviso = inject(MatSnackBar);

  cuentaCreada(): void {
    this.aviso.open('Tu cuenta fue creada. Ya podés iniciar sesión con tu DNI.', 'Cerrar', {
      duration: 6000,
    });
    this.router.navigate(['/login']);
  }
}
