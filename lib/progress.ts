import { supabase } from "./supabase";
import { getCurrentUser } from "./auth";

const ROUND_ORDER = ["round1", "round2", "round3", "round4", "completed"];

export async function saveGameProgress(newRound: "round1" | "round2" | "round3" | "round4"): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    // Fetch current progress
    const { data, error } = await supabase
      .from("users")
      .select("round3_answer")
      .eq("id", user.id)
      .single();

    if (error || !data) return;

    const currentAnswer = data.round3_answer;

    // Determine current progress state
    let currentRoundState = "start"; // before round 1
    if (currentAnswer) {
      if (currentAnswer.startsWith("__PROGRESS__:")) {
        currentRoundState = currentAnswer.replace("__PROGRESS__:", "");
      } else {
        currentRoundState = "completed"; // submitted final report
      }
    }

    const currentIndex = ROUND_ORDER.indexOf(currentRoundState);
    const newIndex = ROUND_ORDER.indexOf(newRound);

    // Only update if the new round is further along
    if (newIndex > currentIndex) {
      await supabase
        .from("users")
        .update({
          round3_answer: `__PROGRESS__:${newRound}`,
        })
        .eq("id", user.id);
    }
  } catch (err) {
    console.error("Failed to save game progress:", err);
  }
}

export function getRedirectUrlForProgress(round3_answer: string | null): string {
  if (!round3_answer) {
    return "/round1";
  }
  if (round3_answer.startsWith("__PROGRESS__:")) {
    const round = round3_answer.replace("__PROGRESS__:", "");
    return `/${round}`;
  }
  return "/results";
}
