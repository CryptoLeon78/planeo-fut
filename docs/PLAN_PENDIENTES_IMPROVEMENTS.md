# Plan priorizado de pendientes de PlaneoFUT

**Fecha:** 4 de septiembre de 2026  
**Referencia:** `IMPROVEMENTS.md`, estado del repositorio en `main` (`9b9d425`)

## 1. Diagnóstico ejecutivo

El proyecto ya dispone de una base funcional sólida: servicios separados por dominio, caché IndexedDB, backup y recuperación, RLS, colaboración multi-equipo, Supabase Realtime, seguimiento de lesiones, exportación iCalendar, preferencias de notificaciones, onboarding, CI y una especificación OpenAPI inicial.

Los pendientes de `IMPROVEMENTS.md` no tienen todos el mismo grado de realidad. Algunos son funcionalidades locales que pueden implementarse sin proveedores externos; otros requieren credenciales, decisiones de producto o servicios de terceros. La recomendación es no intentar cerrar todas las marcas de pendiente artificialmente: primero hay que completar los flujos locales y después habilitar las integraciones externas con una configuración segura.

## 2. Pendientes reales, ordenados por prioridad

| Prioridad | Área | Estado real | Acción recomendada | Dependencias |
|---|---|---|---|---|
| P0 | Migraciones Supabase | Código preparado, despliegue remoto pendiente | Aplicar y verificar las migraciones de lesiones y preferencias de notificaciones | Acceso al proyecto Supabase |
| P1 | Biblioteca de plantillas | Duplicación disponible, categorías y catálogo pendientes | Crear categorías, filtros, plantillas propias y biblioteca inicial curada | Decisión de categorías y contenido inicial |
| P1 | Notificaciones | Preferencias y permiso web disponibles, entrega pendiente | Implementar recordatorios locales y después push/email | Service Worker; proveedor email si se desea correo |
| P1 | Calidad | Tests existentes, cobertura cuantitativa parcial | Añadir cobertura V8, umbral progresivo y pruebas de flujos críticos | Estabilizar proveedor de cobertura |
| P2 | Auditoría general | Auditoría MCP y versiones disponibles, cambios de usuario parciales | Generalizar `audit_log` mediante funciones/triggers seguros | Validación de RLS y esquema final |
| P2 | Calendario externo | Exportación `.ics` disponible | Añadir importación `.ics`; dejar OAuth bidireccional como integración opcional | Definir modelo de eventos y zona horaria |
| P2 | Documentación UI | Sin Storybook | Añadir catálogo de componentes y stories de estados críticos | Decidir si se incorpora Storybook al build |
| P2 | Offline | Implementación de caché y reconexión existente, documentación obsoleta | Añadir cola de mutaciones offline y reconciliación visible | Definir operaciones soportadas offline |
| P3 | API | OpenAPI inicial y MCP funcional | Alinear OpenAPI con el manifiesto real y generar documentación publicable | Estabilizar endpoint público |
| P3 | Integraciones | Wearables y LMS sin implementar | Diseñar adaptadores y contratos, sin conectar proveedores todavía | Elección de Garmin/Apple/Moodle y credenciales |
| P3 | Rate limiting | En pausa | Adoptar el mecanismo estándar de la plataforma cuando esté disponible | Capacidad de plataforma |

## 3. Plan de ejecución recomendado

### Etapa 0 — Preparación y datos

Antes de desarrollar nuevas pantallas, aplicar en el proyecto Supabase las migraciones `20260903220000_player_injuries.sql` y `20260904181500_notification_preferences.sql`. Verificar que las tablas, índices, triggers y políticas RLS funcionan con un usuario propietario, un colaborador y un usuario sin acceso.

También conviene actualizar los tipos generados de Supabase después de aplicar las migraciones. El código actual usa casts puntuales a `any` para las tablas nuevas; esos casts deben sustituirse por tipos generados en una pasada posterior de calidad.

**Criterios de aceptación:** las migraciones se aplican sin errores; un propietario puede crear y resolver una lesión; un colaborador puede consultar según su rol; un usuario externo no puede leer ni modificar lesiones o preferencias ajenas.

### Etapa 1 — Biblioteca de plantillas

Crear `template_categories` con categorías iniciales como calentamiento, posesión, finalización, transición, ABP y recuperación. Añadir una relación de categoría a las sesiones marcadas como plantilla y, si procede, a los microciclos. Crear un servicio de plantillas que exponga listado, filtrado, duplicación y publicación compartida.

En la interfaz de sesiones, separar “Mis plantillas” de “Biblioteca del equipo” y mostrar filtros por categoría, duración, intensidad y edad. Mantener la duplicación como operación segura: nunca modificar la plantilla original y validar que el usuario tiene permiso de lectura y creación en el equipo destino.

**Criterios de aceptación:** se puede marcar una sesión como plantilla, asignarla a una categoría, filtrarla, duplicarla y compartirla con un colaborador autorizado. Un visor no puede editar ni publicar plantillas.

### Etapa 2 — Notificaciones útiles sin proveedor externo

Implementar primero recordatorios en navegador con Service Worker y Notification API. La aplicación debe registrar sesiones próximas, respetar `notification_preferences`, evitar duplicados y funcionar con la zona horaria del usuario. Para lesiones, mostrar alertas dentro de la aplicación cuando exista una lesión activa o se aproxime la fecha prevista de regreso.

