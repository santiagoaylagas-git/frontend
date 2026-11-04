export interface Periodo {
  desde: string | null;
  hasta: string | null;
}

export interface TurnosPorEspecialidad {
  periodo: Periodo;
  especialidades: { id_especialidad: number; descripcion: string; cantidad: number }[];
}

export interface TurnosPorSede {
  periodo: Periodo;
  sedes: { id_sede: number; nombre: string; cantidad: number }[];
}

export interface RankingMedicos {
  periodo: Periodo;
  ranking: { id_medico: number; nombre: string; apellido: string; turnos_atendidos: number }[];
}

export interface TasaCancelacion {
  periodo: Periodo;
  total: number;
  cancelados: number;
  tasa_cancelacion_porcentaje: number;
}

export interface Reportes {
  porEspecialidad: TurnosPorEspecialidad;
  porSede: TurnosPorSede;
  ranking: RankingMedicos;
  cancelacion: TasaCancelacion;
}
