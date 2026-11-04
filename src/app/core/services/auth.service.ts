import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';

import { RespuestaApi } from '../models/respuesta.model';
import {
  Credenciales,
  DatosPersonalesPaciente,
  NuevoPaciente,
  Perfil,
  RespuestaLogin,
  Rol,
} from '../models/usuario.model';
import { API_URL, datos } from './api';
import { NotificacionService } from './notificacion.service';

const CLAVE_TOKEN = 'clinica.token';
const CLAVE_PERFIL = 'clinica.perfil';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly url = `${API_URL}/auth`;

  private temporizadorVencimiento: ReturnType<typeof setTimeout> | null = null;

  // La sesión se restaura desde el navegador al arrancar, para que sobreviva a una recarga.
  private readonly perfilActual = signal<Perfil | null>(this.leerPerfilGuardado());

  readonly perfil = this.perfilActual.asReadonly();
  readonly estaLogueado = computed(() => this.perfilActual() !== null);
  readonly rol = computed<Rol | null>(() => this.perfilActual()?.rol ?? null);
  readonly nombreCompleto = computed(() => {
    const perfil = this.perfilActual();
    return perfil ? `${perfil.nombre} ${perfil.apellido}` : '';
  });

  constructor() {
    if (this.estaLogueado()) {
      this.programarVencimiento();
    }
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  /**
   * Inicia sesión y, con el token ya guardado, trae el perfil completo:
   * el login solo devuelve id, rol e id_sede, y el layout necesita el nombre.
   */
  login(credenciales: Credenciales): Observable<Perfil> {
    return this.http.post<RespuestaApi<RespuestaLogin>>(`${this.url}/login`, credenciales).pipe(
      tap((respuesta) => localStorage.setItem(CLAVE_TOKEN, respuesta.datos.token)),
      switchMap(() => this.cargarPerfil()),
      tap(() => {
        this.programarVencimiento();
        this.notificaciones.cargar();
      }),
    );
  }

  /** Alta de paciente: la usa el registro público y también el operador. */
  registro(paciente: NuevoPaciente): Observable<RespuestaApi<Perfil>> {
    return this.http.post<RespuestaApi<Perfil>>(`${this.url}/registro`, paciente);
  }

  cargarPerfil(): Observable<Perfil> {
    return this.http.get<RespuestaApi<Perfil>>(`${this.url}/perfil`).pipe(
      datos(),
      tap((perfil) => this.guardarPerfil(perfil)),
    );
  }

  /** El paciente solo puede modificar email, contraseña, teléfono y cobertura. */
  actualizarDatosPersonales(cambios: DatosPersonalesPaciente): Observable<Perfil> {
    return this.http
      .put<RespuestaApi<unknown>>(`${this.url}/perfil`, cambios)
      .pipe(switchMap(() => this.cargarPerfil()));
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_PERFIL);
    this.perfilActual.set(null);
    this.notificaciones.limpiar();
    if (this.temporizadorVencimiento) {
      clearTimeout(this.temporizadorVencimiento);
      this.temporizadorVencimiento = null;
    }
  }

  /** Ruta principal de la sección correspondiente al rol del usuario logueado. */
  inicioSegunRol(): string {
    const rol = this.rol();
    return rol ? `/${rol}` : '/';
  }

  /**
   * Cuando el token vence durante el uso, se cierra la sesión y se vuelve al login,
   * aunque el usuario no haga ninguna petición (si la hace antes, lo resuelve el interceptor).
   */
  private programarVencimiento(): void {
    const vencimiento = this.vencimientoDelToken();
    if (vencimiento === null) {
      return;
    }
    if (this.temporizadorVencimiento) {
      clearTimeout(this.temporizadorVencimiento);
    }
    // setTimeout admite como máximo ~24,8 días.
    const espera = Math.min(vencimiento - Date.now(), 2_147_000_000);
    this.temporizadorVencimiento = setTimeout(
      () => {
        this.cerrarSesion();
        this.router.navigate(['/login'], { queryParams: { vencida: true } });
      },
      Math.max(espera, 0),
    );
  }

  /** Momento de vencimiento del JWT (en milisegundos), leído del campo `exp`. */
  private vencimientoDelToken(): number | null {
    const token = this.obtenerToken();
    try {
      const carga = JSON.parse(atob(token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof carga.exp === 'number' ? carga.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private guardarPerfil(perfil: Perfil): void {
    localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
    this.perfilActual.set(perfil);
  }

  private leerPerfilGuardado(): Perfil | null {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const guardado = localStorage.getItem(CLAVE_PERFIL);

    if (!token || !guardado) {
      return null;
    }

    try {
      return JSON.parse(guardado) as Perfil;
    } catch {
      // Si lo guardado quedó corrupto, se descarta la sesión en lugar de romper el arranque.
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem(CLAVE_PERFIL);
      return null;
    }
  }
}