Después, añadir un adaptador de correo desacoplado con una interfaz como `NotificationProvider`. El proveedor debe configurarse mediante secretos del entorno; nunca se deben guardar claves en el cliente ni incluir proveedores ficticios en el código. SMS queda explícitamente detrás de una decisión de producto y presupuesto.

**Criterios de aceptación:** el usuario puede activar o desactivar cada tipo de aviso; una sesión próxima genera como máximo un aviso por ventana; no se envía ningún correo si no hay proveedor configurado; el fallo del proveedor no bloquea la planificación.

### Etapa 3 — Cobertura y pruebas de flujos críticos

Añadir el proveedor de cobertura compatible con Vitest cuando npm esté estable, publicar el resumen en CI y establecer un umbral progresivo: 50% inicial sobre servicios, 60% en la siguiente iteración y 70% como objetivo. Priorizar servicios de plantillas, lesiones, notificaciones, calendario y operaciones de backup.

Añadir pruebas de integración para crear/editar una sesión, duplicar una sesión, registrar/resolver lesión, exportar `.ics` e importar datos de backup. Mantener las pruebas E2E de autenticación, navegación, CSP e internacionalización.

**Criterios de aceptación:** CI falla si los tests fallan, pero las advertencias de lint no bloquean; el umbral de cobertura está documentado y sube sin reducirse; cada operación crítica tiene al menos un caso correcto y uno de error/permisos.

### Etapa 4 — Auditoría y sincronización offline

Generalizar el registro de cambios de usuario mediante funciones de escritura o triggers cuidadosamente limitados a tablas de negocio. Registrar actor, equipo, operación, entidad, registro, datos anterior/nuevo y timestamp, con acceso restringido a propietarios y roles autorizados.

Para offline, no empezar por “offline total”. Crear una cola IndexedDB de mutaciones explícitas: crear ejercicio, crear sesión, actualizar favorito y registrar lesión. Cada operación debe tener idempotency key, estado (`pending`, `syncing`, `synced`, `failed`) y mensaje de error. Al recuperar conexión, sincronizar en orden y resolver conflictos con versión/timestamp, mostrando al usuario los conflictos no resolubles.

**Criterios de aceptación:** una mutación permitida sin conexión queda visible como pendiente, se sincroniza una sola vez al recuperar red y sobrevive a una recarga. Los conflictos no se sobrescriben silenciosamente.

### Etapa 5 — Calendario externo y documentación

Completar primero la importación de archivos `.ics` con validación de fechas, UID y zona horaria. La sincronización OAuth con Google Calendar y Outlook debe diseñarse como conectores opcionales, con tokens almacenados exclusivamente en el backend y posibilidad de revocar la conexión.

Alinear `docs/openapi.yaml` con el manifiesto MCP real. Incluir ejemplos de autenticación, errores, paginación, permisos y versionado. Añadir una comprobación CI que detecte divergencias entre la especificación y el manifiesto si ambos están disponibles durante el build.

**Criterios de aceptación:** la importación no duplica eventos con el mismo UID; los eventos mantienen zona horaria; OAuth puede revocarse; OpenAPI no documenta operaciones inexistentes.

### Etapa 6 — Storybook y componentes

Incorporar Storybook únicamente después de estabilizar los componentes reutilizados. Crear stories para Button, Input, Select, Dialog, Card, Badge, Sidebar, formularios de ejercicio, evaluación de sesión y panel de lesiones. Añadir estados de loading, error, vacío, oscuro, móvil y accesibilidad.

**Criterios de aceptación:** el catálogo se inicia con un comando documentado, las stories no requieren Supabase real y los estados críticos se pueden revisar visualmente.

### Etapa 7 — Wearables y LMS

No implementar integraciones concretas hasta decidir proveedor y caso de uso. Preparar interfaces internas: `WearableActivityImporter` para frecuencia cardíaca/carga y `LmsSessionExporter` para exportar una sesión como contenido educativo. Crear fixtures y adaptadores de prueba antes de conectar APIs reales.

**Criterios de aceptación:** cada adaptador tiene contrato versionado, validación de payload, manejo de reintentos y separación total de credenciales. La primera integración real debe ser una prueba piloto con un proveedor elegido.

## 4. Decisiones que requieren confirmación del producto

1. **Categorías de plantillas:** confirmar si se desea una biblioteca solo privada, por equipo o también pública/curada.
2. **Notificaciones:** confirmar si el primer canal debe ser navegador, email o ambos.
3. **Calendario:** confirmar Google Calendar, Outlook o únicamente intercambio `.ics`.
4. **Wearables:** elegir Garmin, Apple Health/Watch, Polar u otro proveedor.
5. **LMS:** elegir Moodle u otra plataforma y definir el formato de exportación.
6. **Storybook:** confirmar si se quiere añadir una dependencia y un catálogo de mantenimiento permanente.

## 5. Resultado esperado por orden

El orden recomendado es: **aplicar migraciones → biblioteca de plantillas → recordatorios web → cobertura y flujos críticos → auditoría/offline → importación y OAuth de calendario → OpenAPI alineada → Storybook → adaptadores de wearables/LMS**.

Este orden maximiza valor visible para el entrenador, reduce riesgos de datos y evita bloquear el producto en credenciales o proveedores externos antes de que los flujos internos estén estabilizados.
