import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Notificacion } from '../models/notificacion.model';
import { RespuestaApi } from '../models/respuesta.model';
import { API_URL, datos } from './api';

/**
 * Estado de las notificaciones del usuario logueado, compartido entre la campana del
 * encabezado y las pantallas que confirman, cancelan o atienden turnos.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/notificaciones`;

  private readonly lista = signal<Notificacion[]>([]);

  readonly notificaciones = this.lista.asReadonly();
  readonly noLeidas = computed(() => this.lista().filter((n) => !n.leida).length);
  readonly cargando = signal(false);
  readonly error = signal('');

  /** Vuelve a pedir las notificaciones. Un error no borra las que ya se mostraban. */
  cargar(): void {
    this.cargando.set(true);
    this.http
      .get<RespuestaApi<Notificacion[]>>(this.url)
      .pipe(datos())
      .subscribe({
        next: (notificaciones) => {
          this.lista.set(notificaciones);
          this.error.set('');
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las notificaciones.');
          this.cargando.set(false);
        },
      });
  }

  marcarLeida(id: number): Observable<unknown> {
    return this.http.put<RespuestaApi<unknown>>(`${this.url}/${id}/leida`, {}).pipe(
      datos(),
      tap(() =>
        this.lista.update((lista) => lista.map((n) => (n.id === id ? { ...n, leida: 1 } : n))),
      ),
    );
  }

  limpiar(): void {
    this.lista.set([]);
    this.error.set('');
  }
}
