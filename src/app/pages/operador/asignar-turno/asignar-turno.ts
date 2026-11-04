import { Component, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import { PacienteEncontrado } from '../../../core/models/paciente.model';
import { AuthService } from '../../../core/services/auth.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { BuscadorPacientes } from '../../../shared/components/buscador-pacientes/buscador-pacientes';
import { SolicitudTurno } from '../../../shared/components/solicitud-turno/solicitud-turno';

/**
 * El operador busca al paciente y le asigna un turno con el mismo flujo que
 * "Solicitar turno" del paciente, con la sede fija en la suya.
 */
@Component({
  selector: 'app-asignar-turno',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    BuscadorPacientes,
    SolicitudTurno,
    Aviso,
  ],
  template: `
    <div class="encabezado-pagina">
      <div>
        <h1><mat-icon>event_available</mat-icon>Asignar turno</h1>
        <p class="subtitulo">Buscá al paciente y elegí el turno en tu sede.</p>
      </div>
    </div>

    <mat-card appearance="outlined" class="bloque">
      <mat-card-header>
        <mat-card-title>1. Paciente</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-buscador-pacientes (seleccionado)="paciente.set($event)" />
      </mat-card-content>
    </mat-card>

    @if (paciente(); as p) {
      <mat-card appearance="outlined" class="bloque">
        <mat-card-header>
          <mat-card-title>2. Turno para {{ p.apellido }}, {{ p.nombre }}</mat-card-title>
          <mat-card-subtitle>
            DNI {{ p.dni }} · Cobertura: {{ p.cobertura ?? 'sin cobertura' }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (!miSede) {
            <app-aviso mensaje="Tu usuario no tiene una sede asignada." />
          } @else {
            <app-solicitud-turno [paciente]="p" [sedeFija]="miSede" (confirmado)="confirmado()" />
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .bloque {
      margin-bottom: 1.25rem;
    }
  `,
})
export class AsignarTurno {
  private readonly avisos = inject(MatSnackBar);
  private readonly solicitud = viewChild(SolicitudTurno);
  private readonly buscador = viewChild.required(BuscadorPacientes);
  private readonly dniInicial = inject(ActivatedRoute).snapshot.queryParamMap.get('dni');

  readonly miSede = inject(AuthService).perfil()?.id_sede ?? null;
  readonly paciente = signal<PacienteEncontrado | null>(null);

  constructor() {
    // Viniendo del alta de paciente, se busca directamente al paciente recién creado.
    if (this.dniInicial) {
      afterNextRender(() => {
        this.buscador().texto.setValue(this.dniInicial!);
        this.buscador().buscar();
      });
    }
  }

  confirmado(): void {
    const p = this.paciente();
    this.avisos.open(`Turno asignado a ${p?.nombre} ${p?.apellido}.`, 'Cerrar', { duration: 5000 });
    this.solicitud()?.reiniciar();
  }
}
