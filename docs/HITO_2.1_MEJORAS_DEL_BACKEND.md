# Hito 2.1 - Mejoras del Backend

## Objetivo del hito

Se aplicaron las sugerencias de Mar Ruiz sobre el listado de CVEs y la integración con NVD:

- Evitar que una CVE aparezca repetida en el listado por tener varios productos afectados.
- Añadir paginación a `GET /api/cves`.
- Incorporar una API key de NVD y reintentos con espera ante respuestas HTTP `429`.

## Corrección de duplicados en el listado

En:

```text
backend/src/repositories/cveRepository.js
```

se modificó `getAllCves()` para eliminar el `JOIN` directo con `cve_products`, que generaba una fila por producto afectado.

El filtro por producto utiliza `EXISTS`:

```sql
AND EXISTS (
  SELECT 1
  FROM cve_products cp
  WHERE cp.cve_id = c.id
    AND cp.product LIKE ?
)
```

Los productos asociados se presentan en el campo `products_summary` mediante `GROUP_CONCAT` y `DISTINCT`:

```sql
(
  SELECT GROUP_CONCAT(
    DISTINCT cp.product
    ORDER BY cp.product
    SEPARATOR ', '
  )
  FROM cve_products cp
  WHERE cp.cve_id = c.id
) AS products_summary
```

Así, la relación con varios productos no multiplica las filas del listado. El endpoint de detalle mantiene la información completa de los productos y sus versiones.

## Paginación del listado

Se añadieron los parámetros `page` y `limit` a:

```http
GET /api/cves?page=1&limit=20
```

- `page`: página solicitada; valor predeterminado `1`.
- `limit`: cantidad de CVEs por página; valor predeterminado `20` y máximo `100`.

En:

```text
backend/src/controllers/cveController.js
backend/src/services/cveService.js
backend/src/repositories/cveRepository.js
```

se incorporó el paso de los parámetros, el cálculo del desplazamiento y la consulta paginada.

El desplazamiento se calcula con:

```javascript
const offset = (page - 1) * limit;
```

La consulta SQL utiliza:

```sql
LIMIT ? OFFSET ?
```

Se añadió `COUNT(DISTINCT c.id)` para obtener el número total de vulnerabilidades que cumplen los filtros.

La respuesta contiene los datos y la información de paginación:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Los filtros existentes se pueden combinar con la paginación:

```http
GET /api/cves?severity=HIGH&page=1&limit=5
```

## API key de NVD y reintentos

Se configuró la variable de entorno:

```env
NVD_API_KEY=tu_clave
```

En:

```text
backend/src/services/nistService.js
```

se añadió la cabecera `apiKey` a las solicitudes:

```javascript
const response = await fetch(url, {
  headers: {
    apiKey: process.env.NVD_API_KEY,
  },
});
```

También se incorporó `fetchWithRetry()`. Ante una respuesta HTTP `429`, realiza hasta tres reintentos con esperas de 5, 10 y 15 segundos.

```javascript
const waitTime = (attempt + 1) * 5000;
await sleep(waitTime);
```

Las respuestas correctas se devuelven directamente. Si se agotan los reintentos o se recibe otro error HTTP, se lanza un error.

`fetchCves()` utiliza `fetchWithRetry()` al consultar las páginas de resultados de NVD.

## Resultado del Hito 2.1

Se implementaron las mejoras del listado para evitar la multiplicación de filas por productos afectados, consultar las vulnerabilidades por páginas y gestionar respuestas HTTP `429` de NVD mediante una API key y reintentos con espera.
