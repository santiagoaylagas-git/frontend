import { Rol } from './usuario.model';

export type AccionAuditoria = 'ALTA' | 'BAJA' | 'MODIFICACION';

export interface RegistroAuditoria {
  id: number;
  id_usuario: number;
  nombre: string;
  apellido: string;
  rol: Rol;
  accion: AccionAuditoria;
  entidad: string;
  id_entidad: number | null;
  detalle: string | null;
  fecha: string;
}

export interface PaginaAuditoria {
  registros: RegistroAuditoria[];
  total: number;
  pagina: number;
  limite: number;
}

export interface FiltrosAuditoria {
  usuarios: { id: number; nombre: string; apellido: string; rol: Rol }[];
  entidades: string[];
}

export interface ConsultaAuditoria {
  id_usuario?: number | null;
  entidad?: string | null;
  desde?: string | null;
  hasta?: string | null;
  pagina: number;
  limite: number;
}
