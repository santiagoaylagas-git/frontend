import { Component, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { Menu } from './layout/menu/menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, Header, Menu, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);

  readonly estaLogueado = this.auth.estaLogueado;
  readonly menuAbierto = signal(true);

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }
}
