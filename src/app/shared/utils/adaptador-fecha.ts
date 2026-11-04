import { Injectable } from '@angular/core';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';

/**
 * Adaptador de fechas de los datepickers: muestra e interpreta DD/MM/AAAA
 * (el adaptador nativo interpreta lo que se escribe a mano como MM/DD/AAAA).
 */
@Injectable()
export class AdaptadorFecha extends NativeDateAdapter {
  override parse(valor: unknown): Date | null {
    if (typeof valor === 'string') {
      const partes = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (partes) {
        const [, dia, mes, anio] = partes.map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        return fecha.getMonth() === mes - 1 ? fecha : this.invalid();
      }
      return valor.trim() ? this.invalid() : null;
    }
    return super.parse(valor);
  }

  override format(fecha: Date, formato: object): string {
    if ((formato as { tipo?: string }).tipo === 'entrada') {
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      return `${dia}/${mes}/${fecha.getFullYear()}`;
    }
    return super.format(fecha, formato);
  }

  override getFirstDayOfWeek(): number {
    return 1;
  }
}

export const FORMATOS_FECHA: MatDateFormats = {
  parse: { dateInput: { tipo: 'entrada' } },
  display: {
    dateInput: { tipo: 'entrada' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
