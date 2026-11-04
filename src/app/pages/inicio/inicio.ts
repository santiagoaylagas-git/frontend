import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { OPCIONES_POR_ROL } from '../../layout/menu/opciones-menu';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatListModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  private readonly auth = inject(AuthService);

  readonly estaLogueado = this.auth.estaLogueado;
  readonly nombreCompleto = this.auth.nombreCompleto;

  readonly opciones = computed(() => {
    const rol = this.auth.rol();
    return rol ? OPCIONES_POR_ROL[rol] : [];
  });
}
