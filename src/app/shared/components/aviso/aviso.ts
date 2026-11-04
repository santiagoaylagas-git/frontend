import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Mensaje en lugar de contenido: errores del backend, listados sin resultados
 * o información. Con `reintentable` muestra el botón "Reintentar".
 */
@Component({
  selector: 'app-aviso',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="aviso" [class]="tipo()" [attr.role]="tipo() === 'error' ? 'alert' : null">
      <mat-icon>{{ iconos[tipo()] }}</mat-icon>
      <span class="texto">{{ mensaje() }}<ng-content /></span>
      @if (reintentable()) {
        <button matButton type="button" (click)="reintentar.emit()">Reintentar</button>
      }
    </div>
  `,
  styles: `
    .aviso {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      margin: 0.75rem 0;
      font: var(--mat-sys-body-medium);
    }
    .texto {
      flex: 1 1 auto;
    }
    mat-icon {
      flex-shrink: 0;
    }
    .error {
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
    .vacio {
      background-color: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      justify-content: center;
      padding: 1.5rem;
    }
    .vacio .texto {
      flex: 0 1 auto;
    }
    .info {
      background-color: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
  `,
})
export class Aviso {
  readonly tipo = input<'error' | 'vacio' | 'info'>('error');
  readonly mensaje = input('');
  readonly reintentable = input(false);
  readonly reintentar = output<void>();

  readonly iconos = { error: 'error_outline', vacio: 'inbox', info: 'info' };
}
