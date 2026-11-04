import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map } from 'rxjs';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  /** Acción destructiva (eliminar, cancelar): el botón se muestra en color de error. */
  peligro?: boolean;
}

/** Diálogo genérico de confirmación ("¿Está seguro de...?"). */
@Component({
  selector: 'app-confirmar-dialogo',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="titulo">
      <mat-icon [class.peligro]="datos.peligro">{{ datos.peligro ? 'warning' : 'help' }}</mat-icon>
      {{ datos.titulo }}
    </h2>
    <mat-dialog-content>
      <p>{{ datos.mensaje }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton [mat-dialog-close]="false">No, volver</button>
      <button
        matButton="filled"
        [class.boton-peligro]="datos.peligro"
        [mat-dialog-close]="true"
        cdkFocusInitial
      >
        {{ datos.textoConfirmar ?? 'Sí, confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .titulo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .peligro {
      color: var(--mat-sys-error);
    }
  `,
})
export class ConfirmarDialogo {
  readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}

/** Abre el diálogo de confirmación y emite true solo si el usuario confirma. */
export function confirmar(dialogo: MatDialog, datos: DatosConfirmacion): Observable<boolean> {
  return dialogo
    .open(ConfirmarDialogo, { data: datos, width: '440px' })
    .afterClosed()
    .pipe(map((respuesta) => respuesta === true));
}
