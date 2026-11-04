import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { RespuestaApi } from '../models/respuesta.model';
import {
  DatosUsuario,
  FiltroUsuarios,
  PaginaUsuarios,
  UsuarioDetalle,
} from '../models/usuario.model';
import { API_URL, datos, parametros } from './api';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/usuarios`;

  listar(filtro: FiltroUsuarios): Observable<PaginaUsuarios> {
    return this.http
      .get<RespuestaApi<PaginaUsuarios>>(this.url, { params: parametros(filtro) })
      .pipe(datos());
  }

  obtener(id: number): Observable<UsuarioDetalle> {
    return this.http.get<RespuestaApi<UsuarioDetalle>>(`${this.url}/${id}`).pipe(datos());
  }

  crear(usuario: DatosUsuario): Observable<unknown> {
    return this.http.post<RespuestaApi<unknown>>(this.url, usuario).pipe(datos());
  }

  modificar(id: number, usuario: DatosUsuario): Observable<unknown> {
    return this.http.put<RespuestaApi<unknown>>(`${this.url}/${id}`, usuario).pipe(datos());
  }
}
