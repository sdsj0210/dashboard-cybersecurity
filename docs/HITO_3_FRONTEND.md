# Hito 3 - Frontend

## Objetivo del hito

El objetivo de este hito fue desarrollar la interfaz web del Dashboard de Ciberseguridad CVEs y conectarla con los endpoints implementados en el backend.

Se desarrollaron las siguientes funcionalidades:

- Preparación del entorno React.
- Configuración de la estructura del frontend.
- Creación del layout principal.
- Listado de vulnerabilidades almacenadas en MySQL.
- Búsqueda y filtros combinables.
- Paginación de resultados.
- Navegación entre el listado y el detalle de una vulnerabilidad.
- Visualización de métricas CVSS, productos afectados y referencias externas.
- Adaptación de la interfaz a diferentes tamaños de pantalla.
- Gestión de estados de carga, errores y resultados vacíos.

## Inicialización del frontend

Se creó el frontend utilizando React con Vite y la plantilla JavaScript + JSX.

Desde la raíz del proyecto:

```powershell
npm create vite@latest frontend -- --template react
```

Dentro de la carpeta `frontend` se instalaron las dependencias necesarias:

```powershell
cd frontend
npm install
```

El servidor de desarrollo se inicia mediante:

```powershell
npm run dev
```

La aplicación queda disponible por defecto en:

```text
http://localhost:5173
```

## Tecnologías utilizadas

Para el desarrollo de la interfaz se utilizaron:

- React.
- Vite.
- JavaScript y JSX.
- Tailwind CSS v4.
- shadcn/ui con Base UI.
- React Router.
- Fetch API.
- Lucide React.
- Geist como fuente tipográfica.

Se utilizó ESLint para el análisis estático del código.

## Configuración de Tailwind CSS y shadcn/ui

Se instaló Tailwind CSS v4 junto con su integración para Vite:

```powershell
npm install tailwindcss @tailwindcss/vite
```

Se configuró el plugin de Tailwind en `vite.config.js` y se preparó `src/index.css` con los estilos generales de la aplicación.

Posteriormente se inicializó shadcn/ui utilizando el preset Nova y Base UI.

Se incorporaron los componentes necesarios para construir la interfaz:

```text
src/components/ui/
├── button.jsx
├── input.jsx
├── select.jsx
└── table.jsx
```

Estos componentes se utilizan en el formulario de filtros, la tabla de vulnerabilidades y los controles de paginación.

## Organización del frontend

El frontend se dividió en páginas, componentes reutilizables y una capa de servicios para las peticiones HTTP.

La estructura desarrollada es:

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── components/
    │   ├── Layout.jsx
    │   ├── CveFilters.jsx
    │   ├── CveTable.jsx
    │   ├── CvePagination.jsx
    │   └── ui/
    │       ├── button.jsx
    │       ├── input.jsx
    │       ├── select.jsx
    │       └── table.jsx
    ├── pages/
    │   ├── CveListPage.jsx
    │   └── CveDetailPage.jsx
    ├── services/
    │   └── cveService.js
    └── lib/
        └── utils.js
```

### Responsabilidad de cada parte

**`App.jsx`**

Define las rutas disponibles de la aplicación.

**`main.jsx`**

Inicializa React y configura `BrowserRouter`.

**`Layout.jsx`**

Contiene la estructura visual común de las páginas.

**`CveFilters.jsx`**

Contiene los campos de búsqueda y los filtros disponibles.

**`CveTable.jsx`**

Presenta los resultados de las vulnerabilidades en formato tabla o tarjetas, según el tamaño de la pantalla.

**`CvePagination.jsx`**

Contiene los controles para navegar entre páginas.

**`CveListPage.jsx`**

Gestiona los estados, ejecuta las consultas del listado y conecta los componentes.

**`CveDetailPage.jsx`**

Obtiene y presenta la información detallada de una vulnerabilidad.

**`cveService.js`**

Centraliza las peticiones HTTP realizadas al backend.

## Conexión con el backend

La comunicación entre React y Express se implementó utilizando Fetch API.

Se creó:

```text
src/services/cveService.js
```

La URL base utilizada durante el desarrollo es:

```javascript
const API_URL = "http://localhost:3000/api/cves";
```

Se implementaron dos funciones principales:

```javascript
getCves();
getCveById();
```

### Consulta del listado

`getCves()` permite enviar los parámetros de paginación y filtros al backend.

Parámetros utilizados:

```text
page
limit
cveId
severity
product
from
to
```

Los parámetros se construyen utilizando `URLSearchParams`.

Ejemplo de petición:

```http
GET /api/cves?page=1&limit=5&severity=HIGH
```

El resultado se obtiene en formato JSON.

La respuesta del backend contiene:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 0,
    "totalPages": 0
  }
}
```

