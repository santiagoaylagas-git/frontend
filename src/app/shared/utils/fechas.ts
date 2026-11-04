/**
 * Utilidades de fechas. El backend usa AAAA-MM-DD para las fechas y HH:MM para las horas;
 * acá se convierten siempre con la fecha LOCAL, nunca con UTC, para no correr el día.
 */

/** Date -> AAAA-MM-DD (fecha local). */
export function aFechaIso(fecha: Date): string {
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const dia = `${fecha.getDate()}`.padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** AAAA-MM-DD (o AAAA-MM-DD HH:MM:SS) -> Date local. */
export function deFechaIso(valor: string): Date {
  const [fecha, hora = '00:00:00'] = valor.split(/[ T]/);
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [horas, minutos, segundos = 0] = hora.split(':').map(Number);
  return new Date(anio, mes - 1, dia, horas, minutos, segundos);
}

export function hoyIso(): string {
  return aFechaIso(new Date());
}

/** Suma (o resta) días a una fecha AAAA-MM-DD. */
export function sumarDias(fechaIso: string, dias: number): string {
  const fecha = deFechaIso(fechaIso);
  fecha.setDate(fecha.getDate() + dias);
  return aFechaIso(fecha);
}

/** Edad en años cumplidos a partir de la fecha de nacimiento AAAA-MM-DD. */
export function calcularEdad(fechaNacimiento: string): number {
  const nacimiento = deFechaIso(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const yaCumplio =
    hoy.getMonth() > nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!yaCumplio) {
    edad--;
  }
  return edad;
}

/** Momento de un turno (fecha AAAA-MM-DD + hora HH:MM) como Date local. */
export function momentoTurno(fecha: string, hora: string): Date {
  return deFechaIso(`${fecha} ${hora}:00`);
}

export function horaAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

/** Horarios cada 30 minutos, coherentes con la duración de los turnos del backend. */
export const DURACION_TURNO_MINUTOS = 30;

export function horariosDelDia(desde = '07:00', hasta = '22:00'): string[] {
  const horarios: string[] = [];
  for (let m = horaAMinutos(desde); m <= horaAMinutos(hasta); m += DURACION_TURNO_MINUTOS) {
    horarios.push(
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`,
    );
  }
  return horarios;
}
