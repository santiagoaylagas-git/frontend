import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Turno } from '../../../core/models/turno.model';
import { mensajeDeError } from '../../../core/services/errores';
import { TurnoService } from '../../../core/services/turno.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';

/** "Marcar como atendido": carga diagnóstico, tratamiento y observaciones del historial. */
@Component({
  selector: 'app-atender-dialogo',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    FechaPipe,
    Aviso,
  ],
  template: `
    <h2 mat-dialog-title>Marcar como atendido</h2>
    <mat-dialog-content>
      <p class="texto-secundario">
        {{ turno.paciente_nombre }} {{ turno.paciente_apellido }} — {{ turno.fecha | fecha }}
        {{ turno.hora }} h — {{ turno.especialidad }}, {{ turno.sede }}
      </p>
      @if (enviando()) {
        <mat-progress-bar mode="indeterminate" />
      }
      <form
        [formGroup]="formulario"
        id="formulario-atencion"
        (ngSubmit)="guardar()"
        class="formulario"
      >
        <mat-form-field appearance="outline">
          <mat-label>Diagnóstico</mat-label>
          <textarea matInput formControlName="diagnostico" rows="3" maxlength="255"></textarea>
          <mat-hint align="end">{{ formulario.controls.diagnostico.value.length }}/255</mat-hint>
          <mat-error>El diagnóstico es obligatorio.</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tratamiento</mat-label>
          <textarea matInput formControlName="tratamiento" rows="2" maxlength="255"></textarea>
          <mat-hint align="end">{{ formulario.controls.tratamiento.value.length }}/255</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="2" maxlength="255"></textarea>
          <mat-hint align="end">{{ formulario.controls.observaciones.value.length }}/255</mat-hint>
        </mat-form-field>
        @if (errorBackend()) {
          <app-aviso [mensaje]="errorBackend()" />
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close type="button">Cancelar</button>
      <button matButton="filled" type="submit" form="formulario-atencion" [disabled]="enviando()">
        Guardar y marcar como atendido
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
export class AtenderDialogo {
  private readonly turnos = inject(TurnoService);
  private readonly dialogo = inject(MatDialogRef<AtenderDialogo, boolean>);
  readonly turno = inject<Turno>(MAT_DIALOG_DATA);

  readonly enviando = signal(false);
  readonly errorBackend = signal('');

  readonly formulario = inject(FormBuilder).nonNullable.group({
    diagnostico: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/\S/)]],
    tratamiento: ['', Validators.maxLength(255)],
    observaciones: ['', Validators.maxLength(255)],
  });

  guardar(): void {
    this.errorBackend.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.enviando.set(true);
    this.turnos
      .atender(this.turno.id, {
        diagnostico: v.diagnostico.trim(),
        tratamiento: v.tratamiento.trim(),
        observaciones: v.observaciones.trim(),
      })
      .subscribe({
        next: () => this.dialogo.close(true),
        error: (error) => {
          this.enviando.set(false);
          this.errorBackend.set(mensajeDeError(error));
        },
      });
  }
}
