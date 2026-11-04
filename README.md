# Frontend — Sistema de Gestión de Turnos Médicos

Aplicación Angular del trabajo práctico integrador de Programación 2. Consume la API REST
del backend, que vive en un repositorio aparte:

- **Frontend:** https://github.com/santiagoaylagas-git/frontend
- **Backend:** https://github.com/santiagoaylagas-git/backend

> **¿Primera vez?** Seguí la guía paso a paso [`docs/GUIA-INSTALACION.md`](docs/GUIA-INSTALACION.md):
> instalación de Node, Git y XAMPP, cómo abrir el proyecto en Visual Studio Code o Antigravity y
> solución de problemas frecuentes. La guía de flujos con capturas de cada pantalla está en
> [`docs/Guia_flujos_Clinica_Virtual.pdf`](docs/Guia_flujos_Clinica_Virtual.pdf).

## Ramas

| Rama | Contenido |
|------|-----------|
| `main` | Versión final y vigente (igual a `entrega-frontend`) |
| `entrega-frontend` | Entrega final: semanas 2 a 4, los cuatro roles completos |
| `entrega-frontend-1` | Semana 1: setup, Angular Material, layout y autenticación |

## Documentación (`docs/`)

| Archivo | Contenido |
|---------|-----------|
| `GUIA-INSTALACION.md` / `.pdf` | Cómo levantar el proyecto desde cero en VS Code o Antigravity |
| `Guia_flujos_Clinica_Virtual.pdf` | Flujos de cada rol con capturas, arquitectura, reglas de negocio y carpetas |

Esta es la **entrega final del frontend** (semanas 2 a 4): la aplicación queda completa para
los cuatro roles — paciente, médico, operador y administrador — y lista para la defensa.

## Versiones utilizadas

| Herramienta      | Versión  |
|------------------|----------|
| Node.js          | 24.19.0 (también probado con 22.23) |
| npm              | 11.17.0 (también funciona con npm 10) |
| Angular CLI      | 21.2.26  |
| Angular          | 21.2     |
| Angular Material | 21.2.14  |
| TypeScript       | 5.9.2    |
| Chart.js         | 4.6      |
| ng2-charts       | 10.0     |
| MySQL / MariaDB  | MySQL 8 o MariaDB 10.4+ (XAMPP sirve) |

