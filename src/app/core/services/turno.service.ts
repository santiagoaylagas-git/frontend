import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { RespuestaApi } from '../models/respuesta.model';
import {
  DatosAtencion,
  EstadoTurno,
  HorariosDisponibles,
  NuevoTurno,
  Turno,
  TurnoPaciente,
} from '../models/turno.model';
import { API_URL, datos, parametros } from './api';
import { NotificacionService } from './notificacion.service';

/**
 * Turnos y disponibilidad. Después de confirmar, cancelar o atender un turno se
 * refrescan las notificaciones, para que el contador de la campana se actualice
 * sin recargar la página.
 */
@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly http = inject(HttpClient);
  private readonly notificaciones = inject(NotificacionService);
  private readonly url = `${API_URL}/turnos`;

  misTurnos(): Observable<TurnoPaciente[]> {
    return this.http.get<RespuestaApi<TurnoPaciente[]>>(`${this.url}/mios`).pipe(datos());
  }

  delMedico(fecha: string, idSede?: number | null): Observable<Turno[]> {
    const params = parametros({ fecha, id_sede: idSede });
    return this.http.get<RespuestaApi<Turno[]>>(`${this.url}/medico`, { params }).pipe(datos());
  }

  deLaSede(fecha: string, idMedico?: number, estado?: EstadoTurno): Observable<Turno[]> {
    const params = parametros({ fecha, id_medico: idMedico, estado });
    return this.http.get<RespuestaApi<Turno[]>>(`${this.url}/sede`, { params }).pipe(datos());
  }

  crear(turno: NuevoTurno): Observable<unknown> {
    return this.http.post<RespuestaApi<unknown>>(this.url, turno).pipe(
      datos(),
      tap(() => this.notificaciones.cargar()),
    );
  }

  cancelar(id: number): Observable<unknown> {
    return this.http.put<RespuestaApi<unknown>>(`${this.url}/${id}/cancelar`, {}).pipe(
      datos(),
      tap(() => this.notificaciones.cargar()),
    );
  }

  /** Marca el turno como atendido y registra el historial clínico en un solo paso. */
  atender(id: number, atencion: DatosAtencion): Observable<unknown> {
    return this.http.put<RespuestaApi<unknown>>(`${this.url}/${id}/atender`, atencion).pipe(
      datos(),
      tap(() => this.notificaciones.cargar()),
    );
  }

  fechasDisponibles(
    idMedico: number,
    idEspecialidad: number,
    idSede: number,
  ): Observable<string[]> {
    const params = parametros({
      id_medico: idMedico,
      id_especialidad: idEspecialidad,
      id_sede: idSede,
    });
    return this.http
      .get<RespuestaApi<string[]>>(`${API_URL}/disponibilidad/fechas`, { params })
      .pipe(datos());
  }

  horariosDisponibles(
    idMedico: number,
    fecha: string,
    idEspecialidad: number,
    idSede: number,
  ): Observable<HorariosDisponibles> {
    const params = parametros({
      id_medico: idMedico,
      fecha,
      id_especialidad: idEspecialidad,
      id_sede: idSede,
    });
    return this.http
      .get<RespuestaApi<HorariosDisponibles>>(`${API_URL}/disponibilidad/horarios`, { params })
      .pipe(datos());
  }
}
