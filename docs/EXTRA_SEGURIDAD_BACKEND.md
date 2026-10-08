# Extra - Seguridad del Backend

## Objetivo

Se incorporaron medidas adicionales de seguridad al backend del Dashboard de Ciberseguridad CVEs antes de su entrega y futuro despliegue.

Los cambios se centraron en proteger la API frente a peticiones excesivas, restringir el acceso desde navegadores a los orígenes autorizados, validar las entradas utilizadas por la sincronización manual y evitar que determinadas operaciones internas queden expuestas en producción.

## Dependencias incorporadas

Desde la carpeta `backend` se instalaron:

```powershell
npm install helmet express-rate-limit
```

Se utilizaron las siguientes dependencias:

- `helmet`: configuración de cabeceras HTTP de seguridad.
- `express-rate-limit`: limitación de peticiones realizadas a la API.
- `cors`: ya se encontraba instalado y se configuró de forma restrictiva.

## Variables de entorno

Se añadieron las siguientes variables al archivo:

```text
backend/.env
```

Configuración utilizada durante el desarrollo:

```env
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

`FRONTEND_URL` define el origen autorizado para las peticiones realizadas desde el navegador.

`NODE_ENV` permite diferenciar el comportamiento del backend entre desarrollo y producción.

El archivo `.env` continúa excluido del repositorio mediante `.gitignore`.

## Cabeceras HTTP de seguridad

En:

```text
backend/src/app.js
```

se incorporó Helmet:

```javascript
const helmet = require("helmet");

app.use(helmet());
```

Helmet añade automáticamente diferentes cabeceras HTTP de seguridad a las respuestas del backend.

Durante las comprobaciones se verificó la presencia de cabeceras como:

```text
Content-Security-Policy
Cross-Origin-Opener-Policy
Cross-Origin-Resource-Policy
Referrer-Policy
Strict-Transport-Security
X-Content-Type-Options
X-Frame-Options
```

## Configuración de CORS

La configuración anterior permitía cualquier origen:

```javascript
app.use(cors());
```

Se sustituyó por una configuración basada en la variable de entorno `FRONTEND_URL`:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);
```

Durante el desarrollo el origen autorizado es:

```text
http://localhost:5173
```

Se comprobó en las respuestas HTTP la cabecera:

```text
Access-Control-Allow-Origin: http://localhost:5173
```

## Limitación de peticiones

En:

```text
backend/src/app.js
```

se configuró un límite de peticiones utilizando `express-rate-limit`.

Configuración:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Demasiadas solicitudes. Inténtalo más tarde.",
  },
});
```

El límite se aplica a las rutas de CVEs:

```javascript
app.use("/api/cves", apiLimiter, cveRoutes);
```

Cada cliente puede realizar hasta 100 peticiones dentro de una ventana de 15 minutos.

Cuando se supera el límite, el backend responde con estado HTTP `429`.

Durante las comprobaciones se verificaron las cabeceras:

```text
RateLimit
RateLimit-Policy
```

## Límite del cuerpo JSON

La configuración de Express se modificó para limitar el tamaño de los cuerpos JSON recibidos:

```javascript
app.use(express.json({ limit: "10kb" }));
```

De esta forma, el backend no acepta cuerpos JSON innecesariamente grandes para las operaciones actuales de la API.

## Validación de fechas de sincronización

En:

```text
backend/src/controllers/cveController.js
```

se añadió validación para los parámetros `from` y `to` utilizados por la sincronización manual.

Se incorporó la función:

```javascript
const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};
```

La sincronización comprueba:

- Que `from` y `to` estén presentes.
- Que tengan formato `YYYY-MM-DD`.
- Que representen fechas válidas.
- Que la fecha inicial no sea posterior a la fecha final.

Una fecha no válida devuelve estado HTTP `400`.

Ejemplo:

```http
POST /api/cves/sync?from=2026-99-99&to=2026-10-01
```

Respuesta:

```json
{
  "message": "Las fechas deben tener formato YYYY-MM-DD"
}
```

## Límite del rango de sincronización manual

La sincronización manual se limitó a un máximo de 120 días por petición.

En:

```text
backend/src/controllers/cveController.js
```

se calcula la diferencia entre las fechas recibidas:

```javascript
const fromDate = new Date(`${from}T00:00:00.000Z`);
const toDate = new Date(`${to}T00:00:00.000Z`);

