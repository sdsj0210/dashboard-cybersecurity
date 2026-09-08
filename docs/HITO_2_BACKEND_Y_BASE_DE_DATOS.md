# Hito 2 - Backend y Base de Datos

## Objetivo del hito

El objetivo de este hito fue desarrollar la parte funcional del backend:

- conectar con la API oficial NVD del NIST,
- analizar datos CVE reales,
- diseñar la base de datos a partir de esos datos,
- guardar y actualizar vulnerabilidades,
- crear endpoints de consulta,
- añadir filtros,
- permitir sincronización histórica,
- automatizar la sincronización diaria.

La recomendación principal fue no diseñar primero una base de datos teórica, sino observar cómo venían los datos reales desde NIST y almacenar únicamente la información útil para el dashboard.

## Primera conexión con NIST

Se creó:

```text
src/services/nistService.js
```

para separar la comunicación con NIST de la lógica del resto de la aplicación.

La fuente utilizada es:

```text
https://services.nvd.nist.gov/rest/json/cves/2.0
```

Las primeras pruebas se realizaron con rangos pequeños y un número reducido de resultados para entender la estructura real del JSON.

## Análisis de los datos recibidos

Durante las pruebas se observó que un CVE puede contener:

- identificador,
- descripción en diferentes idiomas,
- fuente,
- fecha de publicación,
- fecha de modificación,
- estado,
- varias métricas,
- distintas versiones de puntuación,
- productos afectados,
- diferentes versiones del producto,
- debilidades,
- referencias.

También se comprobó que no todos los CVE tienen exactamente la misma estructura.

Por ejemplo:

- algunos tienen varias versiones de puntuación,
- algunos tienen varias fuentes,
- algunos tienen múltiples productos,
- algunos tienen listas muy largas de versiones.

Esto fue importante para decidir cómo estructurar MySQL.

## Diseño de la base de datos

Se creó la base:

```sql
CREATE DATABASE dashboard_cybersecurity;
```

y se dividió la información en varias tablas relacionadas.

### `cves`

Contiene la información general.

Campos principales:

- `cve_id`
- `source_identifier`
- `description_en`
- `description_es`
- `published_at`
- `last_modified_at`
- `status`

El campo:

```text
cve_id
```

se configuró como único para evitar duplicados.

## `cve_metrics`

Se creó una tabla separada porque una vulnerabilidad puede tener varias métricas.

Se almacenan:

- versión,
- puntuación,
- gravedad,
- vector,
- fuente,
- tipo,
- puntuación de explotabilidad,
- puntuación de impacto.

## `cve_products`

Se utiliza para almacenar productos y fabricantes asociados a una vulnerabilidad.

Campos principales:

- vendor,
- product,
- package_name,
- collection_url,
- default_status.

## `cve_product_versions`

Permite guardar diferentes versiones o rangos de versiones para un mismo producto.

Campos:

- version,
- less_than,
- less_than_or_equal,
- version_type,
- status.

## `cve_weaknesses`

Se utiliza para almacenar debilidades como:

```text
CWE-89
```

## `cve_references`

Se utiliza para almacenar:

- URL,
- fuente,
- etiquetas.

## Ajustes de esquema basados en datos reales

Durante pruebas con rangos más grandes aparecieron errores de longitud.

### Problema con `product`

Inicialmente:

```sql
product VARCHAR(255)
```

Un CVE de MediaTek devolvía una lista muy larga de productos.

El error fue:

```text
Data too long for column 'product'
```

Se cambió a:

```sql
product TEXT
```

También se amplió:

```sql
vendor TEXT
```

### Problema con `version`

Otro CVE devolvía una lista extensa de versiones:

```text
7.1, 7.2, 8.0, 8.1, ...
```

El campo original:

```sql
version VARCHAR(100)
```

no era suficiente.

Se cambió a:

```sql
version TEXT
less_than TEXT
less_than_or_equal TEXT
```

Este fue uno de los puntos más importantes del hito: el esquema final se ajustó a partir de datos reales de NIST, no únicamente de supuestos iniciales.

## Normalización de datos

En:

```text
src/services/cveService.js
```

se creó una función de normalización antes de guardar los datos.

La estructura general es:

```javascript
{
  cve,
  metrics,
  products,
  weaknesses,
  references
}
```

También se separó la normalización en funciones específicas:

```text
normalizeGeneralData
normalizeMetrics
normalizeProducts
normalizeWeaknesses
normalizeReferences
```

