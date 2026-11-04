import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { filter, switchMap } from 'rxjs';

import { ItemCatalogo, RecursoCatalogo } from '../../../core/models/catalogo.model';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { confirmar } from '../../../shared/components/confirmar-dialogo/confirmar-dialogo';
import { AbmDialogo } from './abm-dialogo';

export interface CampoAbm {
  clave: string;
  etiqueta: string;
  /** Largo máximo, igual al de la columna en la base de datos. */
  maximo: number;
  patron?: string;
  mensajePatron?: string;
}

/** Configuración de cada pantalla de ABM, definida en la ruta. */
export interface ConfigAbm {
  recurso: RecursoCatalogo;
  titulo: string;
  singular: string;
  articulo: 'el' | 'la';
  icono: string;
  campos: CampoAbm[];
}

/**
 * ABM genérico del administrador: una misma pantalla, configurada desde la ruta,
 * sirve para sedes, especialidades y coberturas.
 */
@Component({
  selector: 'app-abm-catalogo',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    Aviso,
    Cargando,
  ],
  templateUrl: './abm-catalogo.html',
})
export class AbmCatalogo {
  private readonly catalogo = inject(CatalogoService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  readonly config = inject(ActivatedRoute).snapshot.data['abm'] as ConfigAbm;
  readonly columnas = [...this.config.campos.map((campo) => campo.clave), 'acciones'];

  readonly items = signal<ItemCatalogo[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly busqueda = signal('');

  /** Filtro de texto sobre todas las columnas. */
  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.items();
    return this.items().filter((item) =>
      this.config.campos.some((campo) =>
        String(item[campo.clave] ?? '')
          .toLowerCase()
          .includes(texto),
      ),
    );
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.catalogo.listar(this.config.recurso).subscribe({
      next: (items) => {
        this.items.set(items);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  abrirFormulario(item?: ItemCatalogo): void {
    this.dialogo
      .open(AbmDialogo, { data: { config: this.config, item }, width: '520px' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        const accion = item ? 'modificó' : 'creó';
        this.avisos.open(
          `Se ${accion} ${this.config.articulo} ${this.config.singular}.`,
          'Cerrar',
          {
            duration: 4000,
          },
        );
        this.cargar();
      });
  }

  eliminar(item: ItemCatalogo): void {
    const nombre = item[this.config.campos[0].clave];
    confirmar(this.dialogo, {
      titulo: `Eliminar ${this.config.singular}`,
      mensaje: `¿Está seguro de eliminar ${this.config.articulo} ${this.config.singular} "${nombre}"? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Sí, eliminar',
      peligro: true,
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.catalogo.eliminar(this.config.recurso, item.id)),
      )
      .subscribe({
        next: () => {
          this.avisos.open(
            `Se eliminó ${this.config.articulo} ${this.config.singular} "${nombre}".`,
            'Cerrar',
            {
              duration: 4000,
            },
          );
          this.cargar();
        },
        // Si tiene dependencias, el backend responde 409: se muestra su mensaje y el
        // listado queda como estaba.
        error: (error) =>
          this.avisos.open(mensajeDeError(error), 'Cerrar', {
            duration: 8000,
            panelClass: 'aviso-error',
          }),
      });
  }
}
