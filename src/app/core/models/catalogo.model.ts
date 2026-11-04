export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

export interface Especialidad {
  id: number;
  descripcion: string;
}

/** Médico tal como lo devuelve GET /medicos: sin datos personales. */
export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  id_sede: number | null;
  especialidades: Especialidad[];
}

/** Recursos de la API administrables con el ABM genérico. */
export type RecursoCatalogo = 'sedes' | 'especialidades' | 'coberturas';

/** Fila genérica de un catálogo (sede, especialidad o cobertura). */
export type ItemCatalogo = { id: number } & Record<string, string | number>;
