import { Component, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

import { PacienteEncontrado } from '../../../core/models/paciente.model';
import { mensajeDeError } from '../../../core/services/errores';
import { PacienteService } from '../../../core/services/paciente.service';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { Aviso } from '../aviso/aviso';
import { Cargando } from '../cargando/cargando';

/**
 * Búsqueda de pacientes por DNI o apellido. La usan el médico (historial clínico)
 * y el operador (asignar turnos).
 */
@Component({
  selector: 'app-buscador-pacientes',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  template: `
    <form class="busqueda" [formGroup]="formulario" (ngSubmit)="buscar()">
      <mat-form-field appearance="outline" class="campo">
        <mat-label>DNI o apellido del paciente</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput formControlName="texto" autocomplete="off" />
        @if (texto.hasError('minlength') || texto.hasError('required')) {
          <mat-error>Ingresá al menos 2 caracteres.</mat-error>
        }
      </mat-form-field>
      <button matButton="filled" type="submit" [disabled]="buscando()">Buscar</button>
    </form>

    @if (buscando()) {
      <app-cargando texto="Buscando pacientes..." />
    } @else if (error()) {
      <app-aviso [mensaje]="error()" [reintentable]="true" (reintentar)="buscar()" />
    } @else if (resultados(); as lista) {
      @if (lista.length === 0) {
        <app-aviso tipo="vacio" mensaje="No se encontraron pacientes con ese DNI o apellido." />
      } @else {
        <mat-selection-list
          [multiple]="false"
          class="resultados"
          aria-label="Pacientes encontrados"
        >
          @for (paciente of lista; track paciente.id) {
            <mat-list-option
              [value]="paciente"
              [selected]="paciente.id === seleccionadoId()"
              (click)="elegir(paciente)"
            >
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>{{ paciente.apellido }}, {{ paciente.nombre }}</span>
              <span matListItemLine>
                DNI {{ paciente.dni }} · Nac. {{ paciente.fecha_nacimiento | fecha }} ·
                {{ paciente.cobertura ?? 'Sin cobertura' }}
              </span>
            </mat-list-option>
          }
        </mat-selection-list>
      }
    }
  `,
  styles: `
    .busqueda {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .campo {
      flex: 1 1 auto;
      max-width: 480px;
    }
    .busqueda button {
      margin-top: 0.5rem;
    }
    .resultados {
      max-height: 320px;
      overflow: auto;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
    }
  `,
})
export class BuscadorPacientes {
  private readonly pacientes = inject(PacienteService);

  readonly seleccionado = output<PacienteEncontrado>();

  readonly texto = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  });
  readonly formulario = new FormGroup({ texto: this.texto });
  readonly resultados = signal<PacienteEncontrado[] | null>(null);
  readonly buscando = signal(false);
  readonly error = signal('');
  readonly seleccionadoId = signal<number | null>(null);

  buscar(): void {
    if (this.texto.invalid) {
      this.texto.markAsTouched();
      return;
    }
    this.buscando.set(true);
    this.error.set('');
    this.pacientes.buscar(this.texto.value.trim()).subscribe({
      next: (lista) => {
        this.resultados.set(lista);
        this.buscando.set(false);
        if (lista.length === 1) {
          this.elegir(lista[0]);
        }
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.buscando.set(false);
      },
    });
  }

  elegir(paciente: PacienteEncontrado): void {
    this.seleccionadoId.set(paciente.id);
    this.seleccionado.emit(paciente);
  }
}
