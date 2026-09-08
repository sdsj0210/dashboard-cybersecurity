# Dashboard de Ciberseguridad CVEs

## Hito 2 - Backend y Base de Datos

En este hito se ha desarrollado el backend de la aplicación y la integración con la base de datos MySQL, siguiendo la arquitectura planteada en la propuesta inicial.

El objetivo principal ha sido conectar la aplicación con la API oficial NVD del NIST, analizar los datos reales recibidos y, a partir de ellos, definir la estructura de almacenamiento necesaria para el dashboard.

## Tecnologías utilizadas

- Node.js
- Express
- MySQL
- Git y GitHub
- node-cron para automatización

## Arquitectura del backend

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

La comunicación con NIST se realiza desde la capa de servicios:

```text
NIST NVD API
     ↓
   Backend
     ↓
    MySQL
```

## Trabajo realizado

Durante el desarrollo se ha trabajado directamente con datos reales proporcionados por NIST antes de cerrar la estructura de la base de datos.

A partir de esas pruebas se han definido y ajustado las tablas necesarias para almacenar la información utilizada por el dashboard:

- Identificador de la vulnerabilidad.
- Descripción.
- Fecha de publicación y modificación.
- Estado.
- Puntuación y gravedad.
- Métricas.
- Productos y versiones afectadas.
- Debilidades.
- Referencias.

También se han implementado:

- Conexión y consumo de la API de NIST.
- Normalización de los datos recibidos.
- Almacenamiento en MySQL.
- Actualización de vulnerabilidades existentes.
- Paginación de resultados.
- Sincronización por rangos de fechas.
- Consulta de vulnerabilidades históricas.
- Control de periodos ya sincronizados para evitar llamadas innecesarias.
- División automática de rangos extensos.
- Sincronización automática diaria.
- Actualización de vulnerabilidades modificadas posteriormente por NIST.

## API desarrollada

### Listado de vulnerabilidades

```http
GET /api/cves
```

### Filtrado por gravedad

```http
GET /api/cves?severity=HIGH
```

### Filtrado por producto

```http
GET /api/cves?product=Microsoft
```

### Filtrado por fechas

```http
GET /api/cves?from=2025-01-01&to=2025-01-31
```

### Filtrado por identificador

```http
GET /api/cves?cveId=CVE-2025-0168
```

### Detalle de una vulnerabilidad

```http
GET /api/cves/CVE-2025-0168
```

### Sincronización manual con NIST

```http
POST /api/cves/sync?from=2025-01-01&to=2025-01-10
```

## Automatización

El backend ejecuta diariamente una sincronización automática con NIST.

El proceso consulta:

1. Vulnerabilidades publicadas recientemente.
2. Vulnerabilidades modificadas recientemente.

Los nuevos registros se almacenan en MySQL y los ya existentes se actualizan cuando NIST publica cambios.

```text
NIST
 ↓
CVEs nuevos y modificados
 ↓
Backend
 ↓
MySQL
```

## Ejecución local

Desde la carpeta `backend`:

```powershell
npm install
npm run dev
```

El servidor se ejecuta por defecto en:

```text
http://localhost:3000
```

Es necesario disponer de MySQL en ejecución y configurar previamente el archivo `.env` con los datos de conexión a la base de datos.

## Estado del Hito 2

Hito 2 completado:

- Backend desarrollado.
- Conexión con NIST validada.
- Base de datos diseñada a partir de datos reales.
- Persistencia y actualización de vulnerabilidades implementada.
- Consultas y filtros funcionando.
- Sincronización manual e histórica funcionando.
- Sincronización automática diaria funcionando.
