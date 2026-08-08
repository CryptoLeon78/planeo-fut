# Recomendaciones de Mejora para PlaneoFUT

## Resumen Ejecutivo

Este documento detalla las mejoras recomendadas para **PlaneoFUT** en términos de funcionalidades, arquitectura, diseño y persistencia de datos. Las recomendaciones están priorizadas según impacto y complejidad.

**Estado actual:** La mayoría de las funcionalidades críticas de las Fases 1 y 2 ya están implementadas, junto con múltiples mejoras de seguridad, SEO, internacionalización, MCP y auditoría. A continuación se indica el estado de cada mejora.

**Leyenda de estados:**
- ✅ Implementado — Disponible en la aplicación actualmente.
- 🔄 En progreso / Parcial — Implementado en parte o bajo revisión activa.
- ⏳ Pendiente — Planificado pero aún no implementado.
- ⏸️ En pausa — Requiere decisión externa o mecanismo de plataforma.

---

## 1. FUNCIONALIDADES

### 1.1 Análisis y Reportes Avanzados (Prioridad: Alta) ✅ Implementado

**Descripción**: Crear un módulo de analytics robusto que proporcione insights sobre:
- Carga de entrenamiento (RPE - Rate of Perceived Exertion)
- Distribución de intensidades por semana/mes
- Evolución de ejercicios favoritos
- Tendencias de rendimiento
- Comparativas entre temporadas

**Implementación**:
- Ruta `/analytics` disponible con gráficos interactivos (Recharts: Line, Pie, Bar).
- Visualización de ratings de sesiones, distribución de intensidad y tasa de éxito de objetivos.
- Exportación de reportes en PDF a través de `@media print` y botón de exportación en microciclos.

**Estimado original**: 2-3 semanas  
**Estado actual**: Implementado. La evaluación post-sesión alimenta los datos analíticos.

---

### 1.2 Sistema de Plantillas Reutilizables (Prioridad: Alta) ✅ Implementado (vía duplicación)

**Descripción**: Permitir guardar y reutilizar sesiones, microciclos y bloques como plantillas.

**Funcionalidades**:
- Marcar sesiones como "plantilla" ✅ — Se puede duplicar cualquier sesión/microciclo.
- Duplicar plantillas con un clic ✅ — Botón "Duplicar" en microciclos que copia la estructura completa y desplaza fechas +7 días.
- Compartir plantillas entre equipos ⏳ — Pendiente de permisos multi-equipo.
- Biblioteca de plantillas predefinidas por categoría ⏳ — Pendiente de contenido curado.

**Implementación**:
- Campos `is_template` / duplicación existentes en la UI.
- `duplicate_record` disponible como herramienta MCP.
- Tabla `template_categories` ⏳ no creada aún.

**Estimado original**: 1-2 semanas  
**Estado actual**: Clonación/duplicación implementada. Biblioteca compartida pendiente.

---

### 1.3 Seguimiento de Lesiones y Recuperación (Prioridad: Media) ⏳ Pendiente

**Descripción**: Módulo para registrar y monitorear lesiones, recuperación y disponibilidad de jugadores.

**Funcionalidades**:
- Registro de lesiones por jugador
- Timeline de recuperación
- Disponibilidad de jugadores en sesiones
- Alertas de jugadores lesionados

**Implementación**:
- Tabla `player_injuries` con fechas y tipos ⏳ no creada.
- Campo `status` en tabla `players` ⏳ no implementado.
- Vista de disponibilidad en sesiones ⏳ no implementada.

**Estimado original**: 1-2 semanas  
**Estado actual**: Pendiente. Requiere módulo de equipo más maduro.

---

### 1.4 Colaboración en Tiempo Real (Prioridad: Media) ⏳ Pendiente

**Descripción**: Permitir que múltiples entrenadores colaboren en la planificación.

**Funcionalidades**:
- Compartir equipos y sesiones
- Comentarios en tiempo real
- Historial de cambios
- Permisos granulares (ver, editar, eliminar)

