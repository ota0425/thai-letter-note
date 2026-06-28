import { useEffect, useMemo, useState } from "react";
import {
  consonantClassLabels,
  thaiCharacters,
  vowelLengthLabels,
} from "./data/thaiCharacters";
import {
  emptyProgress,
  loadProgress,
  progressStorageKey,
  saveProgress,
} from "./storage/progress";
import type {
  ConsonantClass,
  Progress,
  QuizMode,
  ThaiLearningItem,
} from "./types";

type ViewMode = "cards" | "quiz" | "review" | "weak" | "overview" | "progress";
type FilterMode = "all" | "consonants" | "vowels" | ConsonantClass;

type OverviewGroup = {
  id: string;
  title: string;
  description: string;
  items: ThaiLearningItem[];
};

const classOptions: FilterMode[] = [
  "all",
  "consonants",
  "mid",
  "high",
  "low",
  "vowels",
];

const filterLabels: Record<FilterMode, string> = {
  all: "すべて",
  consonants: "子音",
  vowels: "母音",
  ...consonantClassLabels,
};

const quizModeLabels: Record<QuizMode, string> = {
  romanization: "読み方",
  class: "分類",
};

const consonantOrder = [
  "ก",
  "ข",
  "ฃ",
  "ค",
  "ฅ",
  "ฆ",
  "ง",
  "จ",
  "ฉ",
  "ช",
  "ซ",
  "ฌ",
  "ญ",
  "ฎ",
  "ฏ",
  "ฐ",
  "ฑ",
  "ฒ",
  "ณ",
  "ด",
  "ต",
  "ถ",
  "ท",
  "ธ",
  "น",
  "บ",
  "ป",
  "ผ",
  "ฝ",
  "พ",
  "ฟ",
  "ภ",
  "ม",
  "ย",
  "ร",
  "ล",
  "ว",
  "ศ",
  "ษ",
  "ส",
  "ห",
  "ฬ",
  "อ",
  "ฮ",
];

const midConsonantOverviewOrder = ["ก", "จ", "ด", "ฎ", "ต", "ฏ", "บ", "ป", "อ"];

const lowPairedConsonants = new Set([
  "ค",
  "ฅ",
  "ฆ",
  "ช",
  "ซ",
  "ฌ",
  "ฑ",
  "ฒ",
  "ท",
  "ธ",
  "พ",
  "ฟ",
  "ภ",
  "ฮ",
]);

function getNextIndex(currentIndex: number, total: number) {
  return total === 0 ? 0 : (currentIndex + 1) % total;
}

function uniqueItems<T>(items: T[]) {
  return Array.from(new Set(items));
}

function buildChoices(
  current: ThaiLearningItem,
  mode: QuizMode,
): string[] {
  const correct = getAnswer(current, mode);
  const pool =
    mode === "romanization"
      ? uniqueItems(thaiCharacters.map((item) => item.romanization))
      : uniqueItems(thaiCharacters.map((item) => getCategoryLabel(item)));
  const distractors = pool.filter((choice) => choice !== correct).slice(0, 3);

  return uniqueItems([correct, ...distractors]).sort((a, b) =>
    a.localeCompare(b),
  );
}

function getCategoryLabel(item: ThaiLearningItem) {
  return item.type === "consonant"
    ? consonantClassLabels[item.consonantClass]
    : vowelLengthLabels[item.vowelLength];
}

function getItemTypeLabel(item: ThaiLearningItem) {
  return item.type === "consonant" ? "子音" : "母音";
}

function getAnswer(item: ThaiLearningItem, mode: QuizMode) {
  return mode === "romanization" ? item.romanization : getCategoryLabel(item);
}

function getDisplayCharacter(item: ThaiLearningItem) {
  if (item.type === "vowel" && item.character.includes("-")) {
    return item.character.replace("-", "□");
  }

  return item.displayCharacter ?? item.character;
}

function sortConsonants(
  items: ThaiLearningItem[],
  order: string[] = consonantOrder,
) {
  return [...items].sort((a, b) => {
    return order.indexOf(a.character) - order.indexOf(b.character);
  });
}

function getTotalCorrect(progress: Progress) {
  return Object.values(progress.correctCountByCharacterId).reduce(
    (sum, value) => sum + value,
    0,
  );
}

