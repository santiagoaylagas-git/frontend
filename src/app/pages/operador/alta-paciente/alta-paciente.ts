import { Component, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Aviso } from '../../../shared/components/aviso/aviso';
import {
  FormularioPaciente,
  PacienteCreado,
} from '../../../shared/components/formulario-paciente/formulario-paciente';

/** Alta de pacientes por el operador: el mismo formulario y validaciones que el registro. */
@Component({
  selector: 'app-alta-paciente',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink, FormularioPaciente, Aviso],
  template: `
    <div class="encabezado-pagina">
      <div>
        <h1><mat-icon>person_add</mat-icon>Alta de paciente</h1>
        <p class="subtitulo">Mismos datos y validaciones que el registro de pacientes.</p>
      </div>
    </div>

    @if (ultimo(); as paciente) {
      <app-aviso tipo="info">
        Se dio de alta a <strong>{{ paciente.apellido }}, {{ paciente.nombre }}</strong> (DNI
        {{ paciente.dni }}).
        <a matButton routerLink="/operador/asignar-turno" [queryParams]="{ dni: paciente.dni }">
          Asignarle un turno
        </a>
      </app-aviso>
    }

    <mat-card appearance="outlined" class="tarjeta">
      <mat-card-content>
        <app-formulario-paciente textoBoton="Dar de alta" (creado)="creado($event)" />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .tarjeta {
      max-width: 640px;
    }
  `,
})
export class AltaPaciente {
  private readonly avisos = inject(MatSnackBar);
  private readonly formulario = viewChild.required(FormularioPaciente);

  readonly ultimo = signal<PacienteCreado | null>(null);

  creado(paciente: PacienteCreado): void {
    this.ultimo.set(paciente);
    this.avisos.open('Paciente dado de alta.', 'Cerrar', { duration: 4000 });
    this.formulario().reiniciar();
  }
}