### Consulta del detalle

`getCveById()` obtiene la información completa de una vulnerabilidad mediante su identificador.

Ejemplo:

```http
GET /api/cves/CVE-2025-0168
```

La función recibe el identificador CVE y realiza la petición correspondiente al backend.

Las funciones del servicio comprueban el estado de la respuesta HTTP y generan un error cuando la solicitud no se completa correctamente.

## Creación del layout principal

Se desarrolló:

```text
src/components/Layout.jsx
```

Este componente contiene los elementos visuales compartidos entre las páginas:

- Cabecera principal con el nombre CVE Monitor.
- Enlace de navegación hacia el listado.
- Menú lateral para escritorio.
- Contenedor principal para mostrar el contenido de cada página.

El layout recibe su contenido mediante `children`, permitiendo reutilizar la misma estructura visual en las diferentes vistas.

## Página principal y listado de vulnerabilidades

Se creó:

```text
src/pages/CveListPage.jsx
```

Esta página gestiona la consulta de vulnerabilidades almacenadas mediante `getCves()`.

Se utilizaron los hooks de React:

```javascript
useState;
useEffect;
```

Los estados implementados permiten almacenar:

- Resultados recibidos.
- Estado de carga.
- Errores de consulta.
- Página actual.
- Información de paginación.
- Valores de búsqueda.
- Filtros aplicados.

`useEffect` ejecuta una nueva consulta cuando cambia la página o alguno de los filtros aplicados.

### Tabla de CVEs

Se desarrolló el componente:

```text
src/components/CveTable.jsx
```

La tabla presenta los siguientes campos:

| Columna     | Información                        |
| ----------- | ---------------------------------- |
| CVE ID      | Identificador de la vulnerabilidad |
| Descripción | Descripción de la CVE              |
| CVSS        | Puntuación disponible              |
| Severidad   | Clasificación de gravedad          |
| Publicación | Fecha de publicación               |
| Producto    | Productos afectados                |

Los identificadores CVE contienen un enlace que permite acceder a su vista de detalle.

Para los registros que no disponen de puntuación, severidad u otros valores opcionales, se muestran textos alternativos como `N/D` o `Sin severidad`.

### Total de resultados

Se utiliza el campo:

```javascript
pagination.total;
```

para presentar la cantidad total de vulnerabilidades que cumplen los filtros aplicados.

De esta manera, el contador no se limita a los registros visibles en la página actual.

## Búsqueda y filtros

Se separó el formulario en el componente:

```text
src/components/CveFilters.jsx
```

Se implementaron los siguientes filtros:

- Búsqueda por identificador CVE.
- Severidad: crítica, alta, media y baja.
- Búsqueda por nombre de producto.
- Fecha inicial de publicación.
- Fecha final de publicación.

Los filtros pueden combinarse en una misma consulta.

Se incorporó un botón `Buscar` para aplicar los valores introducidos en los campos de identificador y producto.

El cambio de severidad o fecha actualiza directamente los parámetros correspondientes.

Al aplicar nuevos criterios, la paginación vuelve a la primera página.

También se añadió el botón `Limpiar`, que restablece todos los campos y filtros utilizados.

## Paginación

Se creó el componente:

```text
src/components/CvePagination.jsx
```

El frontend consulta cinco vulnerabilidades por página:

```javascript
getCves(page, 5, ...);
```

La paginación utiliza los valores proporcionados por el backend:

```text
page
totalPages
total
```

La interfaz presenta:

- Página actual.
- Número total de páginas.
- Botón Anterior.
- Botón Siguiente.

El botón `Anterior` se deshabilita en la primera página y el botón `Siguiente` en la última.

Cuando no existen resultados, los controles de paginación no se muestran.

Los filtros aplicados se conservan al navegar entre las páginas del listado.

## Configuración de React Router

Se instaló React Router para permitir la navegación entre las vistas.

En:

```text
src/main.jsx
```

se configuró `BrowserRouter` como contenedor principal de la aplicación.

Las rutas se definieron en:

```text
src/App.jsx
```

