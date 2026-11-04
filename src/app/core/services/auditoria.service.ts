import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ConsultaAuditoria, FiltrosAuditoria, PaginaAuditoria } from '../models/auditoria.model';
import { RespuestaApi } from '../models/respuesta.model';
import { API_URL, datos, parametros } from './api';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/auditoria`;

  listar(consulta: ConsultaAuditoria): Observable<PaginaAuditoria> {
    return this.http
      .get<RespuestaApi<PaginaAuditoria>>(this.url, { params: parametros(consulta) })
      .pipe(datos());
  }

  filtros(): Observable<FiltrosAuditoria> {
    return this.http.get<RespuestaApi<FiltrosAuditoria>>(`${this.url}/filtros`).pipe(datos());
  }
}