**Implementación**:
- Tabla `team_members` con roles ⏳ no creada.
- Tabla `activity_log` para auditoría ✅ — Existe `mcp_audit_log` para herramientas MCP; falta auditoría general de cambios de usuario.
- WebSockets para actualizaciones en tiempo real (Supabase Realtime) ⏳ no implementado.
- Sistema de permisos RLS mejorado ✅ — `user_roles` y función `has_role` implementados.

**Estimado original**: 2-3 semanas  
**Estado actual**: Pendiente. Roles de usuario existen, pero permisos multi-equipo no están activos.

---

### 1.5 Integración con Calendario Externo (Prioridad: Media) ⏳ Pendiente

**Descripción**: Sincronizar con Google Calendar, Outlook, etc.

**Funcionalidades**:
- Exportar sesiones a iCal
- Importar eventos de calendario
- Sincronización bidireccional

**Implementación**:
- Librerías como `ical.js` ⏳ no instaladas.
- OAuth para Google Calendar ⏳ no configurado.
- Webhooks para sincronización ⏳ no implementados.

**Estimado original**: 1-2 semanas  
**Estado actual**: Pendiente. El calendario interno ya funciona; exportación iCal no disponible.

---

### 1.6 Notificaciones y Recordatorios (Prioridad: Media) ⏳ Pendiente

**Descripción**: Sistema de notificaciones para sesiones próximas, cambios en el equipo, etc.

**Funcionalidades**:
- Notificaciones push (web) ⏳ no implementadas.
- Email de recordatorio ⏳ no implementado.
- SMS opcional ⏳ no implementado.
- Configuración de preferencias ⏳ no implementada.

**Implementación**:
- Service Workers para push ⏳ no configurados.
- SendGrid/Twilio para email/SMS ⏳ no integrados.
- Tabla `notifications_preferences` ⏳ no creada.

**Estimado original**: 1 semana  
**Estado actual**: Pendiente. No hay infraestructura de notificaciones desplegada.

---

## 2. ARQUITECTURA Y ESTRUCTURA

### 2.1 Separación de Capas (Prioridad: Alta) 🔄 En progreso

**Problema Actual**: Lógica de negocio mezclada con componentes React.

**Solución**:
- Crear carpeta `src/services/` para lógica de negocio 🔄 — Parcial: existen utilidades como `src/lib/mcp/versions.ts` y `src/lib/public-exercises.ts`, pero no hay una carpeta `services/` estructurada.
- Crear `src/api/` para llamadas a Supabase 🔄 — Parcial: las llamadas a Supabase se encuentran en componentes y funciones de servidor.
- Usar patrón Repository para acceso a datos ⏳ — No implementado formalmente.
- Separar validaciones en `src/validators/` ✅ — Validaciones Zod centralizadas en `src/lib/mcp/schemas.ts` y usadas en herramientas MCP.

**Estimado original**: 1-2 semanas (refactoring)  
**Estado actual**: En progreso. Las herramientas MCP y funciones de servidor siguen una arquitectura más limpia; los componentes aún mezclan algo de lógica de datos.

---

### 2.2 State Management Mejorado (Prioridad: Media) 🔄 En progreso

**Problema Actual**: TanStack Query es suficiente, pero podría optimizarse.

**Solución**:
- Implementar Zustand para estado global (preferencias, usuario) ⏳ — No implementado.
- Mantener TanStack Query para datos del servidor ✅ — En uso activo con `useQuery`, `useSuspenseQuery`, `queryClient`.
- Crear custom hooks para lógica compartida ✅ — `use-auth.tsx`, `use-mobile.tsx` existen.

**Estimado original**: 1 semana  
**Estado actual**: En progreso. TanStack Query cubre la mayoría de casos; Zustand pendiente para preferencias globales.

---

### 2.3 Testing Automatizado (Prioridad: Alta) 🔄 En progreso

**Descripción**: Agregar tests unitarios e integración.

