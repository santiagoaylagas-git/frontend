import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { PacienteEncontrado } from '../../../core/models/paciente.model';
import { RegistroHistorial } from '../../../core/models/turno.model';
import { mensajeDeError } from '../../../core/services/errores';
import { PacienteService } from '../../../core/services/paciente.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { BuscadorPacientes } from '../../../shared/components/buscador-pacientes/buscador-pacientes';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { ListaHistorial } from '../../../shared/components/lista-historial/lista-historial';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { calcularEdad } from '../../../shared/utils/fechas';

/**
 * El médico busca un paciente y consulta su historial clínico. El backend devuelve
 * únicamente los registros de los turnos que atendió el médico logueado.
 */
@Component({
  selector: 'app-historial-clinico',
  imports: [
    MatCardModule,
    MatIconModule,
    BuscadorPacientes,
    ListaHistorial,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  template: `
    <div class="encabezado-pagina">
      <div>
        <h1><mat-icon>description</mat-icon>Historial clínico</h1>
        <p class="subtitulo">Solo se muestran los registros de los turnos que atendiste vos.</p>
      </div>
    </div>

    <app-buscador-pacientes (seleccionado)="elegir($event)" />

    @if (paciente(); as p) {
      <mat-card appearance="outlined" class="paciente">
        <mat-card-header>
          <mat-icon mat-card-avatar class="avatar">person</mat-icon>
          <mat-card-title>{{ p.apellido }}, {{ p.nombre }}</mat-card-title>
          <mat-card-subtitle>
            DNI {{ p.dni }} · {{ edad(p) }} años (nac. {{ p.fecha_nacimiento | fecha }}) ·
            {{ p.cobertura ?? 'Sin cobertura' }}
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      @if (cargando()) {
        <app-cargando texto="Cargando historial..." />
      } @else if (error()) {
        <app-aviso [mensaje]="error()" [reintentable]="true" (reintentar)="elegir(p)" />
      } @else if (registros().length === 0) {
        <app-aviso
          tipo="vacio"
          mensaje="No hay registros de turnos de este paciente atendidos por vos."
        />
      } @else {
        <app-lista-historial [registros]="registros()" />
      }
    }
  `,
  styles: `
    .paciente {
      margin: 1.25rem 0 1rem;
      background-color: var(--mat-sys-surface-container-low);
    }
    .avatar {
      display: grid;
      place-items: center;
      color: var(--mat-sys-primary);
    }
  `,
})
export class HistorialClinico {
  private readonly pacientes = inject(PacienteService);

  readonly paciente = signal<PacienteEncontrado | null>(null);
  readonly registros = signal<RegistroHistorial[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  elegir(paciente: PacienteEncontrado): void {
    this.paciente.set(paciente);
    this.cargando.set(true);
    this.error.set('');
    this.pacientes.historial(paciente.id).subscribe({
      next: (registros) => {
        this.registros.set(registros);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  edad(paciente: PacienteEncontrado): number {
    return calcularEdad(paciente.fecha_nacimiento);
  }
}
