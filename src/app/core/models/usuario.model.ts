export type Rol = 'paciente' | 'medico' | 'operador' | 'admin';

/** Datos del usuario que viajan dentro del JWT y devuelve el login. */
export interface UsuarioSesion {
  id: number;
  rol: Rol;
  id_sede: number | null;
}

/** Respuesta de POST /auth/login. */
export interface RespuestaLogin {
  token: string;
  usuario: UsuarioSesion;
}

/** Perfil completo devuelto por GET /auth/perfil. */
export interface Perfil {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  rol: Rol;
  id_sede: number | null;
  id_cobertura: number | null;
  /** Nombre de la sede (operador y médico). */
  sede?: string | null;
  /** Nombre de la cobertura (paciente). */
  cobertura?: string | null;
}

/** Cuerpo de PUT /auth/perfil: lo único que el paciente puede modificar. */
export interface DatosPersonalesPaciente {
  email: string;
  telefono: string;
  id_cobertura: number;
  password?: string;
}

/** Fila del listado de usuarios del administrador. */
export interface UsuarioListado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  rol: Rol;
  id_sede: number | null;
  sede: string | null;
  id_cobertura: number | null;
  cobertura: string | null;
}

export interface PaginaUsuarios {
  usuarios: UsuarioListado[];
  total: number;
  pagina: number;
  limite: number;
}

export interface FiltroUsuarios {
  nombre?: string;
  apellido?: string;
  rol?: Rol | '';
  id_sede?: number | null;
  pagina: number;
  limite: number;
}

/** Usuario completo para editar (GET /usuarios/:id). */
export interface UsuarioDetalle {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  rol: Rol;
  id_sede: number | null;
  id_cobertura: number | null;
  especialidades: number[];
}

/** Cuerpo de POST /usuarios y PUT /usuarios/:id. */
export interface DatosUsuario {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  rol: Rol;
  password?: string;
  id_sede?: number | null;
  id_cobertura?: number | null;
  especialidades?: number[];
}

/** Credenciales enviadas a POST /auth/login. */
export interface Credenciales {
  dni: string;
  password: string;
}

/** Cuerpo enviado a POST /auth/registro. */
export interface NuevoPaciente {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
  fecha_nacimiento: string;
  id_cobertura: number;
  telefono?: string;
}

export const ETIQUETAS_ROL: Record<Rol, string> = {
  paciente: 'Paciente',
  medico: 'Médico',
  operador: 'Operador',
  admin: 'Administrador',
};
