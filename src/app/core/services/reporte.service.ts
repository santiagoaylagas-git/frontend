import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';

import {
  RankingMedicos,
  Reportes,
  TasaCancelacion,
  TurnosPorEspecialidad,
  TurnosPorSede,
} from '../models/reporte.model';
import { RespuestaApi } from '../models/respuesta.model';
import { API_URL, datos, parametros } from './api';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/reportes`;

  /** Pide los cuatro indicadores a la vez, con el mismo rango de fechas. */
  todos(desde: string | null, hasta: string | null): Observable<Reportes> {
    const params = parametros({ desde, hasta });
    return forkJoin({
      porEspecialidad: this.http
        .get<RespuestaApi<TurnosPorEspecialidad>>(`${this.url}/turnos-por-especialidad`, { params })
        .pipe(datos()),
      porSede: this.http
        .get<RespuestaApi<TurnosPorSede>>(`${this.url}/turnos-por-sede`, { params })
        .pipe(datos()),
      ranking: this.http
        .get<RespuestaApi<RankingMedicos>>(`${this.url}/ranking-medicos`, { params })
        .pipe(datos()),
      cancelacion: this.http
        .get<RespuestaApi<TasaCancelacion>>(`${this.url}/tasa-cancelacion`, { params })
        .pipe(datos()),
    });
  }
}
