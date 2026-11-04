import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime } from 'rxjs';

import { FiltrosAuditoria, RegistroAuditoria } from '../../../core/models/auditoria.model';
import { ETIQUETAS_ROL, Rol } from '../../../core/models/usuario.model';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { mensajeDeError } from '../../../core/services/errores';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { aFechaIso } from '../../../shared/utils/fechas';

/** Registro de acciones sensibles, de solo lectura, con los más recientes primero. */
@Component({
  selector: 'app-auditoria',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  templateUrl: './auditoria.html',
  styles: `
    .accion {
      font: var(--mat-sys-label-medium);
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
    }
    .ALTA {
      background-color: #dcfce7;
      color: #166534;
    }
    .MODIFICACION {
      background-color: #fef3c7;
      color: #92400e;
    }
    .BAJA {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .detalle {
      max-width: 420px;
      white-space: normal;
      word-break: break-word;
    }
    .entidad {
      text-transform: capitalize;
    }
  `,
})
export class Auditoria {
  private readonly auditoria = inject(AuditoriaService);

  readonly columnas = ['fecha', 'usuario', 'accion', 'entidad', 'detalle'];
  readonly etiquetasRol = ETIQUETAS_ROL;

  readonly filtros = inject(FormBuilder).group({
    id_usuario: '' as number | '',
    entidad: '',
    desde: null as Date | null,
    hasta: null as Date | null,
  });

  readonly opciones = signal<FiltrosAuditoria>({ usuarios: [], entidades: [] });
  readonly registros = signal<RegistroAuditoria[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(0);
  readonly limite = signal(10);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor() {
    this.auditoria.filtros().subscribe({ next: (opciones) => this.opciones.set(opciones) });
    this.filtros.valueChanges.pipe(debounceTime(250), takeUntilDestroyed()).subscribe(() => {
      this.pagina.set(0);
      this.cargar();
    });
    this.cargar();
  }

  cargar(): void {
    // Mientras el rango de fechas se está escribiendo puede quedar incompleto o inválido.
    if (this.filtros.invalid) return;

    this.cargando.set(true);
    this.error.set('');
    const f = this.filtros.getRawValue();
    this.auditoria
      .listar({
        id_usuario: f.id_usuario || null,
        entidad: f.entidad || null,
        desde: f.desde ? aFechaIso(f.desde) : null,
        hasta: f.hasta ? aFechaIso(f.hasta) : null,
        pagina: this.pagina() + 1,
        limite: this.limite(),
      })
      .subscribe({
        next: (respuesta) => {
          this.registros.set(respuesta.registros);
          this.total.set(respuesta.total);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.limite.set(evento.pageSize);
    this.cargar();
  }

  etiquetaRol(rol: string): string {
    return ETIQUETAS_ROL[rol as Rol] ?? rol;
  }

  limpiarFiltros(): void {
    this.filtros.reset({ id_usuario: '', entidad: '', desde: null, hasta: null });
  }
}