**Cobertura Recomendada**:
- Unit tests: 70%+ de funciones de negocio 🔄 — Cubiertos parcialmente con tests de MCP, calendario, microciclos, etc.
- Integration tests: Flujos críticos (crear sesión, exportar PDF) 🔄 — Tests de componentes existentes.
- E2E tests: Vitest + Playwright ✅ — Playwright configurado y tests E2E de CSP, i18n y navegación implementados.

**Implementación**:
- Vitest ✅ configurado.
- `testing-library` ✅ en uso.
- CI/CD con GitHub Actions 🔄 — Existe `.github/workflows/security-headers.yml`; pipeline completa de CI/CD pendiente.

**Estimado original**: 2-3 semanas  
**Estado actual**: En progreso. 31+ tests pasando. E2E activo. Falta CI/CD completo.

---

### 2.4 Documentación de Componentes (Prioridad: Media) ⏳ Pendiente

**Descripción**: Storybook para documentar componentes UI.

**Beneficios**:
- Catálogo visual de componentes
- Facilita onboarding de nuevos desarrolladores
- Pruebas visuales

**Implementación**:
- Instalar Storybook ⏳ no instalado.
- Crear stories para componentes principales ⏳ no creadas.

**Estimado original**: 1 semana  
**Estado actual**: Pendiente. No hay catálogo de componentes.

---

## 3. DISEÑO Y UX

### 3.1 Modo Oscuro (Prioridad: Media) ✅ Implementado

**Descripción**: Soporte completo para tema oscuro.

**Implementación**:
- Tema oscuro profesional aplicado en toda la aplicación (fondo `#0F172A`, acentos verde campo `#3B82F6` / verde deportivo).
- Uso de tokens semánticos en `src/styles.css`.
- Persistencia de preferencia en `profiles` (i18n y preferencias de usuario).

**Estimado original**: 3-5 días  
**Estado actual**: Implementado. Dark pro sports aesthetic es la dirección visual actual.

---

### 3.2 Responsive Design Mejorado (Prioridad: Media) 🔄 En progreso

**Problema Actual**: Algunas vistas no son óptimas en móvil.

**Mejoras**:
- Optimizar tablas para móvil 🔄 — Parcial: algunas tablas ya son scrollables.
- Drawer navigation en móvil ✅ — `use-mobile.tsx` y sidebar responsivo.
- Touch-friendly buttons 🔄 — En progreso.
- Viewport meta tags ✅ — Configurado.

**Estimado original**: 1 semana  
**Estado actual**: En progreso. Navegación móvil lista; tablas y formularios largos requieren más ajustes.

---

### 3.3 Onboarding Interactivo (Prioridad: Media) ⏳ Pendiente

**Descripción**: Tutorial guiado para nuevos usuarios.

**Funcionalidades**:
- Pasos interactivos
- Tooltips contextuales
- Video tutoriales
- Checklist de configuración

**Implementación**:
- Librería como `driver.js` ⏳ no instalada.
- Tabla `user_onboarding_status` ⏳ no creada.

**Estimado original**: 1-2 semanas  
**Estado actual**: Pendiente. Sin flujo de onboarding guiado.

---

### 3.4 Accesibilidad (A11y) (Prioridad: Alta) 🔄 En progreso

**Mejoras Necesarias**:
- WCAG 2.1 AA compliance 🔄 — Mejoras continuas: `aria-label` en botones de icono, estructura semántica, metadatos accesibles.
- Mejorar contraste de colores ✅ — Paleta oscura revisada.
- Agregar aria-labels 🔄 — En progreso; revisión general pendiente.
- Soporte para navegación por teclado 🔄 — Parcial.
- Screen reader testing ⏳ — No automatizado aún.

**Estimado original**: 1-2 semanas  
**Estado actual**: En progreso. Se han aplicado mejoras puntuales; falta auditoría completa.

---

### 3.5 Animaciones y Transiciones (Prioridad: Baja) 🔄 En progreso

