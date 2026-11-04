import { Routes } from '@angular/router';

import { rolGuard } from './core/guards/rol.guard';
import { sesionGuard } from './core/guards/sesion.guard';
import { ConfigAbm } from './pages/admin/abm-catalogo/abm-catalogo';

const SEDES: ConfigAbm = {
  recurso: 'sedes',
  titulo: 'Sedes',
  singular: 'sede',
  articulo: 'la',
  icono: 'domain',
  campos: [
    { clave: 'nombre', etiqueta: 'Nombre', maximo: 50 },
    { clave: 'direccion', etiqueta: 'Dirección', maximo: 100 },
    {
      clave: 'telefono',
      etiqueta: 'Teléfono',
      maximo: 15,
      patron: '^[0-9]{6,15}$',
      mensajePatron: 'El teléfono debe tener entre 6 y 15 dígitos, sin espacios ni guiones.',
    },
  ],
};

const ESPECIALIDADES: ConfigAbm = {
  recurso: 'especialidades',
  titulo: 'Especialidades',
  singular: 'especialidad',
  articulo: 'la',
  icono: 'medical_services',
  campos: [{ clave: 'descripcion', etiqueta: 'Descripción', maximo: 30 }],
};

const COBERTURAS: ConfigAbm = {
  recurso: 'coberturas',
  titulo: 'Coberturas',
  singular: 'cobertura',
  articulo: 'la',
  icono: 'badge',
  campos: [{ clave: 'nombre', etiqueta: 'Nombre', maximo: 30 }],
};

const abm = () => import('./pages/admin/abm-catalogo/abm-catalogo').then((m) => m.AbmCatalogo);

export const routes: Routes = [
  {
    path: '',
    title: 'Clínica Virtual',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'login',
    title: 'Iniciar sesión — Clínica Virtual',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta — Clínica Virtual',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'perfil',
    title: 'Mi perfil — Clínica Virtual',
    canActivate: [sesionGuard],
    loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
  },

  // Cada rol tiene su propia sección, protegida por sesión y por rol: escribir a mano
  // la URL de otra sección lleva a "Acceso denegado".
  {
    path: 'paciente',
    canActivate: [sesionGuard, rolGuard],
    data: { roles: ['paciente'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'turnos' },
      {
        path: 'turnos',
        title: 'Mis turnos — Clínica Virtual',
        loadComponent: () =>
          import('./pages/paciente/mis-turnos/mis-turnos').then((m) => m.MisTurnos),
      },
      {
        path: 'solicitar-turno',
        title: 'Solicitar turno — Clínica Virtual',
        loadComponent: () =>
          import('./pages/paciente/solicitar-turno/solicitar-turno').then((m) => m.SolicitarTurno),
      },
      {
        path: 'historial',
        title: 'Mi historial clínico — Clínica Virtual',
        loadComponent: () =>
          import('./pages/paciente/mi-historial/mi-historial').then((m) => m.MiHistorial),
      },
      {
        path: 'datos',
        title: 'Mis datos personales — Clínica Virtual',
        loadComponent: () => import('./pages/paciente/mis-datos/mis-datos').then((m) => m.MisDatos),
      },
    ],
  },
  {
    path: 'medico',
    canActivate: [sesionGuard, rolGuard],
    data: { roles: ['medico'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'agenda' },
      {
        path: 'agenda',
        title: 'Mi agenda — Clínica Virtual',
        loadComponent: () => import('./pages/medico/mi-agenda/mi-agenda').then((m) => m.MiAgenda),
      },
      {
        path: 'turnos',
        title: 'Turnos programados — Clínica Virtual',
        loadComponent: () =>
          import('./pages/medico/turnos-programados/turnos-programados').then(
            (m) => m.TurnosProgramados,
          ),
      },
      {
        path: 'historial',
        title: 'Historial clínico — Clínica Virtual',
        loadComponent: () =>
          import('./pages/medico/historial-clinico/historial-clinico').then(
            (m) => m.HistorialClinico,
          ),
      },
    ],
  },
  {
    path: 'operador',
    canActivate: [sesionGuard, rolGuard],
    data: { roles: ['operador'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'agenda' },
      {
        path: 'agenda',
        title: 'Agenda y turnos — Clínica Virtual',
        loadComponent: () =>
          import('./pages/operador/agenda-sede/agenda-sede').then((m) => m.AgendaSede),
      },
      {
        path: 'alta-paciente',
        title: 'Alta de paciente — Clínica Virtual',
        loadComponent: () =>
          import('./pages/operador/alta-paciente/alta-paciente').then((m) => m.AltaPaciente),
      },
      {
        path: 'asignar-turno',
        title: 'Asignar turno — Clínica Virtual',
        loadComponent: () =>
          import('./pages/operador/asignar-turno/asignar-turno').then((m) => m.AsignarTurno),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [sesionGuard, rolGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'sedes' },
      { path: 'sedes', title: 'Sedes — Clínica Virtual', loadComponent: abm, data: { abm: SEDES } },
      {
        path: 'especialidades',
        title: 'Especialidades — Clínica Virtual',
        loadComponent: abm,
        data: { abm: ESPECIALIDADES },
      },
      {
        path: 'coberturas',
        title: 'Coberturas — Clínica Virtual',
        loadComponent: abm,
        data: { abm: COBERTURAS },
      },
      {
        path: 'usuarios',
        title: 'Usuarios — Clínica Virtual',
        loadComponent: () => import('./pages/admin/usuarios/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'auditoria',
        title: 'Auditoría — Clínica Virtual',
        loadComponent: () => import('./pages/admin/auditoria/auditoria').then((m) => m.Auditoria),
      },
      {
        path: 'reportes',
        title: 'Reportes — Clínica Virtual',
        loadComponent: () => import('./pages/admin/reportes/reportes').then((m) => m.Reportes),
      },
    ],
  },

  {
    path: 'acceso-denegado',
    title: 'Acceso denegado — Clínica Virtual',
    loadComponent: () =>
      import('./pages/acceso-denegado/acceso-denegado').then((m) => m.AccesoDenegado),
  },
  {
    path: '**',
    title: 'Página no encontrada — Clínica Virtual',
    loadComponent: () => import('./pages/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
  },
];
