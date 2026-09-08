# Hito 1 - Preparación del entorno y arquitectura inicial

## Objetivo del hito

El objetivo de este primer hito fue preparar el entorno de desarrollo, comprobar que todas las herramientas necesarias funcionaban correctamente y dejar una base técnica estable antes de comenzar la integración con NIST y MySQL.

También se definió la arquitectura general del proyecto y el stack tecnológico que se utilizaría durante el desarrollo.

## Stack tecnológico elegido

Se decidió utilizar:

- React para el frontend.
- Node.js para el backend.
- Express como framework del servidor.
- MySQL como base de datos.
- Git y GitHub para control de versiones.
- Visual Studio Code como editor principal.
- Windows como entorno de desarrollo local.

La elección se hizo buscando una solución sencilla, conocida, escalable y adecuada para un dashboard web.

## Preparación del entorno en Windows

Se comprobó la instalación y funcionamiento de las herramientas principales desde PowerShell.

### Node.js

Se verificó con:

```powershell
node --version
```

Versión utilizada durante el desarrollo:

```text
v24.20.0
```

### npm

Se verificó con:

```powershell
npm --version
```

Versión utilizada:

```text
11.19.0
```

Durante la preparación inicial fue necesario resolver un problema con la política de ejecución de PowerShell para poder utilizar npm correctamente.

### Git

Se comprobó con:

```powershell
git --version
```

Versión utilizada:

```text
git version 2.55.0.windows.3
```

Git se utilizó para inicializar el repositorio local y posteriormente conectarlo con GitHub.

## MySQL

Se comprobó que MySQL estaba instalado y ejecutándose como servicio de Windows.

Desde PowerShell:

```powershell
Get-Service *mysql*
```

El servicio utilizado fue:

```text
MySQL84
```

También se verificó que MySQL estaba escuchando en el puerto por defecto:

```powershell
netstat -ano | findstr :3306
```

Puerto utilizado:

```text
3306
```

MySQL Workbench se utilizó como interfaz gráfica para gestionar la base de datos y ejecutar consultas SQL.

## Inicialización del backend

Dentro de la carpeta `backend` se inicializó el proyecto Node.js.

Se instalaron las dependencias necesarias:

```powershell
npm install express
npm install cors
npm install dotenv
npm install mysql2
```

También se instaló `nodemon` como dependencia de desarrollo:

```powershell
npm install --save-dev nodemon
```

Más adelante se añadió también:

```powershell
npm install node-cron
```

## Dependencias principales

### Express

Express se utiliza para crear el servidor HTTP y definir las rutas del backend.

Ejemplo de uso:

```javascript
const express = require("express");

const app = express();
```

### cors

Permite que el frontend pueda comunicarse con el backend desde otro origen o puerto.

```javascript
const cors = require("cors");

app.use(cors());
```

### dotenv

Permite cargar variables de entorno desde un archivo `.env`.

Esto evita escribir directamente en el código valores como:

- usuario de MySQL,
- contraseña,
- nombre de la base de datos,
- puerto del servidor.

Ejemplo:

```javascript
require("dotenv").config();
```

### mysql2

Se utiliza para conectar Node.js con MySQL.

Se eligió la versión basada en promesas para poder trabajar con `async/await`.

### nodemon

Se utiliza durante el desarrollo para reiniciar automáticamente el servidor cada vez que se modifica un archivo.

En lugar de ejecutar manualmente:

```powershell
node server.js
```

después de cada cambio, se utiliza:

```powershell
npm run dev
```

## Scripts de npm

En `package.json` se configuraron los scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

Esto permite:

```powershell
npm start
```

para ejecución normal y:

```powershell
npm run dev
```

durante el desarrollo.

## Variables de entorno

Se creó:

```text
backend/.env
```

