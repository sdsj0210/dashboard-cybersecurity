# Dashboard de Ciberseguridad CVEs

Aplicación web para consultar y monitorizar vulnerabilidades CVE obtenidas desde la API oficial NVD del NIST.

El proyecto centraliza información de ciberseguridad en una solución propia, almacena los datos relevantes en MySQL y permite consultarlos de forma rápida mediante una API preparada para alimentar un dashboard.

## Tecnologías utilizadas

- Node.js
- Express
- MySQL
- React
- Git y GitHub
- node-cron
- nodemon

## Requisitos previos

Para ejecutar el proyecto en local es necesario tener instalado:

- Node.js
- npm
- Git
- MySQL Server 8.4
- MySQL Workbench o un cliente MySQL equivalente

Versiones utilizadas durante el desarrollo:

```text
Node.js v24.20.0
npm 11.19.0
Git 2.55.0.windows.3
MySQL Server 8.4
```

## Instalación y ejecución

Desde la carpeta `backend`:

```powershell
npm install
npm run dev
```

El servidor se ejecuta por defecto en:

```text
http://localhost:3000
```

Para comprobar que el backend está funcionando:

```http
GET /
```

Respuesta:

```json
{
  "message": "CVE Dashboard API funcionando"
}
```

## Variables de entorno

Crear el archivo:

```text
backend/.env
```

con los datos de conexión a MySQL:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=usuario_mysql
DB_PASSWORD=contraseña_mysql
DB_NAME=dashboard_cybersecurity
```

El archivo `.env` no debe subirse al repositorio.

## Arquitectura

El backend está organizado mediante una arquitectura por capas:

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

La comunicación con la fuente externa se realiza desde la capa de servicios:

```text
NIST NVD API
     ↓
   Backend
     ↓
    MySQL
```

Esta estructura separa la gestión de rutas, la lógica de la aplicación, el acceso a datos y la comunicación con NIST.

## Integración con NIST

Antes de cerrar el diseño de la base de datos se realizaron pruebas con datos reales de la API NVD del NIST.

A partir de esas pruebas se definió y ajustó la estructura necesaria para almacenar la información que utiliza el dashboard:

- Identificador de la vulnerabilidad.
- Descripción.
- Fecha de publicación.
- Fecha de última modificación.
- Estado.
- Puntuación y gravedad.
- Métricas.
- Productos y versiones afectadas.
- Debilidades.
- Referencias.

La aplicación normaliza los datos recibidos antes de almacenarlos en MySQL.

## Base de datos

La información se distribuye entre las siguientes tablas:

```text
cves
cve_metrics
cve_products
cve_product_versions
cve_weaknesses
cve_references
sync_ranges
```

La tabla `sync_ranges` registra los periodos que ya han sido sincronizados para evitar repetir peticiones innecesarias a NIST.

No se almacena historial de búsquedas de los usuarios.

## API desarrollada

### Listado de vulnerabilidades

```http
GET /api/cves
```

### Filtro por gravedad

```http
GET /api/cves?severity=HIGH
```

### Filtro por producto

```http
GET /api/cves?product=Microsoft
```

### Filtro por fechas

```http
GET /api/cves?from=2025-01-01&to=2025-01-31
```

### Filtro por identificador

```http
GET /api/cves?cveId=CVE-2025-0168
```

Los filtros pueden combinarse.

### Detalle de una vulnerabilidad

```http
GET /api/cves/CVE-2025-0168
```

Devuelve los datos generales de la vulnerabilidad junto con sus métricas, productos, versiones afectadas, debilidades y referencias.

Si la vulnerabilidad no existe, el backend responde con estado `404`.

### Sincronización manual

```http
POST /api/cves/sync?from=2025-01-01&to=2025-01-10
```

Permite sincronizar vulnerabilidades correspondientes a un rango de fechas.

Si parte del periodo ya está almacenado, el backend consulta únicamente las fechas que faltan.

## Sincronización histórica y paginación

La integración soporta consultas históricas por rangos de fechas.

Los periodos grandes se dividen automáticamente en bloques compatibles con los límites de NIST.

Además, si NIST devuelve más resultados de los que caben en una sola respuesta, el backend realiza automáticamente las peticiones necesarias hasta recuperar todos los resultados.

Los CVE existentes no se duplican: si una vulnerabilidad ya está almacenada, sus datos se actualizan.

## Automatización diaria

El backend ejecuta diariamente una sincronización automática con NIST.

El proceso consulta:

1. Vulnerabilidades publicadas recientemente.
2. Vulnerabilidades modificadas recientemente.

Los nuevos registros se almacenan en MySQL y los existentes se actualizan cuando NIST publica cambios.

```text
NIST
 ↓
CVEs nuevos y modificados
 ↓
Backend
 ↓
MySQL
```

La automatización se ejecuta mientras el backend se encuentra en funcionamiento.

## Hito 2.1 - Mejoras del Backend

Tras la revisión del Hito 2, se realizaron las siguientes mejoras:

- Se corrigió la duplicación de filas del listado causada por la relación con los productos afectados. El filtro por producto utiliza `EXISTS` y los nombres se agrupan en `products_summary`.
- Se añadió paginación a `GET /api/cves` mediante `page` y `limit`. La respuesta incluye `data` y `pagination`, con el número total de CVEs y de páginas.
- Se configuró la API key de NVD mediante `NVD_API_KEY` en `backend/.env` y se añadieron hasta tres reintentos con espera ante respuestas HTTP `429`.

Ejemplo de consulta paginada:

```http
GET /api/cves?page=1&limit=5
```

Los filtros pueden combinarse con la paginación:

```http
GET /api/cves?severity=HIGH&page=1&limit=5
```

La documentación de estos cambios se encuentra en:

```text
docs/HITO_2.1_MEJORAS_DEL_BACKEND.md
```

## Estructura actual del backend

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
    │   └── cveController.js
    ├── jobs/
    │   └── dailySync.js
    ├── repositories/
    │   └── cveRepository.js
    ├── routes/
    │   └── cveRoutes.js
    └── services/
        ├── cveService.js
        └── nistService.js
```

## Trabajo realizado

### Preparación del entorno

- Node.js y npm instalados y verificados.
- Git configurado.
- MySQL Server 8.4 configurado en Windows.
- MySQL Workbench conectado correctamente.
- Backend Node.js inicializado.
- Servidor Express configurado.
- Variables de entorno configuradas mediante `.env`.

### Backend y Base de Datos

- Conexión con la API NVD del NIST.
- Análisis de datos reales antes de definir el esquema final.
- Arquitectura por capas.
- Conexión con MySQL.
- Normalización de los datos recibidos.
- Persistencia de vulnerabilidades.
- Actualización de vulnerabilidades existentes.
- Paginación.
- Consulta histórica por fechas.
- Control de periodos ya sincronizados.
- División automática de rangos extensos.
- Listado y filtros.
- Consulta detallada por identificador.
- Sincronización manual.
- Sincronización automática diaria.
- Actualización de vulnerabilidades modificadas por NIST.
