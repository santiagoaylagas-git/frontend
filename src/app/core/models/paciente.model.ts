/** Resultado de la búsqueda de pacientes (GET /pacientes?q=). */
export interface PacienteEncontrado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  email: string;
  telefono: string;
  id_cobertura: number | null;
  cobertura: string | null;
}

/** Datos mínimos del paciente para quien se pide un turno. */
export interface PacienteTurno {
  id: number;
  nombre: string;
  apellido: string;
  cobertura: string | null;
}