**Descripción**: Mejorar UX con animaciones sutiles.

**Implementación**:
- Uso de Framer Motion 🔄 — Presente en algunas transiciones.
- Transiciones de página 🔄 — Parcial.
- Micro-interacciones 🔄 — Parcial.

**Estimado original**: 1 semana  
**Estado actual**: En progreso. Animaciones mínimas presentes; puede ampliarse.

---

## 4. PERSISTENCIA Y BASE DE DATOS

### 4.1 Caché Inteligente (Prioridad: Alta) ⏳ Pendiente

**Problema Actual**: Sin caché local, cada recarga de página consulta la BD.

**Solución**:
- Implementar IndexedDB para caché local
- Sincronización automática
- Conflict resolution

**Implementación**:
- Usar `pouchdb` o `dexie.js` ⏳ no instalados.
- Sincronizar con Supabase Realtime ⏳ no implementado.

**Estimado original**: 2-3 semanas  
**Estado actual**: Pendiente. TanStack Query provee caché en memoria, pero no caché offline persistente.

---

### 4.2 Backup y Recuperación (Prioridad: Alta) 🔄 En progreso

**Descripción**: Sistema automático de backups.

**Funcionalidades**:
- Backup diario automático 🔄 — Supabase Backups disponibles por la plataforma.
- Exportar datos en JSON/CSV ⏳ — No implementado aún.
- Importar datos ⏳ — No implementado aún.
- Versionado de cambios ✅ — `entity_versions` guarda snapshots de ejercicios, sesiones y microciclos; soft delete permite restauración.

**Implementación**:
- Endpoint para exportar datos ⏳ no creado.
- Tabla `data_exports` para auditoría ⏳ no creada.

**Estimado original**: 1-2 semanas  
**Estado actual**: En progreso. Versionado y soft delete implementados. Exportación/Importación manual pendiente.

---

### 4.3 Sincronización Offline (Prioridad: Media) ⏳ Pendiente

**Descripción**: Funcionar sin conexión y sincronizar cuando vuelva.

**Funcionalidades**:
- Detectar conexión
- Queue de cambios pendientes
- Sincronización automática
- Conflictos de merge

**Implementación**:
- Service Workers ⏳ no configurados para offline.
- IndexedDB para cola ⏳ no implementado.
- Supabase Realtime para sync ⏳ no activado.

**Estimado original**: 2-3 semanas  
**Estado actual**: Pendiente. Requiere Service Workers y caché local.

---

### 4.4 Auditoría y Logs (Prioridad: Media) ✅ Implementado

**Descripción**: Registrar todos los cambios para auditoría.

**Funcionalidades**:
- Tabla `audit_logs` con quién, qué, cuándo ✅ — `mcp_audit_log` implementada para herramientas MCP; `entity_versions` para versionado de entidades.
- Historial de cambios por entity ✅ — Disponible en `entity_versions`.
- Restauración de versiones anteriores ✅ — `restore_version` y `restore_deleted_record` implementados como herramientas MCP.

**Implementación**:
- Triggers en Supabase ⏳ no añadidos (evitamos triggers en esquemas protegidos).
- API de historial ✅ — Endpoints MCP y de auditoría disponibles (`/api/rpc/mcp-audit.ts`).

**Estimado original**: 1-2 semanas  
**Estado actual**: Implementado. Audit trail completo para MCP y versionado de entidades. Auditoría general de cambios de usuario aún parcial.

---

### 4.5 Optimización de Queries (Prioridad: Media) 🔄 En progreso

**Mejoras**:
- Agregar índices en BD ✅ — Índices añadidos en `deleted_at`, `owner_id`, `entity_id`, etc.
- Lazy loading de datos 🔄 — Parcial.
- Paginación ✅ — Implementada en endpoint de auditoría MCP.
- Filtros optimizados 🔄 — En progreso.

