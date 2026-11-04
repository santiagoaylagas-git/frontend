import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ETIQUETAS_ESTADO, EstadoTurno } from '../../../core/models/turno.model';

/** Etiqueta de color para distinguir visualmente el estado de un turno. */
@Component({
  selector: 'app-estado-turno',
  imports: [MatIconModule],
  template: `
    <span class="estado" [class]="estado()">
      <mat-icon>{{ icono() }}</mat-icon>
      {{ etiqueta() }}
    </span>
  `,
  styles: `
    .estado {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.15rem 0.65rem 0.15rem 0.45rem;
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      white-space: nowrap;
    }
    mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .confirmado {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .atendido {
      background-color: #dcfce7;
      color: #166534;
    }
    .cancelado {
      background-color: #fee2e2;
      color: #991b1b;
    }
  `,
})
export class EstadoTurnoEtiqueta {
  readonly estado = input.required<EstadoTurno>();
  readonly etiqueta = computed(() => ETIQUETAS_ESTADO[this.estado()]);
  readonly icono = computed(
    () =>
      ({ confirmado: 'event_available', atendido: 'task_alt', cancelado: 'event_busy' })[
        this.estado()
      ],
  );
}
