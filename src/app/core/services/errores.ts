import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae el mensaje de error del backend, que viaja en la propiedad `estado`
 * de la estructura uniforme de respuesta. Si la petición no llegó a destino
 * (servidor caído, CORS, sin red) devuelve un mensaje genérico.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verificá que el backend esté levantado.';
    }
    const estado = error.error?.estado;
    if (typeof estado === 'string' && estado.length > 0) {
      return estado;
    }
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}