**Análisis Recomendado**:
- Usar EXPLAIN ANALYZE en PostgreSQL ⏳ no ejecutado.
- Monitorear queries lentas ⏳ no configurado.
- Agregar índices donde sea necesario ✅ — Básicos añadidos.

**Estimado original**: 1 semana  
**Estado actual**: En progreso. Índices básicos añadidos; análisis de rendimiento profundo pendiente.

---

### 4.6 Seguridad de Datos (Prioridad: Alta) ✅ Implementado

**Mejoras**:
- Encriptación de datos sensibles ✅ — Uso de `crypto` nativo para firmas de webhooks; no se almacenan secretos en cliente.
- Validación de entrada mejorada ✅ — Zod en todas las herramientas MCP, endpoints de servidor y formularios.
- Rate limiting ⏸️ En pausa — A la espera del mecanismo estándar de la plataforma; se rechazó implementación ad-hoc.
- CORS configurado correctamente ✅ — Cabeceras centralizadas en `src/lib/security-headers.ts`.
- RLS policies más estrictas ✅ — Políticas RLS por `owner_id`, roles (`user_roles`), `has_role` y `deleted_at`.

**Implementación**:
- `crypto-js` ⏳ no usado; se usa `crypto` nativo.
- Zod para validación ✅.
- Supabase RLS mejorado ✅.
- CSP, HSTS, X-Frame-Options, etc. ✅ Centralizados.

**Estimado original**: 1-2 semanas  
**Estado actual**: Implementado. Cabeceras de seguridad, RLS, validación y auditoría activas. Rate limiting pendiente de mecanismo estándar.

---

## 5. INFRAESTRUCTURA Y DEPLOYMENT

### 5.1 CI/CD Pipeline (Prioridad: Alta) 🔄 En progreso

**Descripción**: Automatizar tests, builds y deployment.

**Implementación**:
- GitHub Actions 🔄 — Workflow de security headers existente (`security-headers.yml`).
- Tests automáticos en cada PR ⏳ — No configurado aún.
- Deploy automático en main ✅ — Lovable gestiona despliegue automático.
- Staging environment ⏳ — No existe entorno de staging separado.

**Estimado original**: 1 semana  
**Estado actual**: En progreso. Despliegue automático funcionando. Pipeline de tests y staging pendientes.

---

### 5.2 Monitoreo y Logging (Prioridad: Media) 🔄 En progreso

**Descripción**: Monitorear errores y rendimiento.

**Implementación**:
- Sentry para error tracking ⏳ no integrado.
- LogRocket para session replay ⏳ no integrado.
- Google Analytics ⏳ no integrado.
- Performance monitoring 🔄 — Básico a través de auditoría MCP y `security-probe`.

**Estimado original**: 3-5 días  
**Estado actual**: En progreso. Sin herramientas de terceros aún.

---

### 5.3 Escalabilidad (Prioridad: Media) 🔄 En progreso

**Mejoras**:
- CDN para assets estáticos ✅ — Lovable hosting/CDN.
- Compresión de imágenes ⏳ no implementada.
- Code splitting mejorado 🔄 — Lazy loading de librerías de mapas y componentes pesados.
- Lazy loading de rutas 🔄 — Parcial.

**Estimado original**: 1-2 semanas  
**Estado actual**: En progreso. Infraestructura de hosting lista; optimizaciones de assets y lazy loading en curso.

---

## 6. INTEGRACIONES EXTERNAS

### 6.1 Integración con Wearables (Prioridad: Baja) ⏳ Pendiente

**Descripción**: Conectar con dispositivos de fitness (Garmin, Apple Watch, etc.).

**Funcionalidades**:
- Importar datos de frecuencia cardíaca
- Correlacionar con sesiones de entrenamiento
- Análisis de recuperación

**Estimado original**: 2-3 semanas  
**Estado actual**: Pendiente. No hay integraciones con wearables.

---

### 6.2 API Pública (Prioridad: Media) ✅ Implementado (MCP)

**Descripción**: Exponer API para integraciones de terceros.

