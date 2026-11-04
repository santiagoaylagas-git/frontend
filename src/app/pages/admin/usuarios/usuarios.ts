import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, filter } from 'rxjs';

import { Sede } from '../../../core/models/catalogo.model';
import { ETIQUETAS_ROL, Rol, UsuarioListado } from '../../../core/models/usuario.model';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { mensajeDeError } from '../../../core/services/errores';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { UsuarioDialogo } from './usuario-dialogo';

@Component({
  selector: 'app-usuarios',
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    Aviso,
    Cargando,
  ],
  templateUrl: './usuarios.html',
  styles: `
    .rol {
      font: var(--mat-sys-label-medium);
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      background-color: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
  `,
})
export class Usuarios {
  private readonly usuariosApi = inject(UsuarioService);
  private readonly catalogo = inject(CatalogoService);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);

  readonly roles = Object.entries(ETIQUETAS_ROL) as [Rol, string][];
  readonly columnas = ['nombre', 'dni', 'rol', 'sede', 'email', 'acciones'];

  readonly filtros = inject(FormBuilder).nonNullable.group({
    nombre: '',
    apellido: '',
    rol: '' as Rol | '',
    id_sede: '' as number | '',
  });

  readonly usuarios = signal<UsuarioListado[]>([]);
  readonly sedes = signal<Sede[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(0);
  readonly limite = signal(10);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor() {
    this.catalogo.sedes().subscribe({ next: (sedes) => this.sedes.set(sedes) });
    this.filtros.valueChanges.pipe(debounceTime(350), takeUntilDestroyed()).subscribe(() => {
      this.pagina.set(0);
      this.cargar();
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    const f = this.filtros.getRawValue();
    this.usuariosApi
      .listar({
        nombre: f.nombre.trim(),
        apellido: f.apellido.trim(),
        rol: f.rol,
        id_sede: f.id_sede || null,
        pagina: this.pagina() + 1,
        limite: this.limite(),
      })
      .subscribe({
        next: (respuesta) => {
          this.usuarios.set(respuesta.usuarios);
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
    this.filtros.reset();
  }

  abrirFormulario(usuario?: UsuarioListado): void {
    this.dialogo
      .open(UsuarioDialogo, { data: { id: usuario?.id }, width: '640px' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.avisos.open(usuario ? 'Usuario modificado.' : 'Usuario creado.', 'Cerrar', {
          duration: 4000,
        });
        this.cargar();
      });
  }
}
