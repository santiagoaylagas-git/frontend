import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { RegistroHistorial } from '../../../core/models/turno.model';
import { FechaPipe } from '../../pipes/fecha.pipe';

/** Registros del historial clínico, del más reciente al más antiguo. */
@Component({
  selector: 'app-lista-historial',
  imports: [MatCardModule, MatIconModule, FechaPipe],
  template: `
    @for (registro of registros(); track registro.id) {
      <mat-card appearance="outlined" class="registro">
        <mat-card-header>
          <mat-icon mat-card-avatar class="avatar">description</mat-icon>
          <mat-card-title
            >{{ registro.fecha | fecha: 'larga' }} — {{ registro.hora }} h</mat-card-title
          >
          <mat-card-subtitle>
            {{ registro.especialidad }} · {{ registro.sede }} · Dr/a. {{ registro.medico_nombre }}
            {{ registro.medico_apellido }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <dl>
            @if (registro.nota) {
              <dt>Motivo</dt>
              <dd>{{ registro.nota }}</dd>
            }
            <dt>Diagnóstico</dt>
            <dd>{{ registro.diagnostico }}</dd>
            <dt>Tratamiento</dt>
            <dd>{{ registro.tratamiento || '—' }}</dd>
            <dt>Observaciones</dt>
            <dd>{{ registro.observaciones || '—' }}</dd>
          </dl>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .registro {
      margin-bottom: 1rem;
    }
    .avatar {
      display: grid;
      place-items: center;
      color: var(--mat-sys-primary);
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 0.4rem 1.25rem;
      margin: 0.75rem 0 0;
    }
    dt {
      font-weight: 500;
      color: var(--mat-sys-on-surface-variant);
    }
    dd {
      margin: 0;
    }
  `,
})
export class ListaHistorial {
  readonly registros = input.required<RegistroHistorial[]>();
}
