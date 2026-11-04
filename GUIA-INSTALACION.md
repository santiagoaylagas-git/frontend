# Guía para levantar el proyecto en Visual Studio Code o Antigravity

Esta guía explica, paso a paso y desde cero, cómo dejar funcionando el sistema completo
(base de datos + backend + frontend) en una computadora con **Windows**. Al final hay notas
para macOS y Linux, y una sección de problemas frecuentes.

> **Antigravity** es el editor de Google basado en Visual Studio Code: tiene los mismos menús,
> la misma terminal y abre las mismas carpetas. Todo lo que dice esta guía para VS Code vale
> igual para Antigravity. Las diferencias están marcadas con 🛰️.

---

## 0. Qué vamos a levantar

| Pieza | Qué es | Dirección |
|-------|--------|-----------|
| Base de datos | MySQL (viene con XAMPP) | puerto `3306` |
| Backend | API en Node.js + Express | http://localhost:3000 |
| Frontend | Aplicación Angular | http://localhost:4200 |

Se necesitan **tres cosas corriendo al mismo tiempo**: MySQL (en XAMPP), el backend (una terminal)
y el frontend (otra terminal).

---

## 1. Instalar los programas (una sola vez)

### 1.1 Node.js
1. Entrar a https://nodejs.org y descargar la versión **LTS** (22 o 24).
2. Instalar con las opciones por defecto (dejar tildado "Add to PATH").
3. Verificar en una terminal nueva (Inicio → "cmd"):
   ```bash
   node -v
   npm -v
   ```
   Tiene que mostrar `v22.x` o `v24.x`. **Angular 21 no funciona con Node 18 ni con Node 20 anteriores a 20.19.**

### 1.2 Git
1. Descargar de https://git-scm.com/download/win e instalar con las opciones por defecto.
2. Verificar: `git --version`.

