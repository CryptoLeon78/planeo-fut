import { OSO_EXERCISES } from "../src/data/oso-exercises";
import { OSO_TEMPLATES } from "../src/data/oso-templates";

/**
 * Seed script to prepare and export OSO methodology data into Supabase/Database migrations.
 */
export function generateSeedData() {
  const categories = [
    { slug: "prebenjamin", name: "Prebenjamín (6-7 años)", description: "Estación Primavera: Explorar · Moverse, jugar y primeros pases orientados.", sort_order: 1 },
    { slug: "benjamin", name: "Benjamín (8-9 años)", description: "Estación Verano: Experimentar · Cooperación, amplitud y fijar para liberar.", sort_order: 2 },
    { slug: "alevin-infantil", name: "Alevín / Infantil (10-13 años)", description: "Estación Otoño: Comprender · Amplitud como función espacial y llegar con ventaja.", sort_order: 3 },
    { slug: "cadete-juvenil", name: "Cadete / Juvenil (14-18 años)", description: "Estación Invierno: Integrar · Presión tras pérdida y autonomía en fútbol-11.", sort_order: 4 },
  ];

  const formattedExercises = OSO_EXERCISES.map((e) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    objective: `${e.objectiveAttack} / ${e.objectiveDefense}`,
    game_phase: e.gamePhase,
    intensity: e.intensity,
    task_type: e.category,
    duration_min: e.durationMinutes,
    dimensions: e.dimensions,
    players_count: e.playersCount,
    provocation_rule: e.provocationRule,
    continuity_rule: e.continuityRule,
    withdrawal_rule: e.withdrawalRule,
    focos_futbolisticos: e.focosFutbolisticos,
    cinco_p: e.cincoP,
    age_stage: e.ageStage,
  }));

  const formattedTemplates = OSO_TEMPLATES.map((t) => ({
    id: t.id,
    kind: "sesion",
    name: t.title,
    description: `${t.subtitle}. Pregunta de evaluación: ${t.closingQuestion}`,
    is_curated: true,
    is_published: true,
    version: 1,
    content: {
      subtitle: t.subtitle,
      ageGroup: t.ageGroup,
      season: t.season,
      phase: t.phase,
      parts: t.parts,
      closingQuestion: t.closingQuestion,
    },
  }));

  return {
    categoriesCount: categories.length,
    exercisesCount: formattedExercises.length,
    templatesCount: formattedTemplates.length,
    categories,
    exercises: formattedExercises,
    templates: formattedTemplates,
  };
}

// Run directly if invoked via CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed-oso-data.ts")) {
  const seed = generateSeedData();
  console.log(`[Seed OSO Data] Generated ${seed.categoriesCount} categories, ${seed.exercisesCount} exercises and ${seed.templatesCount} templates successfully.`);
}