Esto permite transformar el JSON complejo de NIST a una estructura más sencilla para MySQL.

## Repositorio

En:

```text
src/repositories/cveRepository.js
```

se implementaron las operaciones de acceso a MySQL.

La capa Repository es la única que contiene consultas SQL.

## Guardado de CVEs

La función principal:

```text
saveCve()
```

utiliza una transacción para guardar todos los datos relacionados de una vulnerabilidad.

El flujo es:

```text
guardar datos generales
 ↓
borrar relaciones antiguas
 ↓
guardar métricas
 ↓
guardar productos
 ↓
guardar versiones
 ↓
guardar debilidades
 ↓
guardar referencias
```

Si ocurre un error durante el proceso:

```text
rollback
```

Si todo funciona:

```text
commit
```

Esto evita dejar datos parciales.

## Actualización de vulnerabilidades existentes

Para los datos generales se utilizó:

```sql
ON DUPLICATE KEY UPDATE
```

Como `cve_id` es único:

```text
CVE nuevo
→ INSERT

CVE existente
→ UPDATE
```

Antes de volver a guardar los datos relacionados se eliminan las relaciones anteriores.

Esto evita tener métricas o productos antiguos duplicados cuando NIST modifica un CVE.

## Listado general

Se creó:

```http
GET /api/cves
```

Este endpoint obtiene los CVE almacenados en MySQL.

El listado devuelve datos útiles para el dashboard como:

- identificador,
- descripción,
- fechas,
- estado,
- puntuación,
- gravedad,
- versión de la puntuación,
- fabricante,
- producto.

## Conversión de puntuaciones

MySQL devuelve campos `DECIMAL` como texto.

Por ejemplo:

```json
"score": "7.5"
```

En la capa Service se convirtió con:

```javascript
Number(cve.score)
```

para devolver:

```json
"score": 7.5
```

## Filtros

Se implementaron filtros dinámicos sobre:

### Gravedad

```http
GET /api/cves?severity=HIGH
```

### Producto

```http
GET /api/cves?product=Job
```

La búsqueda utiliza:

```sql
LIKE
```

para permitir coincidencias parciales.

### Fecha inicial

```http
GET /api/cves?from=2025-01-01
```

### Fecha final

```http
GET /api/cves?to=2025-01-31
```

Para incluir el día completo se utilizó:

```sql
c.published_at < DATE_ADD(?, INTERVAL 1 DAY)
```

### Identificador

```http
GET /api/cves?cveId=CVE-2025-0168
```

Los filtros pueden combinarse.

## Endpoint de detalle

Se creó:

```http
GET /api/cves/:cveId
```

Ejemplo:

```http
GET /api/cves/CVE-2025-0168
```

Este endpoint devuelve:

- datos generales,
- métricas,
- productos,
- versiones,
- debilidades,
- referencias.

Si no existe:

```json
{
  "message": "CVE no encontrada"
}
```

con estado:

```text
404
```

## Sincronización manual

Se creó:

```http
POST /api/cves/sync
```

y después se amplió para aceptar rangos:

```http
POST /api/cves/sync?from=2025-01-01&to=2025-01-10
```

Esto permite cargar datos históricos bajo demanda.

## Paginación

NIST puede devolver más resultados que una sola página.

Se implementó paginación utilizando:

```text
resultsPerPage
startIndex
```

El backend continúa haciendo peticiones hasta recuperar todos los resultados del rango.

Ejemplo real probado:

```text
2025-01-01 → 2025-01-07
```

Resultado:

```text
816 vulnerabilidades
```

## Tabla `sync_ranges`

Se creó:

```sql
CREATE TABLE sync_ranges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    synchronized_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Esta tabla no almacena búsquedas de usuarios.

Se utiliza únicamente como control técnico para saber qué periodos ya han sido sincronizados.

## Detección de periodos faltantes

Se creó lógica para comparar:

```text
periodo solicitado
vs
periodos ya sincronizados
```

Ejemplo:

```text
Ya almacenado:
2025-01-01 → 2025-01-07

