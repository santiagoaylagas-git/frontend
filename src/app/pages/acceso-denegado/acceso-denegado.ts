import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ETIQUETAS_ROL } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './acceso-denegado.html',
  styleUrl: './acceso-denegado.scss',
})
export class AccesoDenegado {
  private readonly auth = inject(AuthService);

  readonly mensaje = computed(() => {
    const rol = this.auth.rol();
    const tipo = rol ? ` (${ETIQUETAS_ROL[rol]})` : '';
    return `Esta sección no está disponible para tu tipo de usuario${tipo}.`;
  });
}