function getTotalIncorrect(progress: Progress) {
  return Object.values(progress.incorrectCountByCharacterId).reduce(
    (sum, value) => sum + value,
    0,
  );
}

function getCorrectCount(progress: Progress, itemId: string) {
  return progress.correctCountByCharacterId[itemId] ?? 0;
}

function getIncorrectCount(progress: Progress, itemId: string) {
  return progress.incorrectCountByCharacterId[itemId] ?? 0;
}

function getWeakScore(progress: Progress, item: ThaiLearningItem) {
  return getIncorrectCount(progress, item.id) - getCorrectCount(progress, item.id);
}

function getWeakItems(progress: Progress) {
  return thaiCharacters
    .filter((item) => getWeakScore(progress, item) > 0)
    .sort((a, b) => getWeakScore(progress, b) - getWeakScore(progress, a));
}

function getReviewItems(progress: Progress) {
  return [...thaiCharacters].sort((a, b) => {
    const aWeakScore = getWeakScore(progress, a);
    const bWeakScore = getWeakScore(progress, b);
    const aUnseen = progress.seenCharacterIds.includes(a.id) ? 0 : 1;
    const bUnseen = progress.seenCharacterIds.includes(b.id) ? 0 : 1;
    const aIncorrect = getIncorrectCount(progress, a.id);
    const bIncorrect = getIncorrectCount(progress, b.id);

    return (
      bWeakScore - aWeakScore ||
      bUnseen - aUnseen ||
      bIncorrect - aIncorrect ||
      thaiCharacters.indexOf(a) - thaiCharacters.indexOf(b)
    );
  });
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quizMode, setQuizMode] = useState<QuizMode>("romanization");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  const visibleCharacters = useMemo(() => {
    if (filterMode === "all") {
      return thaiCharacters;
    }

    if (filterMode === "consonants") {
      return thaiCharacters.filter((item) => item.type === "consonant");
    }

    if (filterMode === "vowels") {
      return thaiCharacters.filter((item) => item.type === "vowel");
    }

    return thaiCharacters.filter((item) => {
      return item.type === "consonant" && item.consonantClass === filterMode;
    });
  }, [filterMode]);

  const weakCharacters = useMemo(() => getWeakItems(progress), [progress]);
  const reviewCharacters = useMemo(() => getReviewItems(progress), [progress]);
  const activeCharacters =
    viewMode === "review" ? reviewCharacters : visibleCharacters;

  const overviewGroups = useMemo<OverviewGroup[]>(() => {
    const consonants = thaiCharacters.filter((item) => item.type === "consonant");
    const vowels = thaiCharacters.filter((item) => item.type === "vowel");

    return [
      {
        id: "mid",
        title: "中子音",
        description: "声調ルールの基準になる子音",
        items: sortConsonants(
          consonants.filter(
            (item) => item.type === "consonant" && item.consonantClass === "mid",
          ),
          midConsonantOverviewOrder,
        ),
      },
      {
        id: "high",
        title: "高子音",
        description: "低子音対応字と対になることが多い子音",
        items: sortConsonants(
          consonants.filter(
            (item) => item.type === "consonant" && item.consonantClass === "high",
          ),
        ),
      },
      {
        id: "low-paired",
        title: "低子音対応字",
        description: "高子音と音の対応を持つ低子音",
        items: sortConsonants(
          consonants.filter((item) => lowPairedConsonants.has(item.character)),
        ),
      },
      {
        id: "low-single",
        title: "低子音単独字",
        description: "高子音に直接対応する文字を持たない低子音",
        items: sortConsonants(
          consonants.filter((item) => {
            return (
              item.type === "consonant" &&
              item.consonantClass === "low" &&
              !lowPairedConsonants.has(item.character)
            );
          }),
        ),
      },
      {
        id: "vowels",
        title: "母音",
        description: "短母音・長母音・特殊母音",
        items: vowels,
      },
    ];
  }, []);

  const currentCharacter = activeCharacters[selectedIndex] ?? activeCharacters[0] ?? thaiCharacters[0];
  const quizChoices = useMemo(
    () => buildChoices(currentCharacter, quizMode),
    [currentCharacter, quizMode],
  );
  const correctAnswer = getAnswer(currentCharacter, quizMode);
  const currentCategoryLabel = getCategoryLabel(currentCharacter);
  const currentTypeLabel = getItemTypeLabel(currentCharacter);
  const currentDisplayCharacter = getDisplayCharacter(currentCharacter);
  const isCorrect = selectedAnswer === correctAnswer;
  const isCurrentSeen = progress.seenCharacterIds.includes(currentCharacter.id);
  const seenCount = progress.seenCharacterIds.length;
  const totalCorrect = getTotalCorrect(progress);
  const totalIncorrect = getTotalIncorrect(progress);
  const weakCount = weakCharacters.length;
  const isReviewMode = viewMode === "review";

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    setSelectedIndex(0);
    setSelectedAnswer(null);
  }, [filterMode, viewMode]);

  useEffect(() => {
    setSelectedAnswer(null);
  }, [quizMode, selectedIndex]);

  function markSeen(characterId: string) {
    setProgress((currentProgress) => {
      if (currentProgress.seenCharacterIds.includes(characterId)) {
        return currentProgress;
      }

      return {
        ...currentProgress,
        seenCharacterIds: [...currentProgress.seenCharacterIds, characterId],
      };
    });
  }

  function goNext() {
    markSeen(currentCharacter.id);
    setSelectedIndex((currentIndex) =>
      getNextIndex(currentIndex, activeCharacters.length),
    );
  }

  function answerQuiz(answer: string) {
    if (selectedAnswer) {
      return;
    }

    const answeredCorrectly = answer === correctAnswer;
    setSelectedAnswer(answer);
    setProgress((currentProgress) => {
      const targetMap = answeredCorrectly
        ? currentProgress.correctCountByCharacterId
        : currentProgress.incorrectCountByCharacterId;

      return {
        ...currentProgress,
        seenCharacterIds: currentProgress.seenCharacterIds.includes(
          currentCharacter.id,
        )
          ? currentProgress.seenCharacterIds
          : [...currentProgress.seenCharacterIds, currentCharacter.id],
        correctCountByCharacterId: answeredCorrectly
          ? {
              ...targetMap,
              [currentCharacter.id]: (targetMap[currentCharacter.id] ?? 0) + 1,
            }
          : currentProgress.correctCountByCharacterId,
        incorrectCountByCharacterId: answeredCorrectly
          ? currentProgress.incorrectCountByCharacterId
          : {
              ...targetMap,
              [currentCharacter.id]: (targetMap[currentCharacter.id] ?? 0) + 1,
            },
      };
    });
  }

  function resetProgress() {
    window.localStorage.removeItem(progressStorageKey);
    setProgress(emptyProgress);
    setSelectedAnswer(null);
  }

  function openCard(item: ThaiLearningItem) {
    const itemIndex = thaiCharacters.findIndex((candidate) => candidate.id === item.id);

    if (itemIndex >= 0) {
      setFilterMode("all");
      setSelectedIndex(itemIndex);
      setViewMode("cards");
      setSelectedAnswer(null);
    }
  }

  function startReview(item?: ThaiLearningItem) {
    const targetIndex = item
      ? reviewCharacters.findIndex((candidate) => candidate.id === item.id)
      : 0;

    setViewMode("review");
    setSelectedIndex(targetIndex >= 0 ? targetIndex : 0);
    setSelectedAnswer(null);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Thai Letter Note</p>
          <h1>タイ文字ノート</h1>
        </div>
        <div className="progress-pill" aria-label="学習済み文字数">
          <span>{seenCount}</span>
          <small>/ {thaiCharacters.length} 文字</small>
        </div>
      </header>

      <nav className="tab-list" aria-label="表示切り替え">
        <button
          className={viewMode === "cards" ? "active" : ""}
          type="button"
          onClick={() => setViewMode("cards")}
        >
          カード
        </button>
        <button
          className={viewMode === "quiz" ? "active" : ""}
          type="button"
          onClick={() => setViewMode("quiz")}
        >
          クイズ
        </button>
        <button
          className={viewMode === "review" ? "active" : ""}
          type="button"
          onClick={() => startReview()}
        >
          復習
        </button>
        <button
          className={viewMode === "weak" ? "active" : ""}
          type="button"
          onClick={() => setViewMode("weak")}
        >
          苦手
        </button>
        <button
          className={viewMode === "overview" ? "active" : ""}
          type="button"
          onClick={() => setViewMode("overview")}
        >
          一覧
        </button>
        <button
          className={viewMode === "progress" ? "active" : ""}
          type="button"
          onClick={() => setViewMode("progress")}
        >
          進捗
        </button>
      </nav>

      {(viewMode === "cards" || viewMode === "quiz") && (
        <section className="filter-bar" aria-label="学習項目フィルター">
          {classOptions.map((option) => (
            <button
              className={filterMode === option ? "active" : ""}
              key={option}
              type="button"
              onClick={() => setFilterMode(option)}
            >
              {filterLabels[option]}
            </button>
          ))}
        </section>
      )}

      {viewMode === "cards" && (
        <section className="study-panel" aria-labelledby="card-title">
          <div className="letter-card">
            <div className="card-status-row">
              <p className="card-count">
                {selectedIndex + 1} / {visibleCharacters.length}
              </p>
              {isCurrentSeen && <span className="learned-badge">覚えた</span>}
            </div>
            <p className="thai-letter">{currentDisplayCharacter}</p>
            <h2 id="card-title">{currentCharacter.name}</h2>
            <div className="card-facts">
              <span>{currentTypeLabel}</span>
              <span>{currentCategoryLabel}</span>
              {currentCharacter.displayCharacter && (
                <span>記号 {currentCharacter.character}</span>
              )}
              <span>{currentCharacter.romanization}</span>
              {currentCharacter.ipa && <span>IPA {currentCharacter.ipa}</span>}
            </div>
            {currentCharacter.exampleWord && (
              <p className="example-word">代表単語: {currentCharacter.exampleWord}</p>
            )}
            <p className="notes">{currentCharacter.notes}</p>
          </div>

          <div className="action-row">
            <button
              className={isCurrentSeen ? "learned-button" : ""}
              type="button"
              onClick={() => markSeen(currentCharacter.id)}
            >
              {isCurrentSeen ? "覚えた済み" : "覚えた"}
            </button>
            <button className="primary" type="button" onClick={goNext}>
              次へ
            </button>
          </div>
        </section>
      )}

      {(viewMode === "quiz" || viewMode === "review") && (
        <section className="study-panel" aria-labelledby="quiz-title">
          <div className="quiz-header">
            <div>
              <p className="eyebrow">{isReviewMode ? "Review" : "4択クイズ"}</p>
              <h2 id="quiz-title">{currentDisplayCharacter}</h2>
            </div>
            <div className="segmented-control" aria-label="クイズ種類">
              {(["romanization", "class"] as QuizMode[]).map((mode) => (
                <button
                  className={quizMode === mode ? "active" : ""}
                  key={mode}
                  type="button"
                  onClick={() => setQuizMode(mode)}
                >
                  {quizModeLabels[mode]}
                </button>
              ))}
            </div>
          </div>

          <p className="quiz-prompt">
            {isReviewMode && (
              <span className="review-status">
                復習 {selectedIndex + 1} / {reviewCharacters.length}
              </span>
            )}
            {quizMode === "romanization"
              ? "この文字・記号の独自ローマ字表記は？"
              : "この文字・記号の分類は？"}
          </p>

          <div className="choice-grid">
            {quizChoices.map((choice) => {
              const wasSelected = selectedAnswer === choice;
              const revealCorrect = selectedAnswer && choice === correctAnswer;
              return (
                <button
                  className={[
                    "choice-button",
                    wasSelected ? "selected" : "",
                    revealCorrect ? "correct" : "",
                    wasSelected && !isCorrect ? "incorrect" : "",
                  ].join(" ")}
                  disabled={Boolean(selectedAnswer)}
                  key={choice}
                  type="button"
                  onClick={() => answerQuiz(choice)}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {selectedAnswer && (
            <div className={isCorrect ? "result correct" : "result incorrect"}>
              <strong>{isCorrect ? "正解です" : "もう一度確認しましょう"}</strong>
              <div className="answer-details">
                <span>
                  <small>ローマ字</small>
                  {currentCharacter.romanization}
                </span>
                <span>
                  <small>分類</small>
                  {currentCategoryLabel}
                </span>
              </div>
              <button className="primary next-question-button" type="button" onClick={goNext}>
                次へ
              </button>
              <div className="result-actions">
                <button type="button" onClick={() => setSelectedAnswer(null)}>
                  もう一問
                </button>
              </div>
            </div>
          )}

          {!selectedAnswer && (
            <div className="action-row">
              <button type="button" onClick={goNext}>
                スキップ
              </button>
              <button className="primary" type="button" onClick={goNext}>
                次へ
              </button>
            </div>
          )}
        </section>
      )}

      {viewMode === "weak" && (
        <section className="study-panel" aria-labelledby="weak-title">
          <div className="progress-summary">
            <div>
              <p className="eyebrow">Weak Points</p>
              <h2 id="weak-title">苦手リスト</h2>
            </div>
            <button className="primary" type="button" onClick={() => startReview()}>
              復習する
            </button>
          </div>

          {weakCharacters.length === 0 ? (
            <div className="empty-panel">
              <strong>苦手な文字はまだありません</strong>
              <p>クイズで間違えた文字がここに表示されます。</p>
            </div>
          ) : (
            <div className="progress-list weak-list">
              {weakCharacters.map((item) => {
                const correctCount = getCorrectCount(progress, item.id);
                const incorrectCount = getIncorrectCount(progress, item.id);

                return (
                  <div className="progress-item weak-item" key={item.id}>
                    <span className="mini-letter">{getDisplayCharacter(item)}</span>
                    <div>
                      <strong>{item.romanization}</strong>
                      <p>
                        {getItemTypeLabel(item)} / {getCategoryLabel(item)}
                      </p>
                    </div>
                    <span className="weak-score">
                      {correctCount} / {incorrectCount}
                    </span>
                    <button type="button" onClick={() => startReview(item)}>
                      復習
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {viewMode === "overview" && (
        <section className="study-panel overview-panel" aria-labelledby="overview-title">
          <div className="overview-heading">
            <div>
              <p className="eyebrow">Overview</p>
              <h2 id="overview-title">分類一覧</h2>
            </div>
            <span>{thaiCharacters.length} 項目</span>
          </div>

          <div className="overview-groups">
            {overviewGroups.map((group) => (
              <section className="overview-group" key={group.id}>
                <div className="overview-group-header">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
                <div className="overview-grid">
                  {group.items.map((item) => {
                    const isSeen = progress.seenCharacterIds.includes(item.id);

                    return (
                      <button
                        className={[
                          "overview-cell",
                          item.type === "vowel" ? "vowel-cell" : "",
                          isSeen ? "learned" : "",
                        ].join(" ")}
                        key={item.id}
                        type="button"
                        onClick={() => openCard(item)}
                      >
                        <span className="overview-letter">
                          {getDisplayCharacter(item)}
                        </span>
                        <span className="overview-reading">
                          {item.romanization}
                        </span>
                        {isSeen && <span className="overview-seen">覚</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}

      {viewMode === "progress" && (
        <section className="study-panel" aria-labelledby="progress-title">
          <div className="progress-summary">
            <div>
              <p className="eyebrow">Progress</p>
              <h2 id="progress-title">学習進捗</h2>
            </div>
            <button type="button" onClick={resetProgress}>
              初期化
            </button>
          </div>

          <div className="stats-grid">
            <div>
              <span>{seenCount}</span>
              <p>見た文字</p>
            </div>
            <div>
              <span>{totalCorrect}</span>
              <p>正解</p>
            </div>
            <div>
              <span>{totalIncorrect}</span>
              <p>不正解</p>
            </div>
            <div>
              <span>{weakCount}</span>
              <p>苦手</p>
            </div>
          </div>

          <div className="progress-list">
            {thaiCharacters.map((item) => (
              <div className="progress-item" key={item.id}>
                <span className="mini-letter">{getDisplayCharacter(item)}</span>
                <div>
                  <strong>{item.romanization}</strong>
                  <p>
                    {getItemTypeLabel(item)} / {getCategoryLabel(item)}
                  </p>
                </div>
                {progress.seenCharacterIds.includes(item.id) && (
                  <span className="mini-learned">覚えた</span>
                )}
                <span>
                  {(progress.correctCountByCharacterId[item.id] ?? 0)}/
                  {(progress.incorrectCountByCharacterId[item.id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