Solicitado:
2025-01-05 → 2025-01-10
```

Resultado:

```text
Consultar solamente:
2025-01-08 → 2025-01-10
```

Prueba real:

```text
synchronizedRanges:
2025-01-08 → 2025-01-10
```

Resultado:

```text
468 vulnerabilidades
```

## Rangos ya sincronizados

Si se pide un periodo completamente almacenado:

```text
2025-01-03 → 2025-01-06
```

el backend responde:

```text
El periodo solicitado ya estaba sincronizado
```

y:

```text
synchronized: 0
```

Esto evita peticiones innecesarias.

## División automática de rangos grandes

Para trabajar con rangos históricos extensos se creó una función:

```text
splitRangeIntoChunks
```

que divide automáticamente el periodo en bloques de máximo 120 días.

Ejemplo probado:

```text
2002-01-01 → 2002-05-15
```

Se dividió en:

```text
2002-01-01 → 2002-04-30
2002-05-01 → 2002-05-15
```

Resultado:

```text
191 vulnerabilidades
```

## Logs de progreso

Durante sincronizaciones grandes se añadieron logs para poder ver el avance.

Ejemplo:

```text
Consultando NIST: 2002-01-01 → 2002-04-30
NIST devolvió ...
Guardadas 100 de ...
Rango completado ...
```

Esto ayuda a distinguir un proceso lento de un proceso bloqueado.

## Automatización diaria

Se instaló:

```text
node-cron
```

y se creó:

```text
src/jobs/dailySync.js
```

La tarea está programada con:

```javascript
cron.schedule("0 2 * * *", ...)
```

Esto significa:

```text
cada día a las 02:00
```

## Primera sincronización automática

La primera versión calculaba el día anterior y ejecutaba:

```text
syncCves(fecha, fecha)
```

Prueba real:

```text
Iniciando sincronización automática de CVEs para 2026-09-06
Sincronización automática completada. CVEs sincronizados: 90
```

## Actualización de vulnerabilidades modificadas

Se identificó que no era suficiente descargar únicamente los CVE publicados recientemente.

NIST también puede modificar vulnerabilidades ya existentes.

Se añadió:

```text
getModifiedCves()
```

utilizando:

```text
lastModStartDate
lastModEndDate
```

También se creó:

```text
syncModifiedCves()
```

La automatización diaria pasó a ejecutar dos procesos:

```text
1. CVEs publicados recientemente.
2. CVEs modificados recientemente.
```

## Prueba final de automatización

La ejecución de prueba mostró:

```text
Iniciando sincronización automática para 2026-09-07

NIST devolvió 255 vulnerabilidades
Guardadas 100 de 255 vulnerabilidades
Guardadas 200 de 255 vulnerabilidades
CVEs nuevos sincronizados: 255

NIST devolvió 242 CVEs modificados
Actualizados 100 de 242 CVEs modificados
Actualizados 200 de 242 CVEs modificados
CVEs modificados actualizados: 242

Sincronización automática diaria completada
```

Esto confirmó el flujo completo:

```text
NIST
 ↓
nuevos CVEs
 ↓
guardar
 ↓
CVEs modificados
 ↓
actualizar
 ↓
MySQL
```

## Arquitectura final del backend

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

## Responsabilidad de cada parte

### `server.js`

- carga variables de entorno,
- comprueba MySQL,
- inicia la sincronización automática,
- levanta el servidor.

### `app.js`

- configura Express,
- activa CORS,
- procesa JSON,
- registra las rutas.

### `cveRoutes.js`

Define los endpoints.

### `cveController.js`

Gestiona las peticiones y respuestas HTTP.

### `cveService.js`

Contiene:

- normalización,
- lógica de sincronización,
- filtros de rangos,
- división de periodos,
- actualización de CVEs modificados.

### `nistService.js`

Gestiona:

- consultas a NIST,
- filtros de fecha,
- paginación.

### `cveRepository.js`

Gestiona todo el acceso a MySQL.

### `dailySync.js`

Gestiona la sincronización programada.

## Resultado del Hito 2

Al finalizar este hito quedaron implementados:

- integración real con NIST,
- análisis de datos reales,
- base de datos adaptada a esos datos,
- almacenamiento de vulnerabilidades,
- actualización de CVEs existentes,
- métricas,
- productos,
- versiones,
- debilidades,
- referencias,
- listado general,
- filtros,
- detalle por CVE,
- respuesta 404,
- sincronización manual,
- histórico por fechas,
- paginación,
- control de rangos sincronizados,
- detección de huecos,
- división de rangos grandes,
- automatización diaria,
- actualización automática de vulnerabilidades modificadas.

Con esto quedó completada la parte de Backend y Base de Datos.
