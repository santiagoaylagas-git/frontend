/**
 * Estructura uniforme con la que responde el backend, tanto en éxito como en error.
 * Definida en el enunciado general: código numérico, texto de estado y datos.
 */
export interface RespuestaApi<T> {
  codigo: number;
  estado: string;
  datos: T;
}
