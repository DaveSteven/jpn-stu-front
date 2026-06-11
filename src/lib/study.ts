export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
export const SESSION_TOKEN_KEY = "japanese-study-session-token";
export const EXAM_CACHE_PREFIX = "japanese-study-exam-cache";

export const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
export const SUBJECTS = [
  { id: "grammar", label: "文法" },
  { id: "meaning", label: "語彙" },
  { id: "kanji", label: "漢字" },
];

export async function api(path: string, options: RequestInit = {}, token: string | null = null) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function pct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function subjectLabel(subject) {
  return SUBJECTS.find((item) => item.id === subject)?.label || subject;
}

export function normalizeJapaneseUiText(value) {
  return String(value || "").replaceAll("课", "課");
}

export function bookDisplayNumber(value) {
  const normalized = normalizeJapaneseUiText(value);
  const lessonNumber = normalized.match(/第\s*(\d+)\s*課/);
  if (lessonNumber) return lessonNumber[1].padStart(2, "0");
  return normalized;
}

export function mapBook(book) {
  return {
    ...book,
    book_id: book.id,
    book_name: normalizeJapaneseUiText(book.name),
    displayName: bookDisplayNumber(book.name),
    subjectLabel: book.subject_label,
    categoryLabel: `${book.level} ${book.subject_label}`,
  };
}

export function mapAttempt(attempt) {
  return {
    id: attempt.id,
    mode: attempt.mode,
    level: attempt.level,
    subject: attempt.subject,
    subjectLabel: attempt.subject_label,
    categoryLabel: `${attempt.level} ${attempt.subject_label}`,
    bookId: attempt.book_id,
    bookName: normalizeJapaneseUiText(attempt.title),
    correct: attempt.correct,
    total: attempt.total,
    createdAt: attempt.created_at,
    answers: (attempt.answers || []).map((answer) => ({
      questionId: answer.question_id,
      stem: answer.stem,
      chosenOptionId: answer.chosen_option_id,
      chosenText: answer.chosen_text,
      correctOptionId: answer.correct_option_id,
      answerText: answer.answer_text,
      isCorrect: answer.is_correct,
      options: (answer.options || []).map((option) => ({
        id: option.id,
        text: option.text,
      })),
    })),
  };
}

export function mapWrong(item) {
  return {
    key: `${item.level}:${item.subject}:${item.question_id}`,
    questionId: item.question_id,
    stem: item.stem,
    level: item.level,
    subject: item.subject,
    subjectLabel: item.subject_label,
    categoryLabel: `${item.level} ${item.subject_label}`,
    bookId: item.book_id,
    bookName: normalizeJapaneseUiText(item.book_name),
    answerText: item.answer_text,
    wrongCount: item.wrong_count,
    lastChosenText: item.last_chosen_text,
    lastWrongAt: item.last_wrong_at,
  };
}

export function mapExam(exam) {
  return {
    id: exam.id,
    externalId: exam.external_id,
    level: exam.level,
    title: exam.title,
    examDate: exam.exam_date,
    mediaUrl: exam.media_url,
    questionCount: exam.question_count,
    layerCount: exam.layer_count,
    vocabularyNum: exam.vocabulary_num,
    grammarNum: exam.grammar_num,
    readingNum: exam.reading_num,
    listeningNum: exam.listening_num,
  };
}

export function mapExamAttempt(attempt) {
  return {
    id: attempt.id,
    examId: attempt.exam_id,
    level: attempt.level,
    title: attempt.title,
    correct: attempt.correct,
    total: attempt.total,
    createdAt: attempt.created_at,
    answers: (attempt.answers || []).map((answer) => ({
      questionId: answer.question_id,
      title: answer.title,
      chosenOptionId: answer.chosen_option_id,
      chosenText: answer.chosen_text,
      correctOptionId: answer.correct_option_id,
      answerText: answer.answer_text,
      analysis: answer.analysis,
      isCorrect: answer.is_correct,
    })),
  };
}

export function examPartLabel(layer) {
  if ((layer.question_type || 0) >= 41) return "聴解";
  if ((layer.question_type || 0) >= 31) return "読解";
  if ((layer.question_type || 0) >= 21) return "文法";
  return "文字・語彙";
}

export function examQuestionCategoryLabel(question) {
  const type = question.question_type || 0;
  if (type >= 41) return "聴解";
  if (type >= 31) return "読解";
  if (type >= 21) return "文法";
  return "文字・語彙";
}

export function isListeningQuestion(question) {
  return (question?.question_type || 0) >= 41;
}

export function isReadingQuestion(question) {
  const type = question?.question_type || 0;
  return type >= 31 && type < 41;
}

export function examProblemLabel(layer) {
  const extracted = (layer.title || "").match(/問題\s*(\d+)/);
  const number = extracted?.[1] || layer.order_index;
  return `問題${number}`;
}

