/** Rango horario de la agenda médica, con los nombres resueltos por el backend. */
export interface RangoAgenda {
  id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  id_medico: number;
  medico_nombre: string;
  medico_apellido: string;
  id_especialidad: number;
  especialidad: string;
  id_sede: number;
  sede: string;
  turnos_confirmados: number;
}

/** Cuerpo de POST /agenda y PUT /agenda/:id. */
export interface DatosRango {
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}

export interface FiltroAgenda {
  fecha?: string;
  id_sede?: number;
  id_medico?: number;
}
