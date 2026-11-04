import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DatosRango, FiltroAgenda, RangoAgenda } from '../models/agenda.model';
import { RespuestaApi } from '../models/respuesta.model';
import { API_URL, datos, parametros } from './api';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/agenda`;

  /** Para el médico, el backend devuelve siempre su propia agenda. */
  listar(filtro: FiltroAgenda): Observable<RangoAgenda[]> {
    return this.http
      .get<RespuestaApi<RangoAgenda[]>>(this.url, { params: parametros(filtro) })
      .pipe(datos());
  }

  crear(rango: DatosRango): Observable<unknown> {
    return this.http.post<RespuestaApi<unknown>>(this.url, rango).pipe(datos());
  }

  modificar(id: number, rango: DatosRango): Observable<unknown> {
    return this.http.put<RespuestaApi<unknown>>(`${this.url}/${id}`, rango).pipe(datos());
  }

  eliminar(id: number): Observable<unknown> {
    return this.http.delete<RespuestaApi<unknown>>(`${this.url}/${id}`).pipe(datos());
  }
}
