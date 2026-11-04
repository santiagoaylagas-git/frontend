import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Especialidad, ItemCatalogo, RecursoCatalogo, Sede } from '../models/catalogo.model';
import { Cobertura } from '../models/cobertura.model';
import { RespuestaApi } from '../models/respuesta.model';
import { API_URL, datos } from './api';

/**
 * Sedes, especialidades y coberturas: listados para los desplegables de todos los
 * roles y ABM genérico para el administrador.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);

  sedes(): Observable<Sede[]> {
    return this.listar<Sede>('sedes');
  }

  especialidades(): Observable<Especialidad[]> {
    return this.listar<Especialidad>('especialidades');
  }

  /** Listado público: también lo usa el registro de pacientes, sin sesión. */
  coberturas(): Observable<Cobertura[]> {
    return this.listar<Cobertura>('coberturas');
  }

  listar<T = ItemCatalogo>(recurso: RecursoCatalogo): Observable<T[]> {
    return this.http.get<RespuestaApi<T[]>>(`${API_URL}/${recurso}`).pipe(datos());
  }

  crear(recurso: RecursoCatalogo, valores: object): Observable<ItemCatalogo> {
    return this.http
      .post<RespuestaApi<ItemCatalogo>>(`${API_URL}/${recurso}`, valores)
      .pipe(datos());
  }

  modificar(recurso: RecursoCatalogo, id: number, valores: object): Observable<ItemCatalogo> {
    return this.http
      .put<RespuestaApi<ItemCatalogo>>(`${API_URL}/${recurso}/${id}`, valores)
      .pipe(datos());
  }

  eliminar(recurso: RecursoCatalogo, id: number): Observable<unknown> {
    return this.http.delete<RespuestaApi<unknown>>(`${API_URL}/${recurso}/${id}`).pipe(datos());
  }
}
