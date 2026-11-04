import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Indicador de carga mientras se espera la respuesta del backend. */
@Component({
  selector: 'app-cargando',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="cargando" role="status">
      <mat-spinner [diameter]="36" />
      <span>{{ texto() }}</span>
    </div>
  `,
  styles: `
    .cargando {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2.5rem 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Cargando {
  readonly texto = input('Cargando...');
}
