import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import OpenAI from "openai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { OSO_EXERCISES } from "@/data/oso-exercises";

const InputSchema = z.object({
  weekStart: z.string().min(8).max(10),
  matchDay: z.enum(["sabado", "domingo"]),
  mesocycleId: z.string().uuid().nullable().optional(),
  context: z.string().max(2000).nullable().optional(),
});

const SuggestionSchema = z.object({
  weekly_objective: z.string(),
  slots: z.array(z.object({
    slot_type: z.enum(["MD-4", "MD-3", "MD-2", "MD-1", "MD"]),
    focus: z.string(),
    intensity: z.string(),
    recommended_exercise_ids: z.array(z.string()),
    notes: z.string(),
  })).length(5),
});

export type MicrocycleSuggestion = z.infer<typeof SuggestionSchema>;

export const suggestMicrocycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OPENAI_API_KEY");

    const { supabase } = context;
    const { weekStart, matchDay, mesocycleId, context: extra } = data;

    let mesocycle: any = null;
    if (mesocycleId) {
      const { data: m } = await supabase.from("mesocycles").select("name,type,goals,phases").eq("id", mesocycleId).maybeSingle();
      mesocycle = m;
    } else {
      const { data: m } = await supabase.from("mesocycles").select("name,type,goals,phases")
        .lte("start_date", weekStart).gte("end_date", weekStart).limit(1);
      mesocycle = m?.[0] ?? null;
    }

    const { data: dbExercises } = await supabase
      .from("exercises")
      .select("id,name,objective,game_phase,intensity,task_type,duration_min")
      .order("created_at", { ascending: false })
      .limit(60);

    const allExercises = [
      ...(dbExercises ?? []),
      ...OSO_EXERCISES.map((o) => ({
        id: o.id,
        name: o.name,
        objective: `${o.objectiveAttack} / ${o.objectiveDefense}`,
        game_phase: o.gamePhase,
        intensity: o.intensity,
        task_type: o.category,
        duration_min: o.durationMinutes,
      })),
    ];

    const catalog = allExercises.map((e: any) =>
      `- ${e.id} | ${e.name} | obj: ${e.objective ?? "-"} | fase: ${e.game_phase ?? "-"} | int: ${e.intensity ?? "-"} | tipo: ${e.task_type ?? "-"} | ${e.duration_min ?? "-"}min`
    ).join("\n");

    const system = `Eres un asistente experto en planificación de microciclos de fútbol basado en la metodología OSO (Olympic Desde el Oso-CF) y estructuración MD-4 a MD.
Principios pedagógico-tácticos OSO:
- ODILO: Organización clara, Decisión autónoma del jugador, Incertidumbre real, Libertad de solución, Oposición activa.
- Fases de estación: Primavera (explorar), Verano (experimentar), Otoño (comprender), Invierno (integrar).
- Reglas de Provocación (hacer visible una ventaja sin imponer respuesta rígida) y Continuidad (reanudación rápida tras interrupciones).
- Criterios de carga: MD-4 (recuperación/activación), MD-3 (fuerza y duelos), MD-2 (táctico colectivo), MD-1 (activación/ABP), MD (día de partido).
Selecciona ejercicios SOLO del catálogo usando sus IDs exactos. 2-4 ejercicios por slot (excepto MD).`;

    const prompt = `Diseña un microciclo para la semana del ${weekStart} con partido en ${matchDay}.
${mesocycle ? `Mesociclo: ${mesocycle.name} (${mesocycle.type}). Objetivos: ${mesocycle.goals ?? "-"}.` : "Sin mesociclo asociado."}
${extra ? `Contexto extra: ${extra}` : ""}

Catálogo de ejercicios disponibles:
${catalog || "(catálogo vacío)"}`;

    const client = new OpenAI({ apiKey: key });
    const response = await client.responses.create({
      model: process.env.OPENAI_PLANNING_MODEL || "gpt-5-mini",
      instructions: system,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "microcycle_suggestion",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["weekly_objective", "slots"],
            properties: {
              weekly_objective: { type: "string" },
              slots: {
                type: "array",
                minItems: 5,
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["slot_type", "focus", "intensity", "recommended_exercise_ids", "notes"],
                  properties: {
                    slot_type: { type: "string", enum: ["MD-4", "MD-3", "MD-2", "MD-1", "MD"] },
                    focus: { type: "string" },
                    intensity: { type: "string" },
                    recommended_exercise_ids: { type: "array", items: { type: "string" } },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!response.output_text) throw new Error("OpenAI returned an empty planning response");
    return SuggestionSchema.parse(JSON.parse(response.output_text)) as MicrocycleSuggestion;
  });
