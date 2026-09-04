# Dashboard de Ciberseguridad CVEs

Aplicación web para consultar y visualizar vulnerabilidades CVE obtenidas desde la API NVD del NIST.

## Requisitos previos

Antes de ejecutar el proyecto es necesario tener instalado:

- Node.js 24 LTS
- npm
- Git
- MySQL Server 8.4
- MySQL Workbench o un cliente equivalente
- Visual Studio Code

## Comprobación del entorno

Para verificar que Node.js, npm y Git están disponibles, ejecutar en PowerShell:

```powershell
node --version
npm --version
git --version
```

Versiones utilizadas durante el desarrollo:

```text
Node.js v24.20.0
npm 11.19.0
Git 2.55.0.windows.3
```

Para comprobar que MySQL está ejecutándose como servicio en Windows:

```powershell
Get-Service *mysql*
```

El servicio utilizado durante el desarrollo es:

```text
MySQL84
```

El servidor MySQL utiliza el puerto por defecto:

```text
3306
```

## Backend

El backend está desarrollado con Node.js y Express.

### Instalación

Desde la carpeta `backend`:

```powershell
npm install
```

Las dependencias principales utilizadas son:

- Express
- dotenv
- mysql2
- cors

Como dependencia de desarrollo se utiliza:

- nodemon

### Variables de entorno

Crear un archivo:

```text
backend/.env
```

Contenido inicial:

```env
PORT=3000
```

El archivo `.env` no debe subirse al repositorio porque posteriormente contendrá datos sensibles como credenciales de base de datos o claves de API.

## Ejecución del servidor

Desde la carpeta `backend`:

```powershell
npm run dev
```

El servidor estará disponible en:

```text
http://localhost:3000
```

Para comprobar su funcionamiento, acceder a esa dirección desde el navegador.

La API responderá inicialmente:

```json
{
  "message": "CVE Dashboard API funcionando"
}
```

Esta prueba permite verificar que el entorno Node.js y el servidor Express están correctamente configurados antes de comenzar la integración con la API NVD del NIST.

## Estructura inicial del proyecto

```text
dashboard-cybersecurity-cves/
├── backend/
│   ├── node_modules/
│   ├── .env
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## Archivos ignorados por Git

El archivo `.gitignore` debe incluir:

```gitignore
node_modules/
.env
```

## Estado actual

Actualmente se ha completado la preparación inicial del entorno de desarrollo:

- Node.js y npm instalados y verificados.
- Git instalado y operativo.
- MySQL Server 8.4 configurado como servicio de Windows.
- MySQL Workbench conectado correctamente al servidor local.
- Backend Node.js inicializado.
- Servidor Express funcionando en `http://localhost:3000`.
- Variables de entorno preparadas mediante `.env`.

El siguiente paso será integrar el backend con la API NVD del NIST para consultar vulnerabilidades CVE reales y analizar la estructura de los datos antes de diseñar las tablas definitivas en MySQL.
