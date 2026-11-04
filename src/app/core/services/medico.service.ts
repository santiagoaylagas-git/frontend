import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Medico } from '../models/catalogo.model';
import { RespuestaApi } from '../models/respuesta.model';
import { API_URL, datos, parametros } from './api';

export interface FiltroMedicos {
  id_especialidad?: number;
  id_sede?: number;
  /** Solo médicos con agenda vigente para la especialidad y sede indicadas. */
  disponibles?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MedicoService {
  private readonly http = inject(HttpClient);

  listar(filtro: FiltroMedicos = {}): Observable<Medico[]> {
    const params = parametros({ ...filtro, disponibles: filtro.disponibles ? 1 : null });
    return this.http.get<RespuestaApi<Medico[]>>(`${API_URL}/medicos`, { params }).pipe(datos());
  }
}
