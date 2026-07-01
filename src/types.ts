export type ConsonantClass = "mid" | "high" | "low";
export type VowelLength = "short" | "long" | "special";

export type ThaiConsonant = {
  id: string;
  character: string;
  displayCharacter?: string;
  name: string;
  type: "consonant";
  consonantClass: ConsonantClass;
  romanization: string;
  ipa?: string;
  exampleWord?: string;
  notes?: string;
};

export type ThaiVowel = {
  id: string;
  character: string;
  displayCharacter?: string;
  name: string;
  type: "vowel";
  vowelLength: VowelLength;
  romanization: string;
  ipa?: string;
  exampleWord?: string;
  notes?: string;
};

export type ThaiLearningItem = ThaiConsonant | ThaiVowel;
export type ThaiCharacter = ThaiLearningItem;

export type ThaiWord = {
  id: string;
  word: string;
  romanization: string;
  ipa?: string;
  meaning: string;
  level: "easy" | "basic";
  notes?: string;
};

export type Progress = {
  seenCharacterIds: string[];
  correctCountByCharacterId: Record<string, number>;
  incorrectCountByCharacterId: Record<string, number>;
  wordCorrectCountById: Record<string, number>;
  wordIncorrectCountById: Record<string, number>;
};

export type QuizMode = "romanization" | "class";
