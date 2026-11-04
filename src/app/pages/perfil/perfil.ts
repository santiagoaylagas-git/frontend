import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

import { ETIQUETAS_ROL, Perfil as DatosPerfil } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { Aviso } from '../../shared/components/aviso/aviso';
import { Cargando } from '../../shared/components/cargando/cargando';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';

@Component({
  selector: 'app-perfil',
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatButtonModule,
    RouterLink,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly auth = inject(AuthService);

  readonly datos = signal<DatosPerfil | null>(this.auth.perfil());
  readonly cargando = signal(false);
  readonly error = signal('');

  constructor() {
    // Se recarga desde GET /auth/perfil para mostrar siempre el dato vigente,
    // no el que quedó guardado en el navegador.
    this.recargar();
  }

  recargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.auth.cargarPerfil().subscribe({
      next: (perfil) => {
        this.datos.set(perfil);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeDeError(error));
        this.cargando.set(false);
      },
    });
  }

  etiquetaRol(rol: DatosPerfil['rol']): string {
    return ETIQUETAS_ROL[rol];
  }
}
