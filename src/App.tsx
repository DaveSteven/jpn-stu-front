import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  DEFAULT_LEVEL,
  SESSION_TOKEN_KEY,
  api,
  clearExamCache,
  mapAttempt,
  mapBook,
  mapExam,
  mapExamAttempt,
  mapWrong,
  normalizeLevel,
  pct,
  readExamCache,
  readUserLevelCache,
  writeExamCache,
  writeUserLevelCache,
} from "./lib/study";
import {
  ExamListView,
  ExamIntroView,
  ExamResultView,
  ExamSectionBreakView,
  ExamSessionView,
  RandomPracticeSessionView,
  GrammarPracticeSetupView,
  LibraryView,
  LoginView,
  QuizView,
  ResultView,
  Shell,
  UserView,
  VocabularyView,
  WrongBookView,
  PRACTICE_CATEGORIES,
} from "./pages";

import Listening from "./pages/Listening";

const QUIZ_SESSION_KEY = "japanese-study-quiz-session";

function readStoredQuizSession() {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_SESSION_KEY) || "null");
  } catch (err) {
    localStorage.removeItem(QUIZ_SESSION_KEY);
    return null;
  }
}

function writeStoredQuizSession(session) {
  if (!session) {
    localStorage.removeItem(QUIZ_SESSION_KEY);
    return;
  }
  localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(session));
}

function questionsForRunSection(allQuestions, run) {
  const section = run?.sections?.[run.current_section];
  if (!section) return [];
  const sectionIds = new Set(section.question_ids || []);
  const byIds = allQuestions.filter((question) => sectionIds.has(question.id));
  if (byIds.length) return byIds;
  return allQuestions.filter((question) => {
    const type = Number(question.question_type || 0);
    if (section.key === "listening") return type >= 41;
    if (section.key === "language_reading") return type < 41;
    if (section.key === "vocabulary") return type < 21;
    if (section.key === "grammar_reading") return type >= 21 && type < 41;
    return false;
  });
}

