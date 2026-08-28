# PlaneoFUT — Plan maestro de producto, robustez y desvinculación de Lovable

> Documento vivo de continuidad. Se actualiza al cerrar cada fase y es la fuente de verdad para retomar el trabajo sin depender del contexto de una sesión anterior.

## 0. Ficha de control

| Campo | Valor inicial |
|---|---|
| Producto | PlaneoFUT |
| Objetivo | Herramientas profesionales para que un entrenador gestione la planificación y operación deportiva de un equipo de fútbol |
| Cliente inicial | Entrenador profesional individual |
| Unidad técnica | `workspace` personal, preparado para añadir cuerpo técnico y club |
| Runtime objetivo | Cloudflare Workers |
| Datos/Auth/Storage | Proyecto Supabase controlado por el propietario |
| IA | OpenAI desde servidor, nunca desde el navegador |
| Salud clínica | Fuera de alcance inicial |
| Estado | Fases 0–4 núcleo ejecutadas; colaboración, auditoría, RPC transaccionales y PDF reproducible incorporados; cutover remoto pendiente |
| Última revisión | 2026-08-29 |
| Último commit validado | `1abe4fc` — feat: harden PlaneoFUT independence and collaboration |
| Siguiente acción | Confirmar proyecto Supabase propietario, hacer backup, enlazarlo y validar allí el mismo conjunto de migraciones |

### Protocolo de cada sesión

1. Leer esta ficha, `README.md`, el último registro de cambios y `git status`.
2. Confirmar la fase activa y no empezar trabajo de una fase posterior sin cerrar sus puertas.
3. Ejecutar una comprobación pequeña antes de editar: búsqueda de referencias, tests relacionados o migración local.
4. Registrar aquí cada decisión nueva, archivo afectado, migración, prueba y riesgo abierto.
5. Cerrar la sesión con un commit descriptivo, evidencia de validación y una única siguiente acción concreta.
6. Sincronizar el resumen durable con gbrain cuando esté disponible. Si falla, conservar este documento y Git como fuente temporal.

### Registro de sesión

| Fecha | Fase | Cambios | Evidencia | Riesgo/decisión | Commit | Próximo paso |
|---|---|---|---|---|---|---|
| 2026-08-29 | Preparación | Plan maestro creado; inventario de acoplamientos Lovable | Revisión estática del repositorio | Gbrain no inicializa; no ejecutar datos productivos | Pendiente | Fase 0.1 |
| 2026-08-29 | Fases 0–3 | Eliminados runtime/Auth/errores/IA/URLs de Lovable; Cloudflare y OpenAI server-only preparados; lockfile npm regenerado | `npm run verify` verde; 10/10 tests; build cliente+SSR verde; independencia sin referencias fuera del plan | `npm audit` mantiene 4 vulnerabilidades de producción/transitivas; `supabase db lint --local` bloqueado porque no hay Postgres en `127.0.0.1:54322` | Pendiente | Instalar Docker/Supabase local y validar SQL/RLS |
| 2026-08-29 | Implementación inicial | Se sustituyó Bun por npm, se añadió configuración Cloudflare/Wrangler, proveedor OpenAI server-only, logger neutral, gate de independencia y migración de Storage; cliente preparado para rutas y URLs firmadas | `verify:independence`, `typecheck`, `test` (10/10) y `build` verdes; `wrangler deploy --dry-run` correcto | No se ha desplegado remoto ni se han aplicado migraciones; falta validar SQL contra Supabase local/propio | `1abe4fc` | Aplicar migración de Storage y regenerar tipos Supabase |
| 2026-08-29 | Fase 4 núcleo | RPC atómicos para sesión/microciclo/asignación, RLS por equipo con roles, invitaciones, auditoría, Storage privado y PDF reproducible | Supabase local arrancado en puertos aislados; `db reset`, `db lint` y `migration list` correctos; pruebas SQL de RPC, auditoría y aislamiento RLS correctas; `npm audit --omit=dev` sin vulnerabilidades | El esquema local reproduce migraciones; falta enlazar y verificar el proyecto Supabase propietario antes de cualquier despliegue | `1abe4fc` | Backup + link del proyecto propietario y validación de cutover |
| 2026-08-29 | Cierre de pendientes críticos locales | Tipos regenerados tras la migración de colaboración; overrides de `esbuild`; exportación PDF con carga diferida; formulario de invitación por correo | `npm run verify` verde (138 warnings, 0 errores); 6 suites/10 tests; `npm audit --omit=dev` = 0; `supabase db lint --local` = 0 errores; pruebas RLS/RPC/auditoría en PostgreSQL local | No se ha enlazado ningún proyecto remoto por falta de referencia/credenciales propietarias | `1abe4fc` | Recibir `project ref`, verificar titularidad y ejecutar backup + `supabase link` |

