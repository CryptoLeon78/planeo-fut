import { sessionEvaluationsRepository } from "@/api/session-evaluations.repository";

export type SessionEvaluation = {
  id?: string;
  rating: number | null;
  intensity_perceived: string | null;
  objectives_met: boolean | null;
  what_worked: string | null;
  what_to_improve: string | null;
  player_notes: string | null;
};

export const emptyEvaluation: SessionEvaluation = {
  rating: null,
  intensity_perceived: null,
  objectives_met: null,
  what_worked: "",
  what_to_improve: "",
  player_notes: "",
};

export function toEvaluationPayload(sessionId: string, ownerId: string, evaluation: SessionEvaluation) {
  return {
    session_id: sessionId,
    owner_id: ownerId,
    rating: evaluation.rating,
    intensity_perceived: evaluation.intensity_perceived,
    objectives_met: evaluation.objectives_met,
    what_worked: evaluation.what_worked || null,
    what_to_improve: evaluation.what_to_improve || null,
    player_notes: evaluation.player_notes || null,
  };
}

export const sessionEvaluationsService = {
  async get(sessionId: string): Promise<SessionEvaluation | null> {
    const row = await sessionEvaluationsRepository.getBySession(sessionId);
    return (row as SessionEvaluation | null) ?? null;
  },
  save(sessionId: string, ownerId: string, evaluation: SessionEvaluation) {
    return sessionEvaluationsRepository.save(toEvaluationPayload(sessionId, ownerId, evaluation));
  },
  remove(sessionId: string) {
    return sessionEvaluationsRepository.removeBySession(sessionId);
  },
};