function App() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [exams, setExams] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);
  const [examRuns, setExamRuns] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(SESSION_TOKEN_KEY));
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [subject, setSubject] = useState("grammar");
  const [selectedBook, setSelectedBook] = useState(null);
  const [session, setSession] = useState(() => readStoredQuizSession());
  const [examSession, setExamSession] = useState(null);
  const [grammarPractice, setGrammarPractice] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [wrongItems, setWrongItems] = useState([]);
  const [vocabulary, setVocabulary] = useState([]);
  const [vocabularyStats, setVocabularyStats] = useState({ total: 0, new: 0, learning: 0, mastered: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const examSaveQueue = useRef(Promise.resolve());

  async function refreshStudyData(nextLevel = level, token = authToken) {
    if (!token) return;
    const [attemptRows, wrongRows, examAttemptRows, examRunRows] = await Promise.all([
      api("/api/attempts?limit=50", {}, token),
      api(`/api/wrong-questions?level=${nextLevel}`, {}, token),
      api(`/api/exam-attempts?level=${nextLevel}&limit=50`, {}, token),
      api("/api/exam-runs", {}, token),
    ]);
    setAttempts(attemptRows.map(mapAttempt));
    setWrongItems(wrongRows.map(mapWrong));
    setExamAttempts(examAttemptRows.map(mapExamAttempt));
    setExamRuns(examRunRows);
  }

  useEffect(() => {
    let ignore = false;
    async function restoreSession() {
      setLoading(true);
      setError("");
      try {
        const restoredUser = authToken ? await api("/api/me", {}, authToken) : null;
        if (!ignore) {
          setCurrentUser(restoredUser);
          if (restoredUser) {
            setLevel(normalizeLevel(restoredUser.current_level || readUserLevelCache(restoredUser.id)));
          }
        }
      } catch (err) {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        if (!ignore) {
          setAuthToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    restoreSession();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!authToken || !currentUser) return;
      setLoading(true);
      setError("");
      try {
        const [bookRows, examRows] = await Promise.all([
          api(`/api/books?level=${level}&subject=${subject}`),
          api(`/api/exams?level=${level}`),
          refreshStudyData(level, authToken),
        ]);
        if (!ignore) setBooks(bookRows.map(mapBook));
        if (!ignore) setExams(examRows.map(mapExam));
      } catch (err) {
        if (!ignore) setError(`データを読み込めませんでした: ${err.message}`);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [level, subject, currentUser, authToken]);

  useEffect(() => {
    let ignore = false;
    async function loadVocabulary() {
      if (!authToken || !currentUser) return;
      try {
        const [entries, stats] = await Promise.all([
          api("/api/vocabulary?limit=500", {}, authToken),
          api("/api/vocabulary/stats", {}, authToken),
        ]);
        if (!ignore) setVocabulary(entries);
        if (!ignore) setVocabularyStats(stats);
      } catch (err) {
        if (!ignore) setError(`无法加载词汇数据：${err.message}`);
      }
    }
    loadVocabulary();
    return () => { ignore = true; };
  }, [currentUser, authToken]);

  async function reviewVocabulary(entryId, remembered) {
    const updated = await api(`/api/vocabulary/${entryId}/review`, {
      method: "POST",
      body: JSON.stringify({ remembered }),
    }, authToken);
    setVocabulary((rows) => rows.map((row) => row.id === entryId ? updated : row));
    const stats = await api("/api/vocabulary/stats", {}, authToken);
    setVocabularyStats(stats);
  }

  useEffect(() => {
    if (!currentUser || !session) return;
    if (session.userId && session.userId !== currentUser.id) {
      setSession(null);
      return;
    }
    writeStoredQuizSession(session);
  }, [currentUser, session]);

  const bookStats = useMemo(() => {
    const stats = new Map();
    for (const attempt of attempts) {
      if (!attempt.bookId) continue;
      const existing = stats.get(attempt.bookId) || {
        tries: 0,
        best: 0,
        correct: 0,
        total: 0,
      };
      existing.tries += 1;
      existing.best = Math.max(existing.best, pct(attempt.correct, attempt.total));
      existing.correct += attempt.correct;
      existing.total += attempt.total;
      stats.set(attempt.bookId, existing);
    }
    return stats;
  }, [attempts]);

  async function startBook(book) {
    setError("");
    const quiz = await api(`/api/books/${book.id}/quiz?limit=10`, {}, authToken);
    startSession(book, quiz, "book");
  }

  async function startMixedTest() {
    setError("");
    const quiz = await api(`/api/quiz/mixed?level=${level}&subject=${subject}&limit=20`, {}, authToken);
    const source = {
      id: null,
      book_id: null,
      book_name: quiz.title,
      level,
      subject,
      subjectLabel: quiz.subject_label,
      categoryLabel: `${level} ${quiz.subject_label}`,
    };
    startSession(source, quiz, "mixed");
  }

  async function startGrammarPractice(config) {
    setError("");
    if (config.mode === "random") {
      const rows = await api(`/api/exam-practice/random?level=${level}&types=${config.types.join(",")}&limit=${config.count}`, {}, authToken);
      const category = PRACTICE_CATEGORIES[config.category] || PRACTICE_CATEGORIES.grammar;
      const questions = rows.map((question) => ({
        ...question,
        source_exam_id: question.exam_id,
        source_exam_title: question.exam_title,
        layer_id: `practice-${question.id}`,
        order_index: question.practice_order,
      }));
      setGrammarPractice({
        config,
        exam: {
          id: 0,
          level,
          title: `${level} ${category.label}专项`,
          layers: questions.map((question) => ({
            id: question.layer_id,
            order_index: question.practice_order,
            title: `${category.label}专项 · 第${question.practice_order}题`,
            question_type: question.question_type,
          })),
        },
        questions,
        index: 0,
        answers: {},
        finishedAttempt: null,
      });
      return;
    }
    const selectedExams = config.mode === "exam"
        ? exams.filter((exam) => exam.id === Number(config.examId))
        : exams;
      const loaded = await Promise.all(selectedExams.map(async (exam) => {
        const [detail, questions] = await Promise.all([
          api(`/api/exams/${exam.id}`, {}, authToken),
          api(`/api/exams/${exam.id}/questions`, {}, authToken),
        ]);
        return { exam, detail, questions };
      }));
      const allowedTypes = new Set(config.types.map(Number));
      const pool = loaded.flatMap(({ exam, questions }) => questions
        .filter((question) => allowedTypes.has(question.question_type))
        .map((question) => ({ ...question, source_exam_id: exam.id, source_exam_title: exam.title })));
      if (!pool.length) throw new Error("所选条件下没有可用的专项题目");
      const questions = config.mode === "random"
        ? [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(config.count, pool.length))
        : pool;
      const layerIds = new Set(questions.map((question) => question.layer_id));
      const layers = loaded.flatMap(({ detail }) => detail.layers || [])
        .filter((layer) => layerIds.has(layer.id));
      setGrammarPractice({
        config,
        exam: {
          id: 0,
          level,
          title: `${level} ${(PRACTICE_CATEGORIES[config.category] || PRACTICE_CATEGORIES.grammar).label}专项`,
          layers: layers.map((layer, index) => ({ ...layer, order_index: index + 1 })),
        },
        questions,
        index: 0,
        answers: {},
        finishedAttempt: null,
      });
  }

  function chooseGrammarOption(questionId, optionId) {
    setGrammarPractice((current) => ({
      ...current,
      answers: { ...current.answers, [questionId]: optionId },
    }));
  }

  function moveGrammarQuestion(index) {
    setGrammarPractice((current) => ({
      ...current,
      index: Math.max(0, Math.min(current.questions.length - 1, index)),
    }));
  }

  async function submitGrammarPractice() {
    const groups = new Map();
    for (const question of grammarPractice.questions) {
      if (!groups.has(question.source_exam_id)) groups.set(question.source_exam_id, []);
      groups.get(question.source_exam_id).push(question);
    }
    const savedAttempts = await Promise.all([...groups.entries()].map(([examId, questions]) =>
      api("/api/exam-attempts", {
        method: "POST",
        body: JSON.stringify({
          exam_id: examId,
          answers: questions.map((question) => ({
            question_id: question.id,
            chosen_option_id: grammarPractice.answers[question.id] || null,
          })),
        }),
      }, authToken).then(mapExamAttempt),
    ));
    const answers = savedAttempts.flatMap((attempt) => attempt.answers);
    setGrammarPractice((current) => ({
      ...current,
      finishedAttempt: {
        id: `grammar-${Date.now()}`,
        level,
        title: `${level} ${(PRACTICE_CATEGORIES[grammarPractice.config.category] || PRACTICE_CATEGORIES.grammar).label}专项练习`,
        correct: answers.filter((answer) => answer.isCorrect).length,
        total: answers.length,
        answers,
      },
    }));
    await refreshStudyData(level, authToken);
  }

  async function startWrongReview() {
    setError("");
    const quiz = await api(`/api/wrong-questions/quiz?level=${level}&limit=20`, {}, authToken);
    const source = {
      id: null,
      book_id: null,
      book_name: quiz.title,
      level,
      subject: "wrong_review",
      subjectLabel: "错题",
      categoryLabel: `${level} 错题`,
    };
    startSession(source, quiz, "wrong_review");
  }

  async function loadExam(examId, baseExam = null) {
    setError("");
    const numericExamId = Number(examId);
    const cached = readExamCache(currentUser.id, numericExamId);
    if (!cached.runId) {
      navigate(`/exams/${numericExamId}/start`, { replace: true });
      return;
    }
    const [detail, allQuestions, run] = await Promise.all([
      api(`/api/exams/${numericExamId}`, {}, authToken),
      api(`/api/exams/${numericExamId}/questions`, {}, authToken),
      api(`/api/exam-runs/${cached.runId}`, {}, authToken),
    ]);
    const exam = baseExam || exams.find((item) => item.id === numericExamId) || mapExam(detail);
    const questions = questionsForRunSection(allQuestions, run);
    const cachedIndex = Number.isInteger(cached.index) ? cached.index : 0;
    const restored = {
      exam: { ...exam, layers: detail.layers || [] },
      run,
      allQuestions,
      questions,
      index: Math.max(0, Math.min(questions.length - 1, cachedIndex)),
      answers: { ...(cached.answers || {}), ...(run.answers || {}) },
      finishedAttempt: null,
    };
    if (run.status === "completed") {
      clearExamCache(currentUser.id, numericExamId);
      await loadExamReview(numericExamId, run.attempt_id);
      navigate(`/exams/${numericExamId}/review/${run.attempt_id}`, { replace: true });
      return;
    }
    setExamSession(restored);
  }

  async function startExam(exam) {
    setExamSession({ exam, phase: "intro" });
    navigate(`/exams/${exam.id}/start`);
  }

  function resumeExam(exam, run) {
    writeExamCache(currentUser.id, exam.id, { runId: run.id, index: 0, answers: run.answers || {}, updatedAt: new Date().toISOString() });
    setExamSession(null);
    navigate(`/exams/${exam.id}`);
  }

  async function abandonExam(exam, run) {
    if (!window.confirm(`确定放弃 ${exam.title}？已完成的答案不会生成成绩。`)) return;
    await api(`/api/exam-runs/${run.id}/abandon`, { method: "POST" }, authToken);
    clearExamCache(currentUser.id, exam.id);
    setExamRuns((rows) => rows.filter((item) => item.id !== run.id));
  }

  async function loadExamIntro(examId) {
    const detail = await api(`/api/exams/${Number(examId)}`, {}, authToken);
    setExamSession({ exam: { ...mapExam(detail), layers: detail.layers || [] }, phase: "intro" });
  }

  async function beginExam() {
    const exam = examSession.exam;
    const [detail, allQuestions, run] = await Promise.all([
      api(`/api/exams/${exam.id}`, {}, authToken),
      api(`/api/exams/${exam.id}/questions`, {}, authToken),
      api(`/api/exam-runs?exam_id=${exam.id}`, { method: "POST" }, authToken),
    ]);
    const cached = readExamCache(currentUser.id, exam.id);
    const next = {
      exam: { ...exam, layers: detail.layers || [] }, run, allQuestions,
      questions: questionsForRunSection(allQuestions, run),
      index: 0, answers: { ...(cached.answers || {}), ...(run.answers || {}) }, finishedAttempt: null,
    };
    writeExamCache(currentUser.id, exam.id, { runId: run.id, index: 0, answers: next.answers, updatedAt: new Date().toISOString() });
    setExamSession(next);
    navigate(`/exams/${exam.id}`);
  }

  async function reviewExamAttempt(attempt) {
    await loadExamReview(attempt.examId, attempt.id, attempt);
    navigate(`/exams/${attempt.examId}/review/${attempt.id}`);
  }

  async function loadExamReview(examId, attemptId, baseAttempt = null) {
    setError("");
    const numericExamId = Number(examId);
    const numericAttemptId = Number(attemptId);
    const [detail, questions, attemptDetail] = await Promise.all([
      api(`/api/exams/${numericExamId}`, {}, authToken),
      api(`/api/exam-attempts/${numericAttemptId}/questions`, {}, authToken),
      api(`/api/exam-attempts/${numericAttemptId}`, {}, authToken),
    ]);
    const baseExam = exams.find((exam) => exam.id === numericExamId) || mapExam(detail);
    const finishedAttempt = mapExamAttempt(attemptDetail);
    setExamSession({
      exam: { ...baseExam, layers: detail.layers || [] },
      questions,
      index: 0,
      answers: {},
      finishedAttempt,
      reviewAttemptId: baseAttempt?.id || finishedAttempt.id,
    });
  }

  function startSession(source, quiz, mode) {
    setSelectedBook(source);
    setSession({
      userId: currentUser.id,
      book: source,
      title: quiz.title,
      questions: quiz.questions,
      index: 0,
      answers: [],
      chosen: null,
      checked: false,
      checkResult: null,
      mode,
      startedAt: new Date().toISOString(),
    });
    navigate("/quiz");
  }

  function resetToLibrary() {
    setSelectedBook(null);
    setSession(null);
    setExamSession(null);
    navigate("/");
  }

  function resetToExamList() {
    setSelectedBook(null);
    setSession(null);
    setExamSession(null);
    navigate("/exams");
  }

  function chooseOption(optionIndex) {
    if (!session || session.checked) return;
    setSession((current) => ({ ...current, chosen: optionIndex }));
  }

  async function checkAnswer() {
    if (!session || session.chosen === null) return;
    const question = session.questions[session.index];
    const chosenOption = question.options[session.chosen];
    const result = await api("/api/check-answer", {
      method: "POST",
      body: JSON.stringify({
        question_id: question.id,
        chosen_option_id: chosenOption.id,
      }),
    }, authToken);
    setSession((current) => ({
      ...current,
      checked: true,
      checkResult: result,
    }));
  }

  async function finishSession(finalAnswers) {
    const payload = {
      mode: session.mode,
      level: session.book.level,
      subject: session.book.subject,
      subject_label: session.book.subjectLabel,
      book_id: session.mode === "book" ? session.book.id : null,
      title: session.mode === "book" ? session.book.book_name : session.title,
      answers: finalAnswers.map((answer) => ({
        question_id: answer.questionId,
        chosen_option_id: answer.chosenOptionId,
      })),
    };
    const saved = mapAttempt(
      await api("/api/attempts", {
        method: "POST",
        body: JSON.stringify(payload),
      }, authToken),
    );
    await refreshStudyData(level, authToken);
    setSession((current) => ({ ...current, finishedAttempt: saved }));
  }

  async function applySession(session) {
    localStorage.setItem(SESSION_TOKEN_KEY, session.token);
    setAuthToken(session.token);
    setCurrentUser(session.user);
    setLevel(normalizeLevel(session.user?.current_level || readUserLevelCache(session.user?.id)));
    setSelectedBook(null);
    setSession(null);
    setExamSession(null);
    navigate("/");
  }

  async function chooseLevel(nextLevel) {
    const normalized = normalizeLevel(nextLevel);
    setLevel(normalized);
    if (currentUser) {
      writeUserLevelCache(currentUser.id, normalized);
      setCurrentUser((user) => user ? { ...user, current_level: normalized } : user);
    }
    if (!authToken || !currentUser || currentUser.current_level === normalized) return;

    try {
      const updatedUser = await api("/api/me/level", {
        method: "POST",
        body: JSON.stringify({ current_level: normalized }),
      }, authToken);
      setCurrentUser(updatedUser);
      writeUserLevelCache(updatedUser.id, updatedUser.current_level);
    } catch (err) {
      console.warn("Could not save current level to the API; using local cache.", err);
    }
  }

  async function login(form) {
    const session = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });
    await applySession(session);
  }

  async function registerUser(form) {
    return api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    }, authToken);
  }

  async function logout() {
    if (authToken) {
      await api("/api/auth/logout", { method: "POST" }, authToken).catch(() => null);
    }
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setAuthToken(null);
    setCurrentUser(null);
    setSelectedBook(null);
    setSession(null);
    setExamSession(null);
    setAttempts([]);
    setExamAttempts([]);
    setWrongItems([]);
    navigate("/");
  }

  async function chooseExamOption(questionId, optionId) {
    setExamSession((current) => {
      const next = {
        ...current,
        answers: { ...current.answers, [questionId]: optionId },
      };
      writeExamCache(currentUser.id, next.exam.id, {
        runId: next.run?.id,
        index: next.index,
        answers: next.answers,
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
    if (examSession?.run) {
      examSaveQueue.current = examSaveQueue.current.catch(() => null).then(() => api(`/api/exam-runs/${examSession.run.id}/answers/${questionId}`, {
          method: "PUT",
          body: JSON.stringify({ chosen_option_id: optionId }),
        }, authToken));
      const run = await examSaveQueue.current;
      setExamSession((current) => current ? ({ ...current, run }) : current);
    }
  }

  function moveExamQuestion(nextIndex) {
    setExamSession((current) => {
      const next = {
        ...current,
        index: Math.max(0, Math.min(current.questions.length - 1, nextIndex)),
      };
      writeExamCache(currentUser.id, next.exam.id, {
        runId: next.run?.id,
        index: next.index,
        answers: next.answers,
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  }

  async function saveCompletedExam(current) {
    const saved = mapExamAttempt(
      await api("/api/exam-attempts", {
        method: "POST",
        body: JSON.stringify({
          exam_id: current.exam.id,
          answers: current.allQuestions.map((question) => ({
            question_id: question.id,
            chosen_option_id: current.answers[question.id] || null,
          })),
        }),
      }, authToken),
    );
    await refreshStudyData(level, authToken);
    clearExamCache(currentUser.id, current.exam.id);
    setExamSession((session) => ({ ...session, finishedAttempt: saved, reviewAttemptId: saved.id }));
    navigate(`/exams/${current.exam.id}/review/${saved.id}`);
  }

  async function submitExam(timedOut = false) {
    if (!examSession?.run) return saveCompletedExam(examSession);
    const unanswered = examSession.questions.filter((question) => !examSession.answers[question.id]).length;
    if (!timedOut && !window.confirm(`本科还有 ${unanswered} 题未作答。提交后将锁定答案，不能返回修改。确定提交吗？`)) return;
    await examSaveQueue.current;
    const run = await api(`/api/exam-runs/${examSession.run.id}/section/complete`, { method: "POST" }, authToken);
    if (run.status === "completed") {
      clearExamCache(currentUser.id, examSession.exam.id);
      await refreshStudyData(level, authToken);
      await loadExamReview(examSession.exam.id, run.attempt_id);
      navigate(`/exams/${examSession.exam.id}/review/${run.attempt_id}`);
      return;
    }
    const next = { ...examSession, run, questions: questionsForRunSection(examSession.allQuestions, run), index: 0 };
    writeExamCache(currentUser.id, next.exam.id, { runId: run.id, index: 0, answers: next.answers, updatedAt: new Date().toISOString() });
    setExamSession(next);
  }

  async function startNextExamSection() {
    const run = await api(`/api/exam-runs/${examSession.run.id}/section/start`, { method: "POST" }, authToken);
    setExamSession((current) => ({ ...current, run, index: 0 }));
  }

  function nextQuestion() {
    const question = session.questions[session.index];
    const chosenOption = question.options[session.chosen];
    const answer = {
      questionId: question.id,
      stem: question.stem,
      chosenOptionId: chosenOption.id,
      chosenText: chosenOption.text,
      correctOptionId: session.checkResult.correct_option_id,
      answerText: session.checkResult.answer_text,
      isCorrect: session.checkResult.is_correct,
    };
    const finalAnswers = [...session.answers, answer];

    if (session.index === session.questions.length - 1) {
      finishSession(finalAnswers);
      return;
    }

    setSession((current) => ({
      ...current,
      index: current.index + 1,
      answers: finalAnswers,
      chosen: null,
      checked: false,
      checkResult: null,
    }));
  }

  if (loading) {
    return (
      <Shell>
        <div className="center-state">正在加载课程…</div>
      </Shell>
    );
  }

  if (!authToken || !currentUser) {
    return (
      <Shell>
        <LoginView onLogin={login} />
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="center-state error">{error}</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Routes>
        <Route path="/listening/:examId?/:questionId?" element={<Listening key={currentUser.id} userId={currentUser.id} token={authToken} globalLevel={level} />} />
        <Route
          path="/"
          element={(
            <LibraryView
              books={books}
              exams={exams}
              level={level}
              subject={subject}
              attempts={attempts}
              examAttempts={examAttempts}
              wrongItems={wrongItems}
              bookStats={bookStats}
              currentUser={currentUser}
              onLevel={chooseLevel}
              onSubject={setSubject}
              onStart={startBook}
              onMixedTest={startMixedTest}
              onOpenGrammarPractice={() => { setGrammarPractice(null); navigate("/grammar-practice"); }}
              onOpenVocabularyPractice={() => { setGrammarPractice(null); navigate("/vocabulary-practice"); }}
              onOpenReadingPractice={() => { setGrammarPractice(null); navigate("/reading-practice"); }}
              onOpenListening={() => navigate("/listening")}
              onOpenExamList={() => navigate("/exams")}
              onOpenVocabulary={() => navigate("/vocabulary")}
              onOpenWrongBook={() => navigate("/wrong")}
              onOpenUser={() => navigate("/user")}
            />
          )}
        />
        {Object.keys(PRACTICE_CATEGORIES).map((category) => (
          <Route
            key={category}
            path={`/${category}-practice`}
            element={grammarPractice?.finishedAttempt ? (
              <ExamResultView
                exam={grammarPractice.exam}
                attempt={grammarPractice.finishedAttempt}
                questions={grammarPractice.questions}
                practice
                practiceCategory={grammarPractice.config.category}
                onRepeat={() => setGrammarPractice(null)}
                onLibrary={resetToLibrary}
              />
            ) : grammarPractice ? (
              grammarPractice.config.mode === "random" ? (
                <RandomPracticeSessionView
                  session={grammarPractice}
                  onBack={() => setGrammarPractice(null)}
                  onChoose={chooseGrammarOption}
                  onMove={moveGrammarQuestion}
                  onSubmit={submitGrammarPractice}
                />
              ) : (
                <ExamSessionView
                  session={grammarPractice}
                  onBack={() => setGrammarPractice(null)}
                  onChoose={chooseGrammarOption}
                  onMove={moveGrammarQuestion}
                  onSubmit={submitGrammarPractice}
                />
              )
            ) : (
              <GrammarPracticeSetupView
                exams={exams}
                level={level}
                category={category}
                onBack={resetToLibrary}
                onStart={startGrammarPractice}
              />
            )}
          />
        ))}
        <Route
          path="/vocabulary"
          element={(
            <VocabularyView
              entries={vocabulary}
              stats={vocabularyStats}
              onBack={resetToLibrary}
              onReview={reviewVocabulary}
            />
          )}
        />
        <Route
          path="/quiz"
          element={
            session?.finishedAttempt ? (
              <ResultView
                attempt={session.finishedAttempt}
                onRepeat={() => (
                  session.mode === "mixed"
                    ? startMixedTest()
                    : session.mode === "wrong_review"
                      ? startWrongReview()
                      : startBook(session.book || selectedBook)
                )}
                onLibrary={resetToLibrary}
              />
            ) : session ? (
              <QuizView
                session={session}
                onBack={resetToLibrary}
                onChoose={chooseOption}
                onCheck={checkAnswer}
                onNext={nextQuestion}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/wrong"
          element={(
            <WrongBookView
              level={level}
              items={wrongItems}
              onBack={resetToLibrary}
              onReview={startWrongReview}
            />
          )}
        />
        <Route
          path="/user"
          element={(
            <UserView
              currentUser={currentUser}
              attempts={attempts}
              onBack={resetToLibrary}
              onLogout={logout}
              onRegisterUser={registerUser}
            />
          )}
        />
        <Route
          path="/exams"
          element={(
            <ExamListView
              exams={exams}
              level={level}
              examAttempts={examAttempts}
              examRuns={examRuns}
              onLevel={chooseLevel}
              onBack={resetToLibrary}
              onStartExam={startExam}
              onResumeExam={resumeExam}
              onAbandonExam={abandonExam}
              onReviewAttempt={reviewExamAttempt}
            />
          )}
        />
        <Route
          path="/exams/:examId/start"
          element={(
            <ExamIntroRoute
              examSession={examSession}
              onLoadIntro={loadExamIntro}
              onBack={resetToExamList}
              onStart={beginExam}
            />
          )}
        />
        <Route
          path="/exams/:examId"
          element={(
            <ExamRoute
              examSession={examSession}
              onLoadExam={loadExam}
              onBack={resetToExamList}
              onChoose={chooseExamOption}
              onMove={moveExamQuestion}
              onSubmit={submitExam}
              onStartNext={startNextExamSection}
              onRepeat={startExam}
            />
          )}
        />
        <Route
          path="/exams/:examId/review/:attemptId"
          element={(
            <ExamReviewRoute
              examSession={examSession}
              onLoadReview={loadExamReview}
              onBack={resetToExamList}
              onRepeat={startExam}
            />
          )}
        />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

function ExamRoute({
  examSession,
  onLoadExam,
  onBack,
  onChoose,
  onMove,
  onSubmit,
  onStartNext,
  onRepeat,
}) {
  const { examId } = useParams();
  const numericExamId = Number(examId);

  useEffect(() => {
    if (!Number.isFinite(numericExamId)) return;
    if (examSession?.exam?.id === numericExamId && !examSession?.finishedAttempt) return;
    onLoadExam(numericExamId);
  }, [numericExamId, examSession?.exam?.id, examSession?.finishedAttempt]);

  if (!Number.isFinite(numericExamId)) {
    return <Navigate to="/exams" replace />;
  }

  if (!examSession || examSession.exam.id !== numericExamId) {
    return <div className="center-state">正在加载试卷…</div>;
  }

  if (examSession.run?.status === "awaiting_section") {
    return <ExamSectionBreakView session={examSession} onStartNext={onStartNext} />;
  }

  if (!examSession.questions?.length) {
    return <div className="center-state error">当前科目没有可显示的题目。<button className="secondary-button" onClick={onBack} type="button">返回试卷列表</button></div>;
  }

  return (
    <ExamSessionView
      session={examSession}
      onBack={onBack}
      onChoose={onChoose}
      onMove={onMove}
      onSubmit={onSubmit}
    />
  );
}

function ExamIntroRoute({ examSession, onLoadIntro, onBack, onStart }) {
  const { examId } = useParams();
  const numericExamId = Number(examId);
  useEffect(() => {
    if (!Number.isFinite(numericExamId)) return;
    if (examSession?.exam?.id === numericExamId) return;
    onLoadIntro(numericExamId);
  }, [numericExamId, examSession?.exam?.id]);
  if (!Number.isFinite(numericExamId)) return <Navigate to="/exams" replace />;
  if (!examSession || examSession.exam.id !== numericExamId || examSession.phase !== "intro") return <div className="center-state">正在加载考试说明…</div>;
  return <ExamIntroView exam={examSession.exam} onBack={onBack} onStart={onStart} />;
}

function ExamReviewRoute({
  examSession,
  onLoadReview,
  onBack,
  onRepeat,
}) {
  const { examId, attemptId } = useParams();
  const numericExamId = Number(examId);
  const numericAttemptId = Number(attemptId);

  useEffect(() => {
    if (!Number.isFinite(numericExamId) || !Number.isFinite(numericAttemptId)) return;
    if (
      examSession?.exam?.id === numericExamId
      && examSession?.finishedAttempt
      && examSession?.reviewAttemptId === numericAttemptId
    ) {
      return;
    }
    onLoadReview(numericExamId, numericAttemptId);
  }, [numericExamId, numericAttemptId, examSession?.exam?.id, examSession?.reviewAttemptId]);

  if (!Number.isFinite(numericExamId) || !Number.isFinite(numericAttemptId)) {
    return <Navigate to="/exams" replace />;
  }

  if (
    !examSession
    || examSession.exam.id !== numericExamId
    || !examSession.finishedAttempt
    || examSession.reviewAttemptId !== numericAttemptId
  ) {
    return <div className="center-state">正在加载复习内容…</div>;
  }

  return (
    <ExamResultView
      exam={examSession.exam}
      attempt={examSession.finishedAttempt}
      questions={examSession.questions}
      onRepeat={() => onRepeat(examSession.exam)}
      onLibrary={onBack}
    />
  );
}



export default App;