## 1. Estado real de la base

### Capacidades existentes

- React 19, TypeScript, Vite, TanStack Start/Router/Query y Tailwind.
- Supabase Auth, Postgres, Storage y migraciones locales.
- Rutas para dashboard, ejercicios, sesiones por bloques, microciclos, pretemporada, temporada, calendario, analytics y equipo.
- Tablas para perfiles, roles, equipos, jugadores, ejercicios, sesiones, bloques, microciclos, mesociclos, eventos y evaluaciones.
- Asistente de microciclos mediante una función servidor.
- Pruebas de renderizado/mocks para calendario, microciclos, temporada, pretemporada y tres escrituras simples.

### Deuda confirmada tras la primera implementación

- La desvinculación mecánica de Lovable está completada: no quedan dependencias, imports, URLs ni variables ejecutables; el histórico se conserva únicamente en este documento.
- `supabase/config.toml` usa ahora el identificador local `planeofut` y puertos aislados (`55433` DB, `55435` Studio); no queda referencia al proyecto anterior.
- `src/integrations/supabase/types.ts` está regenerado desde el esquema local reproducido; falta una segunda regeneración contra el proyecto Supabase propietario cuando se confirme su referencia.
- Las migraciones `20260828221613_harden_storage_access.sql` y `20260828230352_collaboration_atomic_audit.sql` se aplican y validan localmente; el cutover remoto queda protegido por backup y revisión de diferencias.
- `src/lib/storage.ts` centraliza validación de imágenes (tipo/tamaño), compatibilidad con URLs públicas heredadas y generación de URLs firmadas de corta duración para ejercicios, escudos y fotos.
- Las secuencias de sesiones, microciclos y asignaciones ya usan RPC transaccionales; queda añadir idempotency keys para reintentos de red.
- La exportación de sesiones y microciclos usa PDF reproducible con `pdf-lib`; quedan plantillas visuales, imágenes embebidas y versionado de documento.
- `npm audit --omit=dev` queda en 0 vulnerabilidades después de fijar `esbuild` mediante `overrides` y actualizar transitivas.
- La validación SQL local está operativa con Docker; el único bloqueo es la falta de credenciales/referencia del proyecto Supabase propietario.

## 2. Fase 0 — línea base y corte seguro

### 2.1 Protección y evidencia

- Crear rama de migración y etiquetar el último estado dependiente de Lovable.
- El directorio `.lovable` ya fue retirado del árbol de trabajo; su contenido sigue recuperable mediante el diff/histórico Git si fuera necesario auditar la migración.
- Auditar histórico y configuración en busca de secretos. Rotar cualquier clave comprometida; no imprimir valores en commits, logs ni documentación.
- Exportar esquema, datos necesarios, usuarios autorizados y objetos de Storage antes de cambiar el proyecto Supabase.
- Verificar la titularidad del proyecto Supabase actual. Si está ligado a una cuenta de terceros, crear un proyecto propio y preparar un corte con exportación, migraciones, copia de datos, validación y cambio de URLs.

### 2.2 Línea base reproducible

- Instalar desde lockfile sin actualizaciones implícitas.
- Registrar versiones de Node, Bun, npm, paquetes, Supabase CLI y Wrangler.
- Ejecutar `test`, `lint`, `build` y `tsc --noEmit`; guardar la salida resumida aquí.
- Mantener `npm run verify` como comando único; incluye independencia, tipos, lint, tests y build.

**Puerta de salida:** existe una copia recuperable, el esquema local reproduce todas las migraciones y se conoce exactamente qué falla antes de la migración.

## 3. Fase 1 — desvinculación total de Lovable

### 3.1 Compilación y runtime

- Retirar `@lovable.dev/vite-tanstack-config` y reemplazarlo por configuración explícita de Vite con TanStack Start, React, Tailwind, alias TypeScript y plugin Cloudflare.
- Añadir `@cloudflare/vite-plugin`, Wrangler y `wrangler.jsonc`; generar `worker-configuration.d.ts`.
- Sustituir el entrypoint generado por un entrypoint TanStack Start/Workers mantenible, conservando la normalización de errores SSR sin referencias Lovable.
- Revisar si Nitro sigue siendo necesario; eliminarlo si el build oficial de Workers cubre el objetivo y actualizar lockfiles.
- Mantener únicamente scripts portables: `dev`, `test`, `lint`, `build`, `preview`, `cf-typegen`, `deploy` y `verify`.

