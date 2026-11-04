import { Component, computed, inject } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ETIQUETAS_ROL } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { OPCIONES_POR_ROL } from './opciones-menu';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {
  private readonly auth = inject(AuthService);

  readonly rol = this.auth.rol;

  readonly opciones = computed(() => {
    const rol = this.rol();
    return rol ? OPCIONES_POR_ROL[rol] : [];
  });

  readonly etiquetaRol = computed(() => {
    const rol = this.rol();
    return rol ? ETIQUETAS_ROL[rol] : '';
  });
}