Rutas disponibles:

| Ruta           | Componente      |
| -------------- | --------------- |
| `/`            | `CveListPage`   |
| `/cves/:cveId` | `CveDetailPage` |

El componente `Link` se utiliza para navegar desde el listado hasta el detalle de una vulnerabilidad.

## Vista de detalle de una vulnerabilidad

Se desarrolló:

```text
src/pages/CveDetailPage.jsx
```

La página utiliza `useParams()` para recuperar el identificador incluido en la URL.

Posteriormente ejecuta:

```javascript
getCveById(cveId);
```

para consultar el endpoint de detalle del backend.

La información se presenta en apartados diferenciados.

### Información general

Se muestran:

- Identificador CVE.
- Descripción completa.
- Fecha de publicación.
- Fecha de última modificación.

### Métricas CVSS

Se recorren las métricas disponibles en la respuesta del backend.

Para cada métrica se presentan:

- Versión.
- Puntuación.
- Severidad.
- Vector CVSS.

Cuando una vulnerabilidad no contiene métricas, se muestra el mensaje correspondiente.

### Productos afectados

Se presenta la información asociada a los productos:

- Proveedor.
- Producto.
- Paquete.
- Versiones afectadas.

Se recorren las versiones relacionadas con cada producto y se presentan los límites de versión disponibles.

### Referencias externas

Se incorporó un apartado que muestra las URLs de referencia asociadas a la vulnerabilidad.

Los enlaces se abren en una nueva pestaña mediante:

```jsx
target = "_blank";
rel = "noopener noreferrer";
```

## Diseño responsive

Se adaptaron los componentes de la interfaz utilizando las clases responsive de Tailwind CSS.

### Vista de escritorio

Se utiliza una tabla construida con los componentes de shadcn/ui.

La tabla dispone de desplazamiento horizontal para evitar que los contenidos extensos desborden el contenedor.

El menú lateral permanece visible en los tamaños de pantalla correspondientes.

### Vista móvil

El listado utiliza tarjetas individuales en lugar de la tabla horizontal.

Cada tarjeta presenta:

- Identificador CVE.
- Severidad.
- Descripción resumida.
- Puntuación CVSS.
- Fecha de publicación.
- Producto afectado.
- Enlace al detalle.

Los campos del formulario de filtros se reorganizan según el espacio disponible.

También se incorporaron clases para ajustar textos extensos, como vectores CVSS, versiones de productos y referencias externas.

## Estados de la interfaz

Se implementó el tratamiento de diferentes estados durante las consultas HTTP.

### Carga

El listado utiliza el estado:

```javascript
loading;
```

para mostrar el mensaje:

```text
Cargando vulnerabilidades...
```

Mientras se realiza la petición, el contenido general del layout permanece visible.

### Errores

Se utiliza el estado:

```javascript
error;
```

para presentar el mensaje correspondiente cuando falla una consulta al backend.

### Sin resultados

Cuando el listado recibe un array vacío, `CveTable` presenta:

```text
No se encontraron vulnerabilidades.
```

Si no existen páginas disponibles, `CvePagination` no muestra sus controles.

### Valores no disponibles

Se contempló la ausencia de información opcional en las respuestas del backend, mostrando valores alternativos cuando corresponde.

## Scripts del frontend

En `frontend/package.json` se encuentran configurados los siguientes scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

Para iniciar el frontend:

```powershell
npm run dev
```

Para ejecutar el análisis estático del código:

```powershell
npm run lint
```

Para generar la compilación de producción:

```powershell
npm run build
```

## Resultado del Hito 3

Durante este hito se desarrolló la interfaz web de consulta de vulnerabilidades y se conectó con los endpoints del backend.

Quedaron implementados:

- Frontend React con Vite.
- Configuración de Tailwind CSS y shadcn/ui.
- Organización por páginas, componentes y servicios.
- Layout principal.
- Listado de CVEs almacenadas en MySQL.
- Consulta paginada.
- Contador total de resultados.
- Búsqueda y filtros combinables.
- Limpieza de filtros.
- Navegación entre páginas mediante React Router.
- Vista de detalle de vulnerabilidades.
- Visualización de métricas CVSS.
- Visualización de productos y versiones afectadas.
- Enlaces a referencias externas.
- Diseño responsive para escritorio y móvil.
- Gestión de carga, errores y resultados vacíos.
- Configuración de ESLint y compilación mediante Vite.
