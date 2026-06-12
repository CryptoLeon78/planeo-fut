import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  weekStart: z.string().min(8).max(10),
  matchDay: z.enum(["sabado", "domingo"]),
  mesocycleId: z.string().uuid().optional().nullable(),
  context: z.string().max(2000).optional().nullable(),
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

export const Route = createFileRoute("/api/microcycle-suggest")({
  server: {
    middleware: [requireSupabaseAuth],
    handlers: {
      POST: async ({ request, context }) => {
        const body = await request.json();
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500 });

        const { supabase } = context;
        const { weekStart, matchDay, mesocycleId, context: extra } = parsed.data;

        let mesocycle: any = null;
        if (mesocycleId) {
          const { data } = await supabase.from("mesocycles").select("name,type,goals,phases,start_date,end_date").eq("id", mesocycleId).maybeSingle();
          mesocycle = data;
        } else {
          const { data } = await supabase.from("mesocycles").select("name,type,goals,phases")
            .lte("start_date", weekStart).gte("end_date", weekStart).limit(1);
          mesocycle = data?.[0] ?? null;
        }

        const { data: exercises } = await supabase
          .from("exercises")
          .select("id,name,objective,game_phase,intensity,task_type,duration_min,tags")
          .order("created_at", { ascending: false })
          .limit(60);

        const exerciseCatalog = (exercises ?? []).map((e: any) =>
          `- ${e.id} | ${e.name} | objetivo: ${e.objective ?? "-"} | fase: ${e.game_phase ?? "-"} | intensidad: ${e.intensity ?? "-"} | tipo: ${e.task_type ?? "-"} | dur: ${e.duration_min ?? "-"}min`
        ).join("\n");

        const systemPrompt = `Eres un asistente experto en planificación de microciclos de fútbol siguiendo el modelo de cargas MD-4, MD-3, MD-2, MD-1 y MD (día de partido).
Reglas:
- MD-4: baja carga, recuperación/activación tras partido.
- MD-3: alta carga, fuerza y duelos (lejos del partido).
- MD-2: carga media, táctica colectiva y resistencia específica.
- MD-1: carga baja, activación pre-partido, ABP.
- MD: día de partido (no se asignan ejercicios).
Selecciona ejercicios SOLO del catálogo proporcionado usando sus IDs exactos. Recomienda 2-4 ejercicios por slot (excepto MD que va vacío).`;

        const userPrompt = `Diseña un microciclo para la semana del ${weekStart} con partido en ${matchDay}.
${mesocycle ? `Mesociclo: ${mesocycle.name} (${mesocycle.type}). Objetivos: ${mesocycle.goals ?? "-"}.` : "Sin mesociclo asociado."}
${extra ? `Contexto adicional del entrenador: ${extra}` : ""}

Catálogo de ejercicios disponibles:
${exerciseCatalog || "(catálogo vacío — devuelve recommended_exercise_ids vacíos)"}`;

        const gateway = createLovableAiGatewayProvider(key);
        try {
          const { experimental_output } = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            system: systemPrompt,
            prompt: userPrompt,
            experimental_output: Output.object({ schema: SuggestionSchema }),
          });
          return Response.json(experimental_output);
        } catch (e: any) {
          const msg = String(e?.message ?? e);
          const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
          return new Response(JSON.stringify({ error: msg }), { status });
        }
      },
    },
  },
});