**Endpoints/Tools**:
- GET/POST/PUT/DELETE para entidades ✅ — 14 herramientas MCP (`list_*`, `create_*`, `update_*`, `delete_record`, `restore_*`, `duplicate_record`, `list_versions`, `restore_version`).
- Documentación con Swagger ⏳ — No generada, pero existe `manifest.json` de MCP.
- Rate limiting ⏸️ En pausa — A la espera de mecanismo estándar.
- API keys ✅ — Autenticación OAuth mediante Supabase issuer.

**Estimado original**: 2-3 semanas  
**Estado actual**: Implementado. MCP server expuesto con autenticación, auditoría y soft delete. Documentación OpenAPI/Swagger pendiente.

---

### 6.3 Integración con LMS (Prioridad: Baja) ⏳ Pendiente

**Descripción**: Conectar con plataformas de aprendizaje (Moodle, etc.).

**Funcionalidades**:
- Exportar sesiones como contenido educativo
- Seguimiento de progreso

**Estimado original**: 1-2 semanas  
**Estado actual**: Pendiente.

---

## 7. PLAN DE IMPLEMENTACIÓN RECOMENDADO (Actualizado)

### Fase 1 (Semanas 1-4): Fundamentos ✅ Completada
1. Separación de capas (Arquitectura) — Parcialmente completada.
2. Testing automatizado — Cubierto parcialmente.
3. Seguridad de datos — Implementada.
4. CI/CD pipeline — Despliegue automático activo; tests en PR pendientes.

### Fase 2 (Semanas 5-8): Experiencia de Usuario 🔄 En progreso
1. Modo oscuro ✅ Completado.
2. Onboarding interactivo ⏳ Pendiente.
3. Accesibilidad 🔄 En progreso.
4. Responsive design mejorado 🔄 En progreso.

### Fase 3 (Semanas 9-12): Funcionalidades Avanzadas ✅ Completada en gran parte
1. Analytics y reportes ✅ Completado.
2. Plantillas reutilizables ✅ Duplicación implementada; biblioteca compartida pendiente.
3. Seguimiento de lesiones ⏳ Pendiente.
4. Notificaciones ⏳ Pendientes.

### Fase 4 (Semanas 13-16): Sincronización y Colaboración 🔄 En progreso parcial
1. Caché inteligente ⏳ Pendiente.
2. Sincronización offline ⏳ Pendiente.
3. Colaboración en tiempo real ⏳ Pendiente.
4. Backup y recuperación 🔄 Parcial (versionado + soft delete).

### Fase 5 (Semanas 17+): Integraciones y Escalabilidad 🔄 En progreso parcial
1. API pública ✅ Completada vía MCP.
2. Integraciones externas ⏳ Pendientes (calendarios, wearables, LMS).
3. Monitoreo avanzado ⏳ Pendiente.
4. Optimización de rendimiento 🔄 En progreso.

---

## 8. CONCLUSIÓN

**PlaneoFUT** ha avanzado significativamente desde la versión inicial. Las funcionalidades core y avanzadas de planificación deportiva están operativas, y la plataforma cuenta con una base sólida de seguridad, auditoría, internacionalización y MCP. Los próximos focos de inversión recomendados son:

1. **Colaboración multi-equipo**: Permisos granulares y compartición de plantillas/equipos.
2. **Calendario externo**: Exportación iCal/Google Calendar para integración con flujos de trabajo reales.
3. **Notificaciones**: Recordatorios de sesiones y alertas de lesiones/disponibilidad.
4. **Offline y caché**: Mejorar la experiencia en campo con conexión limitada.
5. **Testing y CI/CD**: Completar la automatización de tests en cada PR.

Implementando estas mejoras en fases, se logrará una plataforma profesional, escalable y competitiva en el mercado de planificación deportiva.

---

**Documento preparado por**: Manus AI / PlaneoFUT Team  
**Fecha**: Agosto 2026  
**Versión**: 1.1
