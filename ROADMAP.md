# Roadmap — Dashboard Ciberseguridad CVEs

Este documento sirve para organizar y seguir el avance del proyecto.

---

## ✅ Hito 1 — Planificación

- [x] Definir objetivo del proyecto
- [x] Definir arquitectura general
- [x] Definir tecnologías principales
- [x] Definir fuente de datos oficial para CVEs
- [x] Preparar estructura inicial del proyecto

## ✅ Hito 2 — Backend y Base de Datos

- [x] Configurar backend con Node.js
- [x] Configurar servidor local
- [x] Configurar variables de entorno
- [x] Conectar backend con MySQL
- [x] Crear estructura por capas
- [x] Crear routes
- [x] Crear controllers
- [x] Crear services
- [x] Crear repositories
- [x] Conectar con la API de NVD
- [x] Analizar los datos reales recibidos desde NVD
- [x] Diseñar la estructura de la base de datos
- [x] Crear tablas para almacenar CVEs
- [x] Guardar métricas CVSS
- [x] Guardar productos afectados
- [x] Guardar referencias
- [x] Crear sincronización manual de CVEs
- [x] Crear sincronización por rango de fechas
- [x] Dividir rangos grandes en bloques
- [x] Evitar sincronizar rangos ya almacenados
- [x] Crear tabla `sync_ranges`
- [x] Actualizar CVEs ya existentes
- [x] Crear sincronización automática diaria
- [x] Procesar CVEs nuevos
- [x] Procesar CVEs modificados

---

## 🔧 Hito 2.1 — Mejoras antes del Frontend

### Endpoint de CVEs

- [x] Revisar `GET /api/cves`
- [x] Evitar CVEs duplicados cuando tienen varios productos afectados
- [x] Definir cómo devolver los productos afectados
- [x] Añadir paginación al endpoint
- [x] Añadir parámetro `page`
- [x] Añadir parámetro `limit`
- [x] Devolver número total de CVEs
- [x] Devolver número total de páginas
- [x] Probar paginación con una cantidad grande de datos

### NVD API

- [x] Obtener API Key gratuita de NVD
- [x] Añadir API Key a las variables de entorno
- [x] Enviar API Key en las peticiones a NVD
- [x] Detectar respuestas HTTP 429
- [x] Implementar reintentos
- [x] Añadir espera entre reintentos
- [x] Evitar que una sincronización completa falle por una petición puntual

---

## 🎨 Hito 3 — Frontend

### Preparación

- [ ] Crear frontend con React
- [ ] Configurar estructura de carpetas
- [ ] Configurar conexión con el backend
- [ ] Definir estructura general del dashboard
- [ ] Crear layout principal

### Dashboard

- [ ] Crear página principal
- [ ] Mostrar número total de CVEs
- [ ] Mostrar CVEs por severidad
- [ ] Mostrar información relevante del sistema
- [ ] Diseñar tarjetas resumen

### Listado de CVEs

- [ ] Crear tabla de CVEs
- [ ] Mostrar CVE ID
- [ ] Mostrar descripción
- [ ] Mostrar puntuación CVSS
- [ ] Mostrar severidad
- [ ] Mostrar fecha de publicación
- [ ] Mostrar producto o productos afectados
- [ ] Conectar tabla con `GET /api/cves`
- [ ] Implementar paginación
- [ ] Crear estados de carga
- [ ] Crear estado sin resultados
- [ ] Mostrar errores de conexión correctamente

### Búsqueda y filtros

- [ ] Buscar por CVE ID
- [ ] Filtrar por severidad
- [ ] Filtrar por producto
- [ ] Filtrar por fecha
- [ ] Combinar filtros
- [ ] Mantener filtros al cambiar de página
- [ ] Añadir opción para limpiar filtros

### Detalle de CVE

- [ ] Crear vista de detalle
- [ ] Mostrar descripción completa
- [ ] Mostrar puntuación CVSS
- [ ] Mostrar vector CVSS
- [ ] Mostrar métricas disponibles
- [ ] Mostrar productos afectados
- [ ] Mostrar referencias externas
- [ ] Mostrar fecha de publicación
- [ ] Mostrar fecha de última modificación

---

## 🧪 Hito 4 — Tests y Robustez

### Tests

- [ ] Configurar entorno de tests
- [ ] Crear tests para `getMissingRanges`
- [ ] Crear tests para `splitRangeIntoChunks`
- [ ] Probar rangos completos
- [ ] Probar rangos parcialmente sincronizados
- [ ] Probar rangos solapados
- [ ] Probar fechas límite
- [ ] Probar errores de sincronización

### Backend

- [ ] Revisar manejo global de errores
- [ ] Revisar validación de parámetros
- [ ] Revisar consultas SQL
- [ ] Revisar rendimiento con histórico grande
- [ ] Revisar índices de base de datos

### Frontend

- [ ] Revisar estados de carga
- [ ] Revisar estados de error
- [ ] Revisar diseño responsive
- [ ] Revisar experiencia de usuario
- [ ] Revisar rendimiento

---

## 🚀 Hito Final — Cierre del Proyecto

- [ ] Revisar frontend
- [ ] Revisar backend
- [ ] Revisar base de datos
- [ ] Revisar sincronización automática
- [ ] Revisar manejo de errores
- [ ] Limpiar código innecesario
- [ ] Revisar variables de entorno
- [ ] Comprobar que no haya credenciales en GitHub
- [ ] Actualizar README
- [ ] Actualizar este roadmap
- [ ] Preparar instrucciones de instalación
- [ ] Preparar instrucciones de ejecución
- [ ] Preparar demo del proyecto
- [ ] Preparar despliegue
- [ ] Realizar prueba completa del sistema

---

## Estado actual

**Hito actual:** Hito 2.1 — Mejoras antes del Frontend

**Siguiente tarea:**

- [ ] Corregir los CVEs duplicados en `GET /api/cves`

Después:

- [ ] Añadir paginación
- [ ] Configurar API Key de NVD
- [ ] Implementar manejo de errores 429 y reintentos

Una vez completadas estas tareas, comenzará el **Hito 3 — Frontend**.