**Librería de gráficos:** [Chart.js](https://www.chartjs.org/) a través de
[ng2-charts](https://valor-software.com/ng2-charts/) **v10**, la versión compatible con
Angular 21 (la v11 ya exige Angular 22). Se usa en la pantalla de Reportes: barras para turnos
por especialidad, dona para turnos por sede y torta para la tasa de cancelación. Chart.js se
registra solo en esa pantalla, para no sumarlo a la carga inicial de la aplicación.

## Cómo levantar el sistema completo desde cero

Se necesitan Node.js, Git y MySQL o MariaDB corriendo (por ejemplo, con XAMPP: iniciar el
módulo **MySQL** desde el panel de control).

```bash
git clone https://github.com/santiagoaylagas-git/backend
git clone https://github.com/santiagoaylagas-git/frontend
```

### 1. Backend y base de datos

El script de la base está en `backend/database/clinica_ampliada.sql.txt`.

```bash
cd backend
npm install
cp .env.example .env        # en Windows: copy .env.example .env
```

Editar `.env` si hace falta. Con XAMPP por defecto (usuario `root` sin contraseña) solo hay que
cambiar `JWT_SECRET` por cualquier texto:

| Variable         | Ejemplo / valor por defecto | Para qué sirve                              |
|------------------|-----------------------------|---------------------------------------------|
| `PORT`           | `3000`                      | Puerto de la API                            |
| `DB_HOST`        | `localhost`                 | Servidor de MySQL                           |
| `DB_PORT`        | `3306`                      | Puerto de MySQL                             |
| `DB_USER`        | `root`                      | Usuario de MySQL                            |
| `DB_PASSWORD`    | *(vacío)*                   | Contraseña de MySQL                         |
| `DB_NAME`        | `clinica`                   | Nombre de la base                           |
| `JWT_SECRET`     | `un_secreto_cualquiera`     | Clave para firmar los tokens                |
| `JWT_EXPIRES_IN` | `8h`                        | Duración de la sesión                       |

Crear la base con los datos de prueba (la **borra y la vuelve a crear** cada vez):

```bash
npm run db:importar
```

Levantar la API:

```bash
npm run dev
```

Queda en `http://localhost:3000`. Abrir `http://localhost:3000/health` debería mostrar
`"db": "conectada"`.

> La agenda y los turnos de prueba se cargan con fechas **relativas al día en que se importa**
> la base (hoy, días anteriores y próximos). Conviene correr `npm run db:importar` el mismo día
> de la defensa para tener agenda y turnos "de hoy".

Alternativas para importar la base (por ejemplo, desde phpMyAdmin) en el `README.md` del backend.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm start          # equivale a ng serve
```

Abrir `http://localhost:4200`.

Build de producción: `npm run build` (equivale a `ng build`). Tests: `npm test`.

### Configuración de la API

La URL base de la API está definida en **un único lugar**, los archivos de entorno
`src/environments/environment.ts` y `environment.development.ts`
(`apiUrl: 'http://localhost:3000'`). El helper `core/services/api.ts` la toma de ahí y ningún
servicio repite la dirección. Si el backend corre en otro puerto, se cambia solo ahí.

## Usuarios de prueba

Todos usan la contraseña **`test1234`**. Se ingresa con el DNI.

| Rol            | DNI        | Nombre            | Para probar                                                   |
|----------------|------------|-------------------|---------------------------------------------------------------|
| Administrador  | `18222333` | Marcos Gómez      | Sedes, especialidades, coberturas, usuarios, auditoría, reportes |
| Médico         | `20111222` | Ana López         | Traumatología y Clínica Médica, **atiende en Sede Centro y Sede Norte** |
| Médico         | `22333444` | Carlos Martínez   | Cardiología, Sede Norte                                        |
| Médico         | `28444555` | Laura Fernández   | Pediatría y Dermatología, Sede Centro                          |
| Operador       | `15200548` | Juan Pérez        | Sede Centro                                                    |
| Operador       | `33555666` | Sofía Díaz        | Sede Norte                                                     |
| Paciente       | `36000960` | Franco Friggeri   | Tiene turnos en los tres estados e historial clínico           |
| Paciente       | `40666777` | Lucía Romero      | OSDE                                                           |
| Paciente       | `17777888` | Martín Sosa       | Swiss Medical                                                  |
| Paciente       | `55888999` | Valentina Acosta  | Jerárquicos                                                    |

También se puede crear un paciente nuevo desde "Registrarse".

## Funcionalidades por rol

### Paciente
- **Mis turnos**: próximos (del más cercano al más lejano) y anteriores, con detalle desplegable
  (fecha completa, especialista, especialidad, sede, cobertura y motivo). El estado se distingue
  por color e ícono. Los confirmados se pueden cancelar, previa confirmación. Los atendidos
  muestran el resumen del historial clínico (diagnóstico, tratamiento y observaciones).
- **Solicitar turno**: asistente paso a paso especialidad → sede → profesional → fecha →
  horario → nota y confirmación. Cada paso filtra el siguiente: solo médicos de esa especialidad
  con agenda en esa sede, solo los días en que el médico atiende (calendario con el resto
  deshabilitado) y solo los horarios libres. Antes de confirmar se muestra un resumen con la
  cobertura registrada del paciente. Si el horario se ocupó mientras tanto, se muestra el mensaje
  del backend y se vuelve al paso del horario con la lista actualizada.
- **Mi historial clínico**: todos sus registros.
- **Mis datos personales**: muestra todos los datos; solo se pueden modificar email, teléfono,
  cobertura y contraseña (con "repetir contraseña", validando que coincidan).

### Médico
- **Mi agenda**: un día por vez (por defecto hoy) con selector de fecha. Alta, modificación y
  baja de rangos horarios: fecha, entrada, salida, especialidad (solo las propias) y sede (con la
  suya preseleccionada; puede atender en más de una). Se pueden cargar varios rangos el mismo día.
  Se valida que la salida sea posterior a la entrada. No se puede eliminar un rango con turnos
  confirmados (el botón queda deshabilitado y lo explica) ni modificarlo dejando turnos afuera
  (el formulario lo avisa antes de enviar y el backend lo vuelve a validar).
- **Turnos programados**: turnos del día en todas sus sedes, con selector de fecha y filtro de
  sede. Tabla con hora, paciente, edad (calculada), sede, especialidad y estado, ordenada por
  proximidad. Al hacer clic en un turno se despliegan las notas del paciente. Los confirmados
  tienen "Marcar como atendido" (carga diagnóstico, tratamiento y observaciones) y "Cancelar".
- **Historial clínico**: búsqueda de pacientes por DNI o apellido; muestra únicamente los
  registros de los turnos que atendió el médico logueado.

### Operador
- **Agenda y turnos**: filtro de fecha (hoy) y de sede (la suya). Tabla con los médicos que
  tienen agenda: nombre, especialidad y horario. Cada fila tiene el lápiz (agregar, modificar y
  eliminar rangos del médico) y el ojo (turnos confirmados de ese médico ese día, con la opción de
  cancelarlos). "Nueva agenda" permite elegir cualquier médico, aunque todavía no tenga agenda.
  Estas acciones solo aparecen en la sede del operador: las demás sedes se pueden consultar
  ("Solo consulta").
- **Alta de paciente**: el mismo componente de formulario que el registro público.
- **Asignar turno**: busca al paciente y usa el mismo asistente que "Solicitar turno", con la
  sede fija en la del operador.

### Administrador
- **Sedes, Especialidades y Coberturas**: una pantalla por entidad (un mismo componente de ABM
  configurado desde la ruta), con tabla, filtro de texto, alta y modificación con validaciones,
  y baja con "¿Está seguro de eliminar...?". Si el backend rechaza la baja por dependencias, se
  muestra su mensaje y el listado no cambia. Después de cada operación el listado se actualiza
  sin recargar la página.
- **Usuarios**: listado paginado del lado del servidor con filtros por nombre, apellido, tipo de
  usuario y sede. Alta de operadores, médicos y administradores (el operador y el médico con
  sede, el administrador sin sede, el médico con sus especialidades) y edición de cualquier
  usuario, incluidos los pacientes.
- **Auditoría**: solo lectura, paginada, más recientes primero, con filtros por usuario, entidad
  y rango de fechas.
- **Reportes**: turnos por especialidad, turnos por sede, ranking de médicos por turnos atendidos
  y tasa de cancelación. Un único filtro de fechas actualiza los cuatro a la vez.

### Todos los roles
- **Notificaciones**: la campana muestra la cantidad de no leídas (sin número si no hay). Al
  hacer clic se despliega el listado, de la más reciente a la más antigua, con las no leídas
  resaltadas, y cada una se puede marcar como leída (el contador baja al instante). Después de
  confirmar, cancelar o atender un turno el contador se actualiza sin recargar; las
  notificaciones generadas por otros usuarios aparecen la próxima vez que se ingresa o se navega.
- **Mi perfil**: datos del usuario logueado.

## Experiencia de uso y manejo de errores

- Todas las pantallas usan componentes de Angular Material y no queda ninguna "En construcción".
- Mientras se espera al backend se muestra un indicador de carga; los listados vacíos muestran
  un mensaje en lugar de una tabla vacía.
- Las fechas se muestran como día/mes/año (pipe `fecha`, que arma la fecha local para no correr
  el día por la zona horaria) y los datepickers aceptan `DD/MM/AAAA`.
- Los errores del backend en altas, modificaciones y bajas se muestran tal como los devuelve la
  API. Si el backend no responde, cada pantalla muestra "No se pudo conectar con el servidor" con
  un botón "Reintentar"; la aplicación no queda en blanco.
- Si el token vence durante el uso, se cierra la sesión y se vuelve al login avisando que venció:
  lo hace el interceptor ante un `401` y, además, un temporizador con el vencimiento del JWT.
- Cada sección solo es accesible para su rol, desde el menú y escribiendo la URL a mano
  (`sesionGuard` + `rolGuard` → "Acceso denegado").
- Pensada para escritorio: el menú lateral queda fijo y se puede ocultar con el botón del
  encabezado.

## Cambios en el backend

Para estas pantallas se agregaron y ajustaron endpoints en el backend, siguiendo las sugerencias
de la consigna. Están detallados en la sección **"Cambios para la entrega del frontend"** del
`README.md` del backend y documentados en la colección de Postman (carpeta
"Entrega frontend - Endpoints nuevos y cambios"). En resumen:

- Nuevos: `GET /medicos`, `GET /disponibilidad/fechas`, `GET /disponibilidad/horarios`,
  `GET /pacientes?q=`, `PUT /auth/perfil`, `GET/POST/PUT /usuarios`, `GET /auditoria/filtros`.
- Sedes y especialidades: lectura para cualquier usuario con sesión.
- Agenda: nombres resueltos y cantidad de turnos confirmados, operador limitado a su sede,
  validación de superposición y de turnos confirmados al eliminar o modificar.
- Turnos: turnos de 30 minutos coherentes con la disponibilidad, el médico opera sobre sus turnos
  en cualquier sede, "atender" registra el historial en el mismo paso, y se notifica también a
  quien realiza la acción.
- Auditoría paginada. Base de datos con claves `INT` y datos de prueba ampliados.

## Estructura del proyecto

```
src/app
├── core/
│   ├── models/          Interfaces de la API (usuario, catálogo, agenda, turno, auditoría...)
│   ├── services/        Un servicio por recurso; api.ts tiene la URL base y helpers
│   ├── interceptors/    Agrega el JWT y maneja el 401
│   └── guards/          sesionGuard y rolGuard
├── shared/
│   ├── components/      Reutilizables entre roles:
│   │   ├── formulario-paciente/   Registro público y alta de pacientes del operador
│   │   ├── solicitud-turno/       Asistente de turno del paciente y del operador
│   │   ├── rango-dialogo/         Alta/modificación de rangos (médico y operador)
│   │   ├── buscador-pacientes/    Médico (historial) y operador (asignar turno)
│   │   ├── lista-historial/       Historial del paciente y del médico
│   │   └── aviso, cargando, confirmar-dialogo, estado-turno
│   ├── pipes/           fecha (DD/MM/AAAA)
│   └── utils/           Fechas, adaptador del datepicker y paginador en castellano
├── layout/              Encabezado (con notificaciones), menú lateral y pie
├── pages/
│   ├── paciente/        mis-turnos, solicitar-turno, mi-historial, mis-datos
│   ├── medico/          mi-agenda, turnos-programados, historial-clinico
│   ├── operador/        agenda-sede, alta-paciente, asignar-turno
│   ├── admin/           abm-catalogo (sedes, especialidades, coberturas), usuarios,
│   │                    auditoria, reportes
│   └── inicio, login, registro, perfil, acceso-denegado, no-encontrada
├── app.routes.ts        Rutas por rol (con carga diferida)
└── app.config.ts        Providers: router, HttpClient, locale es-AR, datepicker, paginador
```

## Guion rápido para la defensa

1. `npm run db:importar` en el backend, `npm run dev` en el backend y `npm start` en el frontend.
2. **Administrador** (`18222333`): intentar eliminar "Sede Centro" → mensaje de dependencias y el
   listado no cambia. Crear un médico en Usuarios → aparece en Auditoría. Reportes: cambiar el
   rango de fechas.
3. **Paciente** (`40666777`): Solicitar turno (Traumatología → Sede Centro → Ana López) → la
   campana suma una notificación. Ver el turno en Mis turnos.
4. **Médico** (`20111222`): Turnos programados → "Marcar como atendido" en un turno de hoy. En
   Mi agenda, intentar achicar un rango con turnos → la interfaz lo impide. Historial clínico:
   buscar "Acosta" (no la atendió) y "36000960" (sí).
5. **Paciente** (`36000960`): en Mis turnos, el turno atendido muestra el historial.
6. **Operador** (`15200548`): Nueva agenda para Carlos Martínez (sin agenda en Sede Centro);
   ojo → cancelar un turno; cambiar a Sede Norte → solo consulta. Alta de paciente → Asignar turno.
7. Detener el backend y navegar: cada pantalla muestra el error con "Reintentar".