const diffDays =
  (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
```

Si el rango supera los 120 días:

```javascript
if (diffDays > 120) {
  return res.status(400).json({
    message: "El rango máximo permitido es de 120 días",
  });
}
```

Esto limita el tamaño de las sincronizaciones iniciadas manualmente desde la API.

## Sincronización manual en producción

La ruta de sincronización manual permanece disponible durante el desarrollo:

```http
POST /api/cves/sync
```

En:

```text
backend/src/routes/cveRoutes.js
```

la ruta se registra únicamente cuando el entorno no es producción:

```javascript
if (process.env.NODE_ENV !== "production") {
  router.post("/sync", cveController.syncCves);
}
```

Con:

```env
NODE_ENV=production
```

la ruta `/api/cves/sync` no se registra y una petición externa devuelve estado `404`.

La sincronización automática diaria continúa funcionando porque:

```text
backend/src/jobs/dailySync.js
```

llama directamente a:

```javascript
cveService.syncCves(...)
```

y no utiliza la ruta HTTP de sincronización manual.

## Timeout en las solicitudes a NIST

En:

```text
backend/src/services/nistService.js
```

se añadió un tiempo máximo de espera de 15 segundos a cada petición realizada a NIST.

Se utiliza `AbortController`:

```javascript
const controller = new AbortController();

const timeout = setTimeout(() => {
  controller.abort();
}, 15000);
```

La señal se pasa a `fetch`:

```javascript
const response = await fetch(url, {
  headers: {
    apiKey: process.env.NVD_API_KEY,
  },
  signal: controller.signal,
});
```

Si se supera el tiempo máximo:

```javascript
if (error.name === "AbortError") {
  throw new Error(
    "La solicitud a NIST superó el tiempo máximo de espera",
  );
}
```

El temporizador se elimina después de cada intento:

```javascript
finally {
  clearTimeout(timeout);
}
```

La lógica existente de reintentos ante respuestas HTTP `429` se mantiene.

## Auditoría de dependencias

Se utilizó:

```powershell
npm audit
```

para revisar las dependencias instaladas.

También se ejecutó:

```powershell
npm audit --omit=dev
```

para comprobar específicamente las dependencias utilizadas en producción.

Durante la revisión se actualizaron dependencias con correcciones disponibles mediante:

```powershell
npm audit fix
```

sin utilizar `--force`.

Tras las correcciones, la auditoría de dependencias de producción devolvió:

```text
found 0 vulnerabilities
```

Los avisos restantes corresponden a dependencias de desarrollo relacionadas con `nodemon`, `chokidar` y `braces`.

## Comprobaciones realizadas

Después de implementar los cambios se verificó:

- Inicio correcto del backend.
- Conexión correcta con MySQL.
- Funcionamiento del frontend.
- Consulta correcta del listado de CVEs.
- Consulta correcta del detalle de una vulnerabilidad.
- Presencia de cabeceras añadidas por Helmet.
- Restricción de CORS al frontend local.
- Presencia de las cabeceras de Rate Limiting.
- Validación de fechas incorrectas.
- Rechazo de rangos superiores a 120 días.
- Disponibilidad de `/api/cves/sync` durante el desarrollo.
- Deshabilitación de `/api/cves/sync` en producción.
- Funcionamiento de una sincronización normal con el timeout configurado.
- Auditoría de dependencias de producción sin vulnerabilidades conocidas.

## Archivos modificados

Los cambios de seguridad se realizaron en:

```text
backend/package.json
backend/package-lock.json
backend/src/app.js
backend/src/controllers/cveController.js
backend/src/routes/cveRoutes.js
backend/src/services/nistService.js
```

## Resultado

Se incorporaron medidas de endurecimiento del backend sin modificar las funcionalidades principales del Dashboard.

Quedaron implementados:

- Cabeceras HTTP de seguridad mediante Helmet.
- CORS restringido al frontend configurado.
- Rate Limiting para las rutas de CVEs.
- Límite de tamaño para cuerpos JSON.
- Validación de fechas de sincronización.
- Límite máximo de 120 días para la sincronización manual.
- Deshabilitación de la sincronización manual en producción.
- Timeout para solicitudes externas a NIST.
- Revisión y corrección de dependencias de producción vulnerables.