### 3.2 Auth y navegación

- Eliminar `src/integrations/lovable/index.ts`.
- Usar directamente `supabase.auth.signInWithOAuth`, `getSession`, `onAuthStateChange` y `signOut`.
- Configurar proveedores OAuth en el Supabase propio con callbacks para local, staging y dominio de producción.
- Mantener una sola suscripción de Auth y limpiar Query Router al cambiar de usuario.
- Sustituir URLs canónicas, Open Graph y sitemap por configuración de dominio propia.
- Añadir pruebas de sesión expirada, callback inválido, logout y aislamiento tras cambio de usuario.

### 3.3 Errores y observabilidad

- Eliminar `lovable-error-reporting.ts` y el tipo `__lovableEvents`.
- Crear un contrato neutral de observabilidad para errores de cliente/servidor.
- Emitir logs JSON con request id, usuario anonimizado, ruta, operación y duración; nunca tokens, claves ni datos clínicos.
- En Cloudflare usar logs/monitorización del Worker; añadir un endpoint interno limitado solo si se necesita capturar errores cliente.
- Mantener páginas de error 404/500 útiles y no filtrar detalles internos.

### 3.4 Criterio mecánico de desvinculación

La búsqueda `rg -i "lovable|lovable\.dev|lovable\.app|LOVABLE"` no debe encontrar dependencias, imports, URLs, variables, cabeceras, nombres de funciones ni mensajes ejecutables. Las únicas menciones permitidas serán históricas dentro de este documento si resultan necesarias para explicar la migración.

## 4. Fase 2 — Cloudflare Workers independiente

- Configurar `wrangler.jsonc` con nombre del Worker, fecha de compatibilidad y `nodejs_compat` según el runtime elegido.
- Crear entornos `development`, `staging` y `production` con bindings separados.
- Guardar `OPENAI_API_KEY` y secretos servidor mediante Wrangler/Cloudflare, nunca en `VITE_*` ni en Git.
- Leer bindings en cada petición; no asumir que `process.env` existe en scope de módulo en Workers.
- Añadir despliegue de staging, smoke test HTTP, promoción manual y rollback al último artefacto válido.
- Registrar dominio, callback OAuth, políticas CORS, cabeceras de seguridad, compresión y límites de payload.

**Puerta de salida:** `wrangler deploy` produce un Worker independiente, la aplicación funciona sin Lovable y staging puede revertirse sin tocar producción.

## 5. Fase 3 — IA OpenAI server-only

- Crear `AiPlanningProvider` como interfaz propia.
- Implementarlo con SDK oficial de OpenAI y Responses API; validar el resultado con Zod y devolver solo el contrato `MicrocycleSuggestion`.
- Eliminar `createLovableAiGatewayProvider`, `LOVABLE_API_KEY`, cabeceras `X-Lovable-AIG-Run-ID` y endpoint Lovable.
- Guardar modelo, límites y prompt versionado en configuración servidor.
- Registrar uso por workspace, latencia, errores y coste estimado sin guardar secretos ni contexto innecesario.
- Añadir cuota diaria, idempotency key, timeout, reintento limitado y respuesta degradada manual.
- La IA siempre genera borradores; publicar, modificar o asignar sesiones requiere confirmación humana.

## 6. Fase 4 — datos, seguridad y contratos

### Modelo de datos

- Crear `workspaces` y `workspace_members`; migrar el propietario actual como workspace personal.
- Añadir `workspace_id` a equipos, jugadores, staff, ejercicios, sesiones, planes, eventos y métricas.
- Mantener `owner_id` durante la transición y eliminarlo solo después de verificar todos los consumidores.
- Normalizar jugadores, staff, posiciones, disponibilidad, asistencia, convocatorias y partidos.
- Versionar plantillas y sesiones; al publicar, guardar snapshot inmutable.
- Mantener salud, lesiones y bienestar clínico fuera del esquema inicial.

### Supabase

