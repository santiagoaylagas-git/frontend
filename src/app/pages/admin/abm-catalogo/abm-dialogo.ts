import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ItemCatalogo } from '../../../core/models/catalogo.model';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { ConfigAbm } from './abm-catalogo';

/** Formulario de alta y modificación del ABM genérico, armado a partir de la configuración. */
@Component({
  selector: 'app-abm-dialogo',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    Aviso,
  ],
  template: `
    <h2 mat-dialog-title>{{ datos.item ? 'Modificar' : 'Nueva' }} {{ datos.config.singular }}</h2>
    <mat-dialog-content>
      @if (enviando()) {
        <mat-progress-bar mode="indeterminate" />
      }
      <form [formGroup]="formulario" id="formulario-abm" (ngSubmit)="guardar()" class="formulario">
        @for (campo of datos.config.campos; track campo.clave) {
          <mat-form-field appearance="outline">
            <mat-label>{{ campo.etiqueta }}</mat-label>
            <input matInput [formControlName]="campo.clave" [attr.maxlength]="campo.maximo" />
            <mat-hint align="end">
              {{ formulario.controls[campo.clave].value.length }}/{{ campo.maximo }}
            </mat-hint>
            @let control = formulario.controls[campo.clave];
            @if (control.hasError('required') || control.hasError('vacio')) {
              <mat-error>El campo {{ campo.etiqueta.toLowerCase() }} es obligatorio.</mat-error>
            } @else if (control.hasError('maxlength')) {
              <mat-error>No puede superar los {{ campo.maximo }} caracteres.</mat-error>
            } @else if (control.hasError('pattern')) {
              <mat-error>{{ campo.mensajePatron }}</mat-error>
            }
          </mat-form-field>
        }
        @if (errorBackend()) {
          <app-aviso [mensaje]="errorBackend()" />
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close type="button">Cancelar</button>
      <button matButton="filled" type="submit" form="formulario-abm" [disabled]="enviando()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .formulario {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-top: 0.5rem;
    }
  `,
})
export class AbmDialogo {
  private readonly catalogo = inject(CatalogoService);
  private readonly dialogo = inject(MatDialogRef<AbmDialogo, boolean>);
  readonly datos = inject<{ config: ConfigAbm; item?: ItemCatalogo }>(MAT_DIALOG_DATA);

  readonly enviando = signal(false);
  readonly errorBackend = signal('');

  readonly formulario = new FormGroup<Record<string, FormControl<string>>>(
    Object.fromEntries(
      this.datos.config.campos.map((campo) => {
        const validadores: ValidatorFn[] = [
          Validators.required,
          noSoloEspacios,
          Validators.maxLength(campo.maximo),
        ];
        if (campo.patron) validadores.push(Validators.pattern(campo.patron));
        const valor = String(this.datos.item?.[campo.clave] ?? '');
        return [
          campo.clave,
          new FormControl(valor, { nonNullable: true, validators: validadores }),
        ];
      }),
    ),
  );

  guardar(): void {
    this.errorBackend.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = Object.fromEntries(
      Object.entries(this.formulario.getRawValue()).map(([clave, valor]) => [clave, valor.trim()]),
    );
    const { recurso } = this.datos.config;
    const peticion = this.datos.item
      ? this.catalogo.modificar(recurso, this.datos.item.id, valores)
      : this.catalogo.crear(recurso, valores);

    this.enviando.set(true);
    peticion.subscribe({
      next: () => this.dialogo.close(true),
      error: (error) => {
        this.enviando.set(false);
        this.errorBackend.set(mensajeDeError(error));
      },
    });
  }
}

/** Rechaza los valores que solo tienen espacios. */
const noSoloEspacios: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.length > 0 && control.value.trim() === ''
    ? { vacio: true }
    : null;
