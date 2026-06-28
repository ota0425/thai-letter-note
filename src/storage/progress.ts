import type { Progress } from "../types";

export const progressStorageKey = "thai-letter-note-progress-v1";

export const emptyProgress: Progress = {
  seenCharacterIds: [],
  correctCountByCharacterId: {},
  incorrectCountByCharacterId: {},
};

export function loadProgress(): Progress {
  try {
    const rawProgress = window.localStorage.getItem(progressStorageKey);

    if (!rawProgress) {
      return emptyProgress;
    }

    const parsed = JSON.parse(rawProgress) as Partial<Progress>;

    return {
      seenCharacterIds: Array.isArray(parsed.seenCharacterIds)
        ? parsed.seenCharacterIds
        : [],
      correctCountByCharacterId: parsed.correctCountByCharacterId ?? {},
      incorrectCountByCharacterId: parsed.incorrectCountByCharacterId ?? {},
    };
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: Progress) {
  window.localStorage.setItem(progressStorageKey, JSON.stringify(progress));
}
