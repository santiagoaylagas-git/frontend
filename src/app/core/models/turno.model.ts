export type EstadoTurno = 'confirmado' | 'cancelado' | 'atendido';

export const ETIQUETAS_ESTADO: Record<EstadoTurno, string> = {
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  atendido: 'Atendido',
};

/** Turno con los nombres del paciente, médico, especialidad y sede resueltos. */
export interface Turno {
  id: number;
  nota: string | null;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  id_agenda: number;
  id_paciente: number;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_dni: string;
  paciente_fecha_nacimiento: string;
  id_cobertura: number;
  cobertura: string | null;
  id_medico: number;
  medico_nombre: string;
  medico_apellido: string;
  id_especialidad: number;
  especialidad: string;
  id_sede: number;
  sede: string;
}

/** "Mis turnos" incluye el resumen del historial si el turno fue atendido. */
export interface TurnoPaciente extends Turno {
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
}

/** Cuerpo de POST /turnos. */
export interface NuevoTurno {
  id_especialidad: number;
  id_sede: number;
  id_medico: number;
  fecha: string;
  hora: string;
  nota: string;
  id_paciente?: number;
}

/** Datos del historial clínico que carga el médico al atender. */
export interface DatosAtencion {
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
}

export interface RegistroHistorial {
  id: number;
  id_turno: number;
  id_medico: number;
  id_paciente: number;
  diagnostico: string;
  tratamiento: string | null;
  observaciones: string | null;
  fecha_registro: string;
  fecha: string;
  hora: string;
  nota: string | null;
  medico_nombre: string;
  medico_apellido: string;
  especialidad: string;
  sede: string;
}

export interface HorariosDisponibles {
  fecha: string;
  duracion_minutos: number;
  horarios: string[];
}
