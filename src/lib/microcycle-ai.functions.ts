import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

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

    const { data: exercises } = await supabase
      .from("exercises")
      .select("id,name,objective,game_phase,intensity,task_type,duration_min")
      .order("created_at", { ascending: false })
      .limit(60);

    const catalog = (exercises ?? []).map((e: any) =>
      `- ${e.id} | ${e.name} | obj: ${e.objective ?? "-"} | fase: ${e.game_phase ?? "-"} | int: ${e.intensity ?? "-"} | tipo: ${e.task_type ?? "-"} | ${e.duration_min ?? "-"}min`
    ).join("\n");

    const system = `Eres un asistente experto en planificación de microciclos de fútbol (modelo MD-4, MD-3, MD-2, MD-1, MD).
Reglas de carga:
- MD-4: baja, recuperación/activación.
- MD-3: alta, fuerza y duelos.
- MD-2: media, táctico colectivo y resistencia.
- MD-1: baja, activación pre-partido y ABP.
- MD: día de partido (recommended_exercise_ids vacío).
Selecciona ejercicios SOLO del catálogo usando sus IDs exactos. 2-4 ejercicios por slot (excepto MD).`;

    const prompt = `Diseña un microciclo para la semana del ${weekStart} con partido en ${matchDay}.
${mesocycle ? `Mesociclo: ${mesocycle.name} (${mesocycle.type}). Objetivos: ${mesocycle.goals ?? "-"}.` : "Sin mesociclo asociado."}
${extra ? `Contexto extra: ${extra}` : ""}

Catálogo de ejercicios disponibles:
${catalog || "(catálogo vacío)"}`;

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
      experimental_output: Output.object({ schema: SuggestionSchema }),
    });
    return experimental_output as MicrocycleSuggestion;
  });
