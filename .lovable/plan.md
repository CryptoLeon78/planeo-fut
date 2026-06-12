Voy a entregar las 4 funcionalidades en una sola iteración, agrupadas por área para mantener el código modular.

## 1. Smoke tests (rutas críticas)

Añadir `vitest` + `@testing-library/react` con un mock ligero de `@/integrations/supabase/client` (mock chainable `from().select().eq()...`).

Tests en `src/__tests__/smoke/`:
- `microcycles.test.tsx` — render `microcycles.index` y `microcycles.$id` con datos mockeados; verifica que aparecen los 5 slots MD-4…MD.
- `preseason.test.tsx` — render `preseason.index` y detalle; lista fases.
- `season.test.tsx` — render `season.$id` con eventos mockeados; verifica grouping por mes.
- `calendar.test.tsx` — render `calendar` con semana actual.
- `save.test.tsx` — simula `updateSlot` / `addEvent` y verifica que la mutación se dispara sin throw.

Los tests no atacan Supabase real: validan que los componentes renderizan y que los handlers de guardado se ejecutan sin errores críticos. Comando: `bunx vitest run`.

## 2. Evaluación post-sesión

**Migración DB**: nueva tabla `session_evaluations`:
- `session_id` (FK), `owner_id`, `rating` (1-5), `intensity_perceived` (enum bajo/medio/alto), `objectives_met` (bool), `what_worked` (text), `what_to_improve` (text), `player_notes` (text), `evaluated_at`.
- RLS por `owner_id`, GRANT a `authenticated` y `service_role`, trigger `updated_at`.

**UI**: en `sessions.$id.tsx` añadir tarjeta "Evaluación post-sesión" con formulario (estrellas 1-5, selects, textareas). Auto-save al blur. Si ya existe evaluación, la carga y permite editar.

## 3. Drag & Drop en microciclo

Instalar `@dnd-kit/core` (ya usado para reorder de bloques de sesión, reutilizamos).

En `microcycles.$id.tsx`:
- Panel lateral derecho con sesiones disponibles (draggables).
- Cada slot MD-X es droppable.
- Al soltar: `updateSlot(slotId, { session_id })`.
- **Detección de conflictos**: si la sesión ya está asignada a otro slot del mismo microciclo, se mueve (limpia el slot anterior) y muestra un toast informativo "Sesión movida de MD-3 a MD-2".
- Mantener el Select como alternativa accesible.

## 4. Asistente IA generador de microciclo

**Backend** — nuevo server route `src/routes/api/microcycle-suggest.ts` (POST):
- Requiere auth (`requireSupabaseAuth`).
- Input: `{ weekStart, matchDay, mesocycleId? }`.
- Carga: objetivos del mesociclo (pretemporada/temporada activa), últimos 50 ejercicios del coach, microciclos recientes (para variedad).
- Llama a Lovable AI Gateway (`google/gemini-3-flash-preview`) con `generateText` + `Output.object` (schema Zod):
  ```
  { slots: [{ slot_type: "MD-4"|...|"MD", focus: string, intensity: string,
              recommended_exercise_ids: string[], notes: string }] }
  ```
- Devuelve la propuesta (no escribe en DB; el usuario revisa y aplica).

**UI** en `microcycles.new.tsx` (y/o detalle):
- Botón "✨ Generar con IA" + textarea opcional "Contexto adicional".
- Modal con propuesta editable por slot; botón "Aplicar al microciclo" inserta los slots con `session_id` mapeada (o crea la sesión vacía si solo hay ejercicios) y guarda `notes`/`focus`.
- Maneja errores 429/402 con toast claro.

## Notas técnicas

- Wire `attachSupabaseAuth` ya está en `start.ts` (Fase 1). Verifico antes de añadir el server route.
- Helper Lovable AI Gateway: crearé `src/lib/ai-gateway.server.ts` con el patrón canónico (`X-Lovable-AIG-SDK`, run-id forwarding).
- Tests usan `jsdom` y un `setupTests.ts` que mockea `supabase` con un proxy chainable.
- No toco la UI visual del tema deportivo oscuro; reutilizo `Card`, `Badge`, `Dialog` existentes.

## Orden de ejecución

1. Migración `session_evaluations` (requiere aprobación).
2. Mientras se aprueba: instalar deps (vitest, @dnd-kit/core, ai, @ai-sdk/openai-compatible), añadir helper AI Gateway, smoke tests, DnD.
3. Tras la migración: formulario evaluación + tipos regenerados.
4. Server route + UI del asistente IA.

¿Apruebas?