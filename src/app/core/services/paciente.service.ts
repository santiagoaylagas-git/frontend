import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PacienteEncontrado } from '../models/paciente.model';
import { RespuestaApi } from '../models/respuesta.model';
import { RegistroHistorial } from '../models/turno.model';
import { API_URL, datos, parametros } from './api';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);

  /** Búsqueda por DNI o apellido (operador, médico y administrador). */
  buscar(texto: string): Observable<PacienteEncontrado[]> {
    return this.http
      .get<RespuestaApi<PacienteEncontrado[]>>(`${API_URL}/pacientes`, {
        params: parametros({ q: texto }),
      })
      .pipe(datos());
  }

  /** Para el médico, el backend devuelve solo los registros de los turnos que atendió él. */
  historial(idPaciente: number): Observable<RegistroHistorial[]> {
    return this.http
      .get<RespuestaApi<RegistroHistorial[]>>(`${API_URL}/historial/${idPaciente}`)
      .pipe(datos());
  }
}
