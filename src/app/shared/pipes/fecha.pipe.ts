import { Pipe, PipeTransform } from '@angular/core';

import { deFechaIso } from '../utils/fechas';

/**
 * Muestra una fecha del backend en formato local: DD/MM/AAAA (y la hora, si la trae y se
 * pide). Se arma a mano en lugar de usar DatePipe porque `new Date('2025-10-20')` se
 * interpreta en UTC y en Argentina mostraría el día anterior.
 *
 *   {{ '2025-10-20' | fecha }}                   -> 20/10/2025
 *   {{ '2025-10-20 16:05:00' | fecha: true }}   -> 20/10/2025 16:05
 *   {{ '2025-10-20' | fecha: 'larga' }}          -> lunes, 20 de octubre de 2025
 */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  private static readonly formatoLargo = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  transform(valor: string | null | undefined, formato: boolean | 'larga' = false): string {
    if (!valor) {
      return '';
    }
    const fecha = deFechaIso(valor);
    if (Number.isNaN(fecha.getTime())) {
      return valor;
    }
    if (formato === 'larga') {
      return FechaPipe.formatoLargo.format(fecha);
    }
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const texto = `${dia}/${mes}/${fecha.getFullYear()}`;
    if (formato === true && valor.length > 10) {
      return `${texto} ${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
    }
    return texto;
  }
}