con una estructura similar a:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario_mysql
DB_PASSWORD=contraseña_mysql
DB_NAME=dashboard_cybersecurity
```

El archivo `.env` se mantiene fuera del repositorio para no exponer credenciales.

## Archivo `.gitignore`

Se configuró para excluir al menos:

```gitignore
node_modules/
.env
```

Esto evita subir dependencias locales y datos sensibles a GitHub.

## Primer servidor Express

Se creó un servidor básico para comprobar que Node.js y Express funcionaban correctamente.

### `src/app.js`

Se configuró Express con soporte para JSON y CORS.

También se añadió una ruta inicial de prueba:

```javascript
app.get("/", (req, res) => {
  res.json({
    message: "CVE Dashboard API funcionando",
  });
});
```

### `server.js`

Se configuró el arranque del servidor.

La aplicación utiliza:

```javascript
const PORT = process.env.PORT || 3000;
```

y posteriormente:

```javascript
app.listen(PORT, () => {
  console.log(
    `Servidor ejecutándose en http://localhost:${PORT}`,
  );
});
```

## Primera prueba del backend

Con:

```powershell
npm run dev
```

el servidor quedó disponible en:

```text
http://localhost:3000
```

La respuesta de prueba fue:

```json
{
  "message": "CVE Dashboard API funcionando"
}
```

Esto confirmó que el entorno estaba preparado correctamente antes de comenzar con la lógica real del proyecto.

## Conexión inicial con MySQL

Se creó:

```text
src/config/database.js
```

utilizando `mysql2/promise`.

La configuración se dejó basada en variables de entorno:

```javascript
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

module.exports = pool;
```

En `server.js` se añadió una comprobación antes de iniciar el servidor:

```javascript
await db.query("SELECT 1");
```

Si la conexión era correcta:

```text
Conexión a MySQL correcta
```

Después se iniciaba Express.

Esto permitió detectar errores de conexión a la base de datos antes de levantar el backend.

## Arquitectura inicial

Se decidió organizar el backend mediante una arquitectura por capas.

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
MySQL
```

### Routes

Definen los endpoints disponibles.

### Controllers

Reciben las peticiones y generan las respuestas HTTP.

### Services

Contienen la lógica principal de la aplicación.

### Repositories

Contienen las consultas SQL y el acceso a MySQL.

Esta separación se eligió para evitar mezclar toda la lógica en un único archivo y facilitar el mantenimiento del proyecto.

## Comunicación prevista con NIST

También se definió que la integración con NIST estaría separada del acceso a MySQL.

```text
NIST
 ↓
NistService
 ↓
Service
 ↓
Repository
 ↓
MySQL
```

Esto permitió preparar el backend para trabajar con una fuente externa sin mezclar esa responsabilidad con las consultas SQL.

## Estructura inicial del proyecto

La estructura fue evolucionando hacia:

```text
backend/
├── server.js
├── package.json
├── package-lock.json
└── src/
    ├── app.js
    ├── config/
    │   └── database.js
    ├── controllers/
    ├── repositories/
    ├── routes/
    └── services/
```

## Git y GitHub

El repositorio local se inicializó con Git.

Durante la configuración se trabajó con:

```powershell
git init
git status
git log --oneline
```

También se revisó la configuración del repositorio remoto y la rama `main`.

El objetivo fue dejar una base limpia para ir documentando y versionando cada parte del proyecto.

## Resultado del Hito 1

Al finalizar este hito quedaron preparados:

- Entorno de desarrollo en Windows.
- Node.js y npm funcionando.
- Git configurado.
- MySQL Server funcionando.
- MySQL Workbench conectado.
- Backend Node.js inicializado.
- Express funcionando.
- Variables de entorno configuradas.
- Conexión inicial con MySQL validada.
- Arquitectura por capas definida.
- Repositorio Git preparado.
- Base técnica lista para comenzar la integración real con NIST.

Este hito sirvió principalmente para eliminar problemas de entorno antes de comenzar con la parte funcional del backend.
