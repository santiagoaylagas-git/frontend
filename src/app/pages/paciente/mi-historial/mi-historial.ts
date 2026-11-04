import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { RegistroHistorial } from '../../../core/models/turno.model';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeDeError } from '../../../core/services/errores';
import { PacienteService } from '../../../core/services/paciente.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { ListaHistorial } from '../../../shared/components/lista-historial/lista-historial';

/** Historial clínico completo del paciente logueado. */
@Component({
  selector: 'app-mi-historial',
  imports: [MatIconModule, ListaHistorial, Aviso, Cargando],
  template: `
    <div class="encabezado-pagina">
      <div>
        <h1><mat-icon>description</mat-icon>Mi historial clínico</h1>
        <p class="subtitulo">Diagnósticos y tratamientos de tus consultas atendidas.</p>
      </div>
    </div>

    @if (cargando()) {
      <app-cargando />
    } @else if (error()) {
      <app-aviso [mensaje]="error()" [reintentable]="true" (reintentar)="cargar()" />
    } @else if (registros().length === 0) {
      <app-aviso tipo="vacio" mensaje="Todavía no tenés registros en tu historial clínico." />
    } @else {
      <app-lista-historial [registros]="registros()" />
    }
  `,
})
export class MiHistorial {
  private readonly pacientes = inject(PacienteService);
  private readonly auth = inject(AuthService);

  readonly registros = signal<RegistroHistorial[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor() {
    this.cargar();
  }

  cargar(): void {
    const id = this.auth.perfil()?.id;
    if (!id) return;
    this.cargando.set(true);
    this.error.set('');
    this.pacientes.historial(id).subscribe({
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
}
