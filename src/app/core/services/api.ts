import { HttpParams } from '@angular/common/http';
import { OperatorFunction, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RespuestaApi } from '../models/respuesta.model';

/** URL base de la API. Se define una sola vez, en los archivos de entorno. */
export const API_URL = environment.apiUrl;

/** Extrae `datos` de la estructura uniforme de respuesta del backend. */
export function datos<T>(): OperatorFunction<RespuestaApi<T>, T> {
  return map((respuesta) => respuesta.datos);
}

/** Arma los parámetros de consulta omitiendo los valores vacíos. */
export function parametros(filtros: object): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== null && valor !== undefined && valor !== '') {
      params = params.set(clave, String(valor));
    }
  }
  return params;
}
