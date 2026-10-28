# Hito 4 - Pruebas y Robustez

## Objetivo del hito

El objetivo de este hito fue comprobar el funcionamiento del backend y del frontend, reforzar la sincronización con NIST y corregir los comportamientos detectados durante las pruebas del dashboard.

## Mejoras de robustez del backend

Se realizaron las siguientes mejoras:

- Sincronización automática de CVEs al iniciar el backend, después de comprobar la conexión con MySQL.
- Sincronización diaria a las 02:00, hora de Canarias, mediante `node-cron`.
- Recuperación de periodos pendientes en bloques de hasta siete días y revisión de los dos últimos días del periodo previamente sincronizado.
- Control de concurrencia mediante `syncCoordinator.js` para evitar sincronizaciones simultáneas. La sincronización manual devuelve HTTP `409` cuando ya existe otra en curso.
- Ampliación a 30 segundos del timeout por petición a NIST.
- Hasta tres reintentos adicionales ante respuestas HTTP `408`, `429`, errores `5xx`, errores de red y tiempos de espera agotados.
- Configuración de MySQL para devolver los campos `DATE` como cadenas, evitando conversiones de fecha no deseadas.

## Pruebas automatizadas del backend

Se incorporaron pruebas unitarias con el módulo nativo `node:test` de Node.js, organizadas en `backend/test/`.

Se probaron la configuración del servidor, las rutas, los controladores, los servicios, el repositorio, la conexión configurada a MySQL, la sincronización diaria y el control de concurrencia. Las consultas y servicios externos se simularon durante las pruebas unitarias.

Para ejecutarlas desde `backend`:

```powershell
npm test
```

Para comprobar la cobertura:

```powershell
node --test --experimental-test-coverage
```

Resultados obtenidos:

- 88 pruebas correctas en 10 archivos.
- 0 pruebas fallidas.
- Cobertura de líneas: 99,44 %.
- Cobertura de ramas: 90,23 %.
- Cobertura de funciones: 100 %.

## Mejoras y pruebas del frontend

Se reorganizó la lógica del listado mediante los hooks `useCveFilters` y `useCves`, manteniendo los componentes de presentación separados de la gestión de filtros y consultas.

Se ajustaron los siguientes comportamientos:

- Conservación de filtros y paginación en los parámetros de la URL al navegar y recargar la página.
- Búsqueda por CVE ID independiente de los filtros anteriores de severidad, producto y fechas.
- Combinación de filtros generales de severidad, producto y rango de fechas.
- Validación de fechas inexistentes y rangos invertidos antes de realizar la búsqueda.
- Aviso visual destacado para errores de fecha y ocultación de resultados anteriores, contador y paginación mientras exista un error de validación.

Se configuró Vitest con React Testing Library y `jsdom`. Las pruebas se organizaron en `frontend/test/`.

Estas pruebas verifican las utilidades de fechas, los servicios HTTP simulados, los hooks, el formulario de filtros, el listado, la paginación, la tabla y la vista de detalle.

Para ejecutarlas desde `frontend`:

```powershell
npm test
```

Resultados obtenidos:

- 69 pruebas correctas en 9 archivos.
- 0 pruebas fallidas.

## Comprobaciones finales

Se realizaron las siguientes comprobaciones:

- Ejecución de las pruebas automatizadas del backend y frontend.
- Validación manual en el navegador de búsqueda por CVE ID, filtros por severidad, producto y fechas, combinación de filtros y paginación.
- Comprobación del aviso de fechas inválidas y de la ocultación de resultados anteriores.
- Ejecución de `npm run lint` y `npm run build` en el frontend, sin errores.
- Auditoría y actualización de dependencias con `npm audit` y `npm audit fix`. La última auditoría del frontend devolvió `0 vulnerabilities`.

## Resultado

Se completaron **157 pruebas automatizadas**: 88 del backend y 69 del frontend, todas correctas. También se verificaron las mejoras de sincronización y los ajustes funcionales del dashboard, y se comprobó su compilación de producción.