export function buildExamProblemSections(exam, questions) {
  const questionsByLayer = new Map();
  for (const question of questions) {
    if (!questionsByLayer.has(question.layer_id)) questionsByLayer.set(question.layer_id, []);
    questionsByLayer.get(question.layer_id).push(question);
  }

  return [...(exam.layers || [])]
    .sort((left, right) => left.order_index - right.order_index)
    .map((layer) => ({
      id: layer.id,
      partLabel: examPartLabel(layer),
      problemLabel: examProblemLabel(layer),
      layer,
      questions: (questionsByLayer.get(layer.id) || []).sort((left, right) => left.order_index - right.order_index),
    }))
    .filter((section) => section.questions.length);
}

export function examQuestionDisplayNumber(section, question, sectionIndex, questionIndexById) {
  if (section?.partLabel === "聴解") return sectionIndex + 1;
  return (questionIndexById.get(question.id) || 0) + 1;
}

export function buildReviewProblemGroups(exam, questions) {
  const questionIndexById = new Map(questions.map((question, index) => [question.id, index]));
  const problemSections = buildExamProblemSections(exam, questions);
  const grouped = [];
  const partCounters = new Map();

  for (const section of problemSections) {
    const current = grouped[grouped.length - 1];
    const partCount = partCounters.get(section.partLabel) || 0;
    const reviewSection = {
      ...section,
      items: section.questions.map((question, sectionIndex) => {
        const globalIndex = questionIndexById.get(question.id) || 0;
        return {
          question,
          index: globalIndex,
          displayNumber: examQuestionDisplayNumber(section, question, sectionIndex, questionIndexById),
        };
      }),
    };
    partCounters.set(section.partLabel, partCount + section.questions.length);

    if (current?.label === section.partLabel) {
      current.sections.push(reviewSection);
    } else {
      grouped.push({ label: section.partLabel, sections: [reviewSection] });
    }
  }

  return grouped;
}

export function groupQuestionsByPassage(questions) {
  const groups = [];
  for (const question of questions) {
    const previous = groups[groups.length - 1];
    const passage = question.passage || "";
    if (previous && previous.passage === passage) {
      previous.questions.push(question);
    } else {
      groups.push({ passage, questions: [question] });
    }
  }
  return groups;
}

export function groupReviewItemsByPassage(items) {
  const groups = [];
  for (const item of items) {
    const question = item.question || {};
    const passage = question.passage || "";
    const translation = question.translation || "";
    const key = passage ? `${passage}\n${translation}` : `${question.id || item.index}`;
    const previous = groups[groups.length - 1];
    if (previous && previous.key === key) {
      previous.items.push(item);
    } else {
      groups.push({ key, passage, translation, question, items: [item] });
    }
  }
  return groups;
}

export function examPassMark(level) {
  return {
    N1: 100,
    N2: 90,
    N3: 95,
    N4: 90,
    N5: 80,
  }[level] || 90;
}

export function calculateExamScore(attempt, questions) {
  const answerByQuestion = new Map<number, any>(attempt.answers.map((answer) => [answer.questionId, answer]));
  const languageReadingQuestions = questions.filter((question) => (question.question_type || 0) < 41);
  const listeningQuestions = questions.filter((question) => (question.question_type || 0) >= 41);
  const countCorrect = (items) => items.reduce((sum, question) => (
    sum + (answerByQuestion.get(question.id)?.isCorrect ? 1 : 0)
  ), 0);
  const languageReadingCorrect = countCorrect(languageReadingQuestions);
  const listeningCorrect = countCorrect(listeningQuestions);
  const languageReadingScore = languageReadingQuestions.length
    ? Math.round((languageReadingCorrect / languageReadingQuestions.length) * 120)
    : 0;
  const listeningScore = listeningQuestions.length
    ? Math.round((listeningCorrect / listeningQuestions.length) * 60)
    : 0;
  const totalScore = languageReadingScore + listeningScore;
  const overallPassMark = examPassMark(attempt.level);
  const languageReadingPassMark = 38;
  const listeningPassMark = 19;
  return {
    languageReadingCorrect,
    languageReadingTotal: languageReadingQuestions.length,
    languageReadingScore,
    languageReadingPassMark,
    listeningCorrect,
    listeningTotal: listeningQuestions.length,
    listeningScore,
    listeningPassMark,
    totalScore,
    overallPassMark,
    passed: totalScore >= overallPassMark
      && languageReadingScore >= languageReadingPassMark
      && listeningScore >= listeningPassMark,
  };
}

export function assetSrc(url) {
  if (!url) return "";
  return url.startsWith("/") ? `${API_BASE}${url}` : url;
}

export function examCacheKey(userId, examId) {
  return `${EXAM_CACHE_PREFIX}:${userId}:${examId}`;
}

export function readExamCache(userId, examId) {
  try {
    return JSON.parse(localStorage.getItem(examCacheKey(userId, examId)) || "{}");
  } catch {
    return {};
  }
}

export function writeExamCache(userId, examId, data) {
  localStorage.setItem(examCacheKey(userId, examId), JSON.stringify(data));
}

export function clearExamCache(userId, examId) {
  localStorage.removeItem(examCacheKey(userId, examId));
}