### 1.3 XAMPP (MySQL)
1. Descargar de https://www.apachefriends.org e instalar (alcanza con marcar **MySQL** y **phpMyAdmin**).
2. Abrir el **XAMPP Control Panel** y tocar **Start** en la fila **MySQL**. Tiene que quedar en verde.
   - Apache solo hace falta si se quiere usar phpMyAdmin (http://localhost/phpmyadmin).
3. Por defecto el usuario es `root` **sin contraseña**. El proyecto ya viene configurado así.

> Si ya tenés otro MySQL instalado (por ejemplo MySQL Workbench / MySQL Server), podés usar ese
> en lugar de XAMPP: solo hay que poner su usuario y contraseña en el `.env` (paso 4.3).

### 1.4 El editor
- **Visual Studio Code**: https://code.visualstudio.com
- 🛰️ **Antigravity**: https://antigravity.google — descargar, instalar e iniciar sesión con la cuenta de Google.

### 1.5 (Opcional) Postman
https://www.postman.com/downloads — para probar la API con la colección del proyecto.

---

## 2. Descargar el proyecto

### Opción A — con Git desde el editor (recomendada)
1. Crear una carpeta vacía, por ejemplo `C:\clinica`.
2. En VS Code / Antigravity: **File → Open Folder…** (Archivo → Abrir carpeta…) y elegir `C:\clinica`.
3. Abrir una terminal: **Terminal → New Terminal** (o `` Ctrl + ` ``).
4. Clonar los dos repositorios **con su rama**:
   ```bash
   git clone -b entrega-backend https://github.com/santiagoaylagas-git/backend
   git clone -b entrega-frontend https://github.com/santiagoaylagas-git/frontend
   ```
5. Queda así:
   ```
   C:\clinica
   ├── backend\              ← repositorio del backend
   │   ├── backend\          ← código de la API (acá se corre npm)
   │   └── clinica_ampliada.sql.txt
   └── frontend\             ← repositorio del frontend (acá se corre npm)
   ```

### Opción B — descargando el ZIP desde GitHub
1. En GitHub, **elegir primero la rama** en el selector (arriba a la izquierda):
   `entrega-backend` para el backend y `entrega-frontend` para el frontend.
   ⚠️ La rama `main` está vacía: si se baja `main`, no hay código.
2. **Code → Download ZIP**, descomprimir dentro de `C:\clinica` y renombrar las carpetas a
   `backend` y `frontend`.

### Abrir todo en el editor
Con `C:\clinica` abierto se ven las dos carpetas en el explorador de la izquierda. Si el editor
pregunta "¿Confiás en los autores de esta carpeta?", responder **Sí, confío** (sin eso no se
pueden correr las tareas).

Extensiones recomendadas (pestaña de Extensiones, `Ctrl+Shift+X`):
- **Angular Language Service** (`angular.ng-template`) — autocompletado en las plantillas.
- **SQLTools** + **SQLTools MySQL/MariaDB** — para ver la base desde el editor (opcional).

🛰️ Antigravity instala las extensiones desde Open VSX; se buscan por el mismo nombre.

---

## 3. Antes de empezar: la terminal de Windows

Si al correr `npm` aparece este error:

```
npm : No se puede cargar el archivo C:\Program Files\nodejs\npm.ps1 porque la ejecución
de scripts está deshabilitada en este sistema.
```

es la política de PowerShell. Hay dos soluciones (alcanza con una):

- **Usar la terminal "Command Prompt"**: en el panel de la terminal, flecha ⌄ al lado del **+** →
  **Command Prompt**. Para que quede por defecto: `Ctrl+Shift+P` → "Terminal: Select Default
  Profile" → **Command Prompt**.
- **O habilitar los scripts** (una vez), en PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```

---

## 4. Levantar el backend

### 4.1 Entrar a la carpeta de la API
En la terminal:
```bash
cd C:\clinica\backend\backend
```

### 4.2 Instalar dependencias (la primera vez)
```bash
npm install
```
Tarda uno o dos minutos. Crea la carpeta `node_modules`.

### 4.3 Crear el archivo de configuración `.env`
```bash
copy .env.example .env
```
(en macOS/Linux: `cp .env.example .env`)

Abrir `backend\backend\.env` en el editor. Con XAMPP por defecto solo hay que cambiar
`JWT_SECRET` por cualquier texto:

```ini
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=clinica

JWT_SECRET=clave_secreta_de_la_clinica
JWT_EXPIRES_IN=8h
```

| Variable | Qué poner |
|----------|-----------|
| `DB_USER` / `DB_PASSWORD` | Usuario y contraseña de MySQL (XAMPP: `root` y vacío) |
| `DB_NAME` | `clinica` (el script la crea solo) |
| `JWT_SECRET` | Cualquier texto; firma los tokens de sesión |
| `JWT_EXPIRES_IN` | Duración de la sesión (`8h`) |

### 4.4 Crear la base de datos con los datos de prueba
**Con MySQL encendido en XAMPP**:
```bash
npm run db:importar
```
Tiene que mostrar:
```
Recreando la base 'clinica'... ok
Importando clinica_ampliada.sql.txt... ok
Listo: 10 tablas creadas con los datos de prueba.
```
> Este comando **borra y vuelve a crear** la base. Los turnos de prueba quedan con fechas
> relativas al día en que se corre (hoy, días anteriores y próximos), así que conviene
> correrlo el mismo día de la defensa.

Alternativa sin terminal: en phpMyAdmin crear la base `clinica` y usar **Importar** con el
archivo `C:\clinica\backend\clinica_ampliada.sql.txt`.

### 4.5 Iniciar la API
```bash
npm run dev
```
Tiene que mostrar `Servidor escuchando en http://localhost:3000`.
Abrir en el navegador http://localhost:3000/health → debe decir `"db":"conectada"`.

**Dejar esta terminal abierta.** Si se cierra, el backend se apaga.

---

## 5. Levantar el frontend

1. Abrir **otra** terminal: botón **+** del panel de terminales (o dividirla con el ícono de
   "split" para ver las dos a la vez).
2. Entrar a la carpeta:
   ```bash
   cd C:\clinica\frontend
   ```
3. Instalar dependencias (la primera vez, tarda unos minutos):
   ```bash
   npm install
   ```
4. Iniciar:
   ```bash
   npm start
   ```
   (es lo mismo que `ng serve`; no hace falta instalar Angular CLI global).
   Cuando aparezca `Local: http://localhost:4200/`, abrir esa dirección en el navegador.

**Dejar esta terminal abierta también.**

Para generar el build de producción (lo pide la consigna): `npm run build` → sin errores.

---

## 6. Probar el sistema

Contraseña de todos los usuarios: **`test1234`**. Se ingresa con el **DNI**.

| Rol | DNI | Nombre |
|-----|-----|--------|
| Administrador | `18222333` | Marcos Gómez |
| Médico | `20111222` | Ana López (atiende en Sede Centro y Sede Norte) |
| Médico | `22333444` | Carlos Martínez |
| Médico | `28444555` | Laura Fernández |
| Operador | `15200548` | Juan Pérez (Sede Centro) |
| Operador | `33555666` | Sofía Díaz (Sede Norte) |
| Paciente | `36000960` | Franco Friggeri |
| Paciente | `40666777` | Lucía Romero |

Recorrido rápido:
1. **Paciente** `40666777` → Solicitar turno → Traumatología → Sede Centro → Ana López → fecha → horario → nota → Confirmar. La campana suma una notificación.
2. **Médico** `20111222` → Turnos programados → "Marcar como atendido".
3. **Paciente** `36000960` → Mis turnos → desplegar un turno atendido → ver el historial.
4. **Operador** `15200548` → Agenda y turnos → Nueva agenda / ojo → cancelar un turno.
5. **Administrador** `18222333` → intentar eliminar "Sede Centro" (muestra el error de dependencias) → Usuarios → Auditoría → Reportes.

Para cambiar de usuario: menú del nombre (arriba a la derecha) → **Cerrar sesión**.

---

## 7. Usar las tareas y el depurador del editor (opcional)

Los dos repositorios traen configuración en `.vscode/`, que VS Code y Antigravity leen solos.
Para usarla, abrir **cada repositorio como carpeta** (File → Open Folder → `C:\clinica\backend`
o `C:\clinica\frontend`), o agregar ambos con **File → Add Folder to Workspace…**.

- **Backend** (`Terminal → Run Task…`):
  - *Backend: instalar dependencias*
  - *Backend: importar base de datos (desde cero)*
  - *Backend: levantar API (npm run dev)*
  - **Run and Debug** (`Ctrl+Shift+D`) → *Backend: depurar API* → F5. Permite poner puntos de
    interrupción en los controladores.
- **Frontend**: **Run and Debug** → *ng serve* → F5. Levanta Angular y abre Chrome/Edge con el
  depurador conectado.

🛰️ En Antigravity también se le puede pedir al agente, en el panel de chat, "levantá el backend
y el frontend siguiendo GUIA-INSTALACION.md": va a ejecutar los mismos comandos en la terminal
y pedir permiso antes de cada uno.

---

## 8. Probar la API con Postman (opcional)

1. Postman → **Import** → elegir `C:\clinica\backend\backend\postman\clinica.postman_collection.json`.
2. Con el backend corriendo y la base recién importada, clic derecho en la colección →
   **Run collection** → **Run**. Son 112 requests; los tokens e ids se guardan solos.
3. Antes de volver a correrla completa, reimportar la base (`npm run db:importar`).

---

## 9. Cada vez que se quiera volver a usar

1. Abrir XAMPP → **Start** en MySQL.
2. Abrir `C:\clinica` en el editor.
3. Terminal 1: `cd backend\backend` → (opcional) `npm run db:importar` → `npm run dev`.
4. Terminal 2: `cd frontend` → `npm start`.
5. Abrir http://localhost:4200.

Para apagar: `Ctrl + C` en cada terminal y **Stop** en XAMPP.

---

## 10. Problemas frecuentes

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `npm.ps1 no se puede cargar… ejecución de scripts deshabilitada` | Política de PowerShell | Ver la sección 3 |
| `connect ECONNREFUSED 127.0.0.1:3306` | MySQL apagado | XAMPP → Start en MySQL |
| `Access denied for user 'root'@'localhost'` | Contraseña de MySQL distinta | Poner la contraseña correcta en `DB_PASSWORD` del `.env` |
| `Unknown database 'clinica'` | No se importó la base | `npm run db:importar` |
| MySQL de XAMPP no arranca (queda en rojo) | El puerto 3306 lo usa otro MySQL | Detener el otro servicio MySQL (Servicios de Windows) o usarlo en lugar de XAMPP |
| "El puerto 3000 ya está en uso" (`EADDRINUSE`) | Ya hay un backend corriendo | Cerrar la otra terminal o cambiar `PORT` (y entonces también `apiUrl` en `frontend/src/environments/`) |
| `Port 4200 is already in use` | Ya hay un frontend corriendo | Cerrar la otra terminal, o aceptar el otro puerto que ofrece Angular |
| `'ng' no se reconoce como un comando` | Angular CLI no está global | Usar `npm start` / `npm run build` (usan el CLI del proyecto) |
| `The Angular CLI requires a minimum Node.js version` | Node viejo | Instalar Node 22 o 24 LTS y abrir una terminal nueva |
| La app dice "No se pudo conectar con el servidor" | El backend no está corriendo | Levantar el backend (sección 4.5) y tocar "Reintentar" |
| "Credenciales inválidas" con los usuarios de prueba | Se cambió la contraseña o la base es vieja | `npm run db:importar` |
| No hay turnos "de hoy" | La base se importó otro día | `npm run db:importar` |
| `npm install` falla con errores de `bcrypt` / `node-gyp` | Node muy viejo o muy nuevo | Usar Node 22 LTS, borrar `node_modules` y repetir `npm install` |
| Cambios en el código no se ven | El servidor no recargó | Guardar el archivo; si sigue igual, `Ctrl+C` y volver a iniciar |

---

## 11. macOS y Linux

Es igual, con estas diferencias:
- MySQL: XAMPP para macOS/Linux, o `brew install mysql` / `sudo apt install mariadb-server`.
  Si se usa un usuario distinto de `root` sin contraseña, ponerlo en el `.env`.
- Copiar el `.env`: `cp .env.example .env`.
- Las rutas usan `/`: `cd ~/clinica/backend/backend`.
- No existe el problema de PowerShell de la sección 3.