- Regenerar `src/integrations/supabase/types.ts` tras cada migración.
- Crear repositorios y servicios tipados; prohibir `as any` nuevo y reducirlo progresivamente hasta cero en dominio.
- RLS actual: `team_members` y `team_invitations` con roles `coach`, `physical_coach`, `analyst` y `viewer`; las tablas deportivas admiten acceso por propietario o equipo y bloquean reasignación de `owner_id`.
- Añadir pruebas RLS positivas y negativas con dos usuarios y dos workspaces; ya existe verificación local de lectura de colaborador y bloqueo de escritura de `viewer`.
- Usar funciones `SECURITY INVOKER` salvo necesidad documentada; no usar `user_metadata` para autorización.
- Convertir buckets a privados, rutas por workspace, URLs firmadas, validación de MIME/tamaño y borrado coordinado.
- RPC actuales: `save_session_graph`, `create_microcycle_with_slots`, `assign_microcycle_session`, invitaciones por email y `audit_row_changes`; todos los cambios multi-tabla deben seguir este patrón.
- `audit_log` es append-only para clientes: solo triggers internos escriben y los usuarios leen únicamente sus propios cambios o los de equipos accesibles.
- Añadir auditoría, archivado lógico, exportación JSON/CSV y procedimiento de restauración.

## 7. Fase 5 — funcionalidad deportiva profesional

- Consolidar temporada → mesociclo → microciclo → sesión → bloque → ejercicio.
- Añadir plantillas reutilizables, favoritos, revisiones y comparación entre versiones.
- Completar plantilla: posición normalizada, dorsal, rol, estado deportivo y disponibilidad operativa no clínica.
- Añadir staff como fichas operativas sin acceso en v1.
- Añadir asistencia, convocatorias, alineación, sustituciones, resultado, observaciones y calendario competitivo.
- Añadir métricas configurables por sesión, jugador y partido; evitar conclusiones médicas o promesas de rendimiento.
- Sustituir `window.print()` por exportación reproducible PDF/JSON con versión de plantilla.
- Mejorar dashboard, filtros, búsqueda, estados de error/vacío, móvil y accesibilidad WCAG AA.

## 8. Resiliencia, escalado y operación

- Primero cachear lectura; después añadir edición offline con cola, idempotencia y resolución de conflictos probada.
- Paginar listas, indexar consultas medidas y evitar cargar catálogos completos en cada ruta.
- Procesar imágenes, PDFs y analítica pesada de forma asíncrona cuando el volumen lo requiera.
- Añadir límites por usuario/workspace, protección anti-abuso y alarmas de latencia/error.
- Escalar progresivamente: entrenador → cuerpo técnico → club multi-equipo → academia → integraciones GPS/vídeo/scouting/API.
- Mantener conectores aislados y contratos versionados para futuras integraciones.

## 9. Matriz mínima de pruebas y aceptación

### Seguridad

- Usuario A no puede leer, modificar, borrar ni descargar datos/archivos de usuario B.
- Un UPDATE no puede cambiar `workspace_id` ni propietario.
- Bucket privado rechaza rutas ajenas y URL firmada caducada.
- Claves OpenAI/Supabase no aparecen en bundle, logs ni respuestas.

### Persistencia

- Crear, editar, duplicar, publicar y borrar una sesión deja cero registros huérfanos.
- Repetir la misma operación con igual idempotency key no duplica datos.
- Fallos intermedios revierten la operación completa.
- Backup exportado se puede importar en un entorno limpio y conserva relaciones.

### Producto

- Flujo completo jugador → sesión → microciclo → convocatoria → partido → métricas → dashboard.
- Cambiar de cuenta invalida cachés y no muestra datos de la cuenta anterior.
- Exportaciones contienen todos los bloques, imágenes autorizadas y versión de documento.
- IA devuelve solo esquemas válidos, respeta catálogo y requiere confirmación humana.

### Entrega

- CI verde para tipos, lint, unitarias, integración, E2E, build y migraciones.
- Staging verificable con smoke tests y rollback documentado.
- `rg` sin acoplamientos Lovable.
- README actualizado para ejecutar sin Lovable, con Supabase y Cloudflare propios.

## 10. Registro de decisiones y no hacer

### Decisiones fijadas

- Cloudflare Workers + Supabase.
- OpenAI server-only.
- Entrenador individual inicialmente, con workspace extensible.
- Salud clínica aplazada.
- Ninguna acción irreversible sobre producción sin backup, plan de corte y verificación.

### No hacer

- No conservar OAuth, hosting, gateway, telemetría ni claves Lovable.
- No exponer `service_role` ni `OPENAI_API_KEY` al cliente.
- No habilitar colaboración multiusuario antes de RLS, auditoría y permisos probados.
- No introducir datos médicos por conveniencia de diseño.
- No desplegar producción con tipos generados desactualizados, `as any` en operaciones críticas o tests fallidos.
