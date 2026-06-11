import React, { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  NotebookPen,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import {
  LEVELS,
  SUBJECTS,
  assetSrc,
  buildExamProblemSections,
  buildReviewProblemGroups,
  calculateExamScore,
  examPartLabel,
  examPassMark,
  examQuestionDisplayNumber,
  formatDate,
  groupQuestionsByPassage,
  groupReviewItemsByPassage,
  isListeningQuestion,
  isReadingQuestion,
  pct,
  subjectLabel,
} from "../lib/study";

export function Shell({ children }) {
  return (
    <main className="app-shell">
      <section className="app-frame">{children}</section>
    </main>
  );
}

export function LibraryView({
  books,
  exams,
  level,
  subject,
  attempts,
  examAttempts,
  wrongItems,
  bookStats,
  currentUser,
  onLevel,
  onSubject,
  onStart,
  onMixedTest,
  onOpenExamList,
  onOpenWrongBook,
  onOpenUser,
}) {
  const currentAttempts = attempts.filter(
    (item) => item.level === level && item.subject === subject,
  );
  const totalCorrect = currentAttempts.reduce((sum, item) => sum + item.correct, 0);
  const totalQuestions = currentAttempts.reduce((sum, item) => sum + item.total, 0);
  const currentSubjectLabel = subjectLabel(subject);
  const questionPool = books.reduce((sum, book) => sum + book.question_count, 0);
  const latestExamAttempt = examAttempts[0];

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">Japanese Study</div>
          <h1>JLPT トレーニング</h1>
        </div>
        <div className="top-actions">
          <div className="level-switch" role="tablist" aria-label="JLPT level">
            {LEVELS.map((item) => (
              <button
                key={item}
                className={level === item ? "active" : ""}
                onClick={() => onLevel(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <button className="wrong-icon-button" onClick={onOpenWrongBook} type="button" aria-label="Wrong book">
            <NotebookPen size={23} />
            {wrongItems.length ? <span className="wrong-badge">{wrongItems.length}</span> : null}
          </button>
          <button className="avatar-button" onClick={onOpenUser} type="button" aria-label="User profile">
            <span>{currentUser?.display_name?.slice(0, 1) || "D"}</span>
          </button>
        </div>
      </header>

      <section className="subject-tabs" role="tablist" aria-label="Question subject">
        {SUBJECTS.map((item) => (
          <button
            key={item.id}
            className={subject === item.id ? "active" : ""}
            onClick={() => onSubject(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="stats-strip" aria-label="study stats">
        <Metric icon={<BookOpen />} label="Books" value={books.length} />
        <Metric icon={<FileText />} label="Exams" value={exams.length} />
        <Metric icon={<History />} label="Attempts" value={currentAttempts.length} />
        <Metric
          icon={<Trophy />}
          label="Accuracy"
          value={`${pct(totalCorrect, totalQuestions)}%`}
        />
      </section>

      <section className="exam-entry-card">
        <div>
          <div className="section-title">
            <ClipboardList size={22} />
            <h2>模擬試験</h2>
          </div>
          <p>
            {exams.length
              ? `${level} 過去問 ${exams.length} 回分`
              : `${level} の試験データはまだありません`}
            {latestExamAttempt ? ` · 直近 ${pct(latestExamAttempt.correct, latestExamAttempt.total)}%` : ""}
          </p>
        </div>
        <button className="primary-button" onClick={onOpenExamList} type="button">
          試験ライブラリへ
          <ChevronRight size={20} />
        </button>
      </section>

      {questionPool ? (
        <section className="mixed-test-card">
          <div>
            <div className={`book-badge subject-${subject}`}>{level} {currentSubjectLabel}</div>
            <h2>総合テスト</h2>
            <p>現在のカテゴリから20問をランダムに出題します。問題と解答の順序は毎回再生成されます。</p>
          </div>
          <button className="primary-button" onClick={onMixedTest} type="button">
            Start 20
          </button>
        </section>
      ) : null}

      <section className="book-grid">
        {books.length ? books.map((book) => {
          const stats = bookStats.get(book.id);
          return (
            <article className="book-card" key={book.id}>
              <div className="book-card-main">
                <div className={`book-badge subject-${book.subject}`}>{book.categoryLabel}</div>
                <h2 className="book-display-number">{book.displayName}</h2>
                <div className="book-meta">
                  <span>{book.question_count} questions</span>
                  {stats ? <span>Best {stats.best}%</span> : <span>New</span>}
                </div>
                <Progress value={stats ? pct(stats.correct, stats.total) : 0} />
              </div>
              <button
                className="start-button"
                onClick={() => onStart(book)}
                type="button"
                aria-label={`Start ${book.book_name}`}
              >
                <ChevronRight size={24} />
              </button>
            </article>
          );
        }) : (
          <div className="empty-books">
            <strong>{level} {currentSubjectLabel}</strong>
            <span>このカテゴリの問題はまだありません。</span>
          </div>
        )}
      </section>

    </>
  );
}

export function ExamListView({ exams, level, examAttempts, onLevel, onBack, onStartExam, onReviewAttempt }) {
  const examStats = new Map<number, any>(examAttempts.map((attempt) => [attempt.examId, attempt]));

  return (
    <section className="exam-list-view">
      <header className="quiz-header">
        <button className="icon-button" onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div>
          <div className="eyebrow">Exam Library</div>
          <h1>模擬試験</h1>
        </div>
      </header>

      <div className="level-switch exam-level-switch" role="tablist" aria-label="JLPT level">
        {LEVELS.map((item) => (
          <button
            key={item}
            className={level === item ? "active" : ""}
            onClick={() => onLevel(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {exams.length ? (
        <div className="exam-list">
          {exams.map((exam) => {
            const last = examStats.get(exam.id);
            return (
              <article className="exam-card" key={exam.id}>
                <div>
                  <div className="book-badge subject-reading">{exam.level}</div>
                  <h3>{exam.title}</h3>
                  {last ? <p>直近 {pct(last.correct, last.total)}%</p> : null}
                </div>
                <div className="exam-card-actions">
                  {last ? (
                    <button className="secondary-button review-exam-button" onClick={() => onReviewAttempt(last)} type="button">
                      解説を見る
                    </button>
                  ) : null}
                  <button className="start-button" onClick={() => onStartExam(exam)} type="button" aria-label={`Start ${exam.title}`}>
                    <ChevronRight size={24} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-books">
          <strong>{level} 試験ライブラリ</strong>
          <span>このレベルの試験データはまだありません。</span>
        </div>
      )}
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      <span className="metric-icon">{icon}</span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}

function WrongBookEntry({ items, onOpen }) {
  return (
    <section className="wrong-entry">
      <div>
        <div className="section-title compact">
          <X size={22} />
          <h2>ミス問題ノート</h2>
        </div>
        <p>{items.length ? `${items.length} questions need review` : "No mistakes in this category yet."}</p>
      </div>
      <button className="secondary-button" onClick={onOpen} type="button" disabled={!items.length}>
        View
      </button>
    </section>
  );
}

export function WrongBookView({ level, items, onBack, onReview }) {
  return (
    <section className="wrong-page">
      <header className="quiz-header">
        <button className="icon-button" onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="wrong-page-title">
          <div className="book-pill subject-kanji">ミス問題ノート</div>
          <p>{level} · {items.length} questions</p>
        </div>
      </header>

      {items.length ? (
        <section className="wrong-review-card">
          <div>
            <div className="book-badge subject-kanji">{level} ミス問題</div>
            <h2>ミス問題復習</h2>
            <p>ミスした問題から最大20問をランダムに出題します。正解すると自動的にノートから外れます。</p>
          </div>
          <button className="primary-button" onClick={onReview} type="button">
            Review 20
          </button>
        </section>
      ) : null}

      {items.length ? (
        <div className="wrong-list">
          {items.map((item) => (
            <article className="wrong-item" key={item.key}>
              <div className="wrong-count">{item.wrongCount}</div>
              <div>
                <h3>{item.stem}</h3>
                <p>
                  Correct: <HtmlInline html={item.answerText} />
                  {item.lastChosenText ? <> / Last: <HtmlInline html={item.lastChosenText} /></> : ""}
                </p>
                <small>{item.subjectLabel} · {item.bookName}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-history">No mistakes in this category yet.</p>
      )}
    </section>
  );
}

export function LoginView({ users, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      if (mode === "login") {
        await onLogin({ username: username.trim(), password });
      } else {
        await onRegister({
          username: username.trim(),
          display_name: displayName.trim(),
          password,
        });
      }
    } catch (err) {
      setMessage("ログインに失敗しました。ユーザー名とパスワードを確認してください。");
    }
  }

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div>Japanese Study</div>
          <p>{mode === "login" ? "Log in to continue" : "Create a new study profile"}</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
            ログイン
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
            ユーザー追加
          </button>
        </div>

        <form className="new-user-form" onSubmit={submit}>
          {mode === "register" ? (
            <label>
              Display name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="例：David" />
            </label>
          ) : null}
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="例：david" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
          </label>
          {message ? <p className="form-error">{message}</p> : null}
          <button
            className="primary-button"
            type="submit"
            disabled={!username.trim() || !password || (mode === "register" && !displayName.trim())}
          >
            {mode === "login" ? "Login" : "Create and login"}
          </button>
        </form>

      </div>
    </section>
  );
}

export function UserView({ currentUser, attempts, onBack, onLogout }) {
  return (
    <section className="user-page">
      <header className="quiz-header">
        <button className="icon-button" onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="wrong-page-title">
          <div className="book-pill">Profile</div>
        </div>
      </header>

      <section className="profile-card">
        <div className="profile-avatar">
          <span>{currentUser?.display_name?.slice(0, 1) || "D"}</span>
        </div>
        <div>
          <h2>{currentUser?.display_name || "David"}</h2>
          <p>@{currentUser?.username || "david"}</p>
        </div>
      </section>

      <HistoryPanel attempts={attempts} />

      <button className="secondary-button logout-button" onClick={onLogout} type="button">
        Logout
      </button>
    </section>
  );
}

function Progress({ value }) {
  return (
    <div className="progress">
      <span style={{ width: `${Math.max(4, value)}%` }} />
    </div>
  );
}

function cleanHtml(html) {
  if (!html) return "";
  return String(html).replace(/<\/?MOJiTest_URL>/g, "");
}

function cleanInlineHtml(html) {
  return cleanHtml(html)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]*\n[ \t]*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function HtmlContent({ html }) {
  if (!html) return null;
  return <div className="html-content" dangerouslySetInnerHTML={{ __html: cleanHtml(html) }} />;
}

function InlineHtmlContent({ html }) {
  if (!html) return null;
  return <div className="html-content" dangerouslySetInnerHTML={{ __html: cleanInlineHtml(html) }} />;
}

function htmlParagraphs(html) {
  const cleaned = cleanHtml(html);
  if (!cleaned) return [];

  if (typeof DOMParser === "undefined") return [cleaned];

  const doc = new DOMParser().parseFromString(`<section>${cleaned}</section>`, "text/html");
  const paragraphs = Array.from(doc.body.querySelectorAll("p"))
    .map((node) => cleanHtml(node.innerHTML).trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : [cleaned];
}

function BilingualTranscript({ sourceHtml, translationHtml, variant = "listening" }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const sourceLines = htmlParagraphs(sourceHtml);
  const translationLines = htmlParagraphs(translationHtml);
  const maxLines = Math.max(sourceLines.length, showTranslation ? translationLines.length : 0);

  if (!maxLines) return null;

  return (
    <section className={`listening-transcript ${variant === "reading" ? "reading-transcript" : ""} ${showTranslation ? "with-translation" : ""}`}>
      {translationLines.length ? (
        <div className="bilingual-toolbar">
          <button className="bilingual-toggle" onClick={() => setShowTranslation((value) => !value)} type="button">
            {showTranslation ? "中文訳を隠す" : "中文訳を表示"}
          </button>
        </div>
      ) : null}
      {Array.from({ length: maxLines }).map((_, index) => (
        <div className="bilingual-line" key={`${index}-${sourceLines[index] || translationLines[index] || ""}`}>
          {sourceLines[index] ? <HtmlContent html={sourceLines[index]} /> : null}
          {showTranslation && translationLines[index] ? (
            <div className="translation-line">
              <HtmlContent html={translationLines[index]} />
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function HtmlInline({ html }) {
  if (!html) return null;
  return <span dangerouslySetInnerHTML={{ __html: cleanHtml(html) }} />;
}

export function ExamSessionView({ session, onBack, onChoose, onMove, onSubmit }) {
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const question = session.questions[session.index];
  const answeredCount = Object.keys(session.answers).length;
  const problemSections = buildExamProblemSections(session.exam, session.questions);
  const questionIndexById = new Map(session.questions.map((item, index) => [item.id, index]));
  const currentProblemIndex = Math.max(
    0,
    problemSections.findIndex((section) => section.questions.some((item) => item.id === question.id)),
  );
  const currentProblem = problemSections[currentProblemIndex] || problemSections[0];
  const canPrev = currentProblemIndex > 0;
  const canNext = currentProblemIndex < problemSections.length - 1;
  const answerParts = [];

  for (const section of problemSections) {
    const currentPart = answerParts[answerParts.length - 1];
    if (currentPart?.label === section.partLabel) {
      currentPart.sections.push(section);
    } else {
      answerParts.push({ label: section.partLabel, sections: [section] });
    }
  }

  function moveToProblem(problemIndex) {
    const target = problemSections[problemIndex];
    const firstQuestion = target?.questions[0];
    if (!firstQuestion) return;
    onMove(questionIndexById.get(firstQuestion.id) || 0);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  return (
    <div className="exam-view">
      <header className="quiz-header">
        <button className="icon-button" onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="quiz-progress">
          <Progress value={pct(answeredCount, session.questions.length)} />
          <span>{answeredCount} / {session.questions.length}</span>
        </div>
        <div className="exam-header-actions">
          <button className="secondary-button" onClick={() => setShowAnswerSheet((value) => !value)} type="button">
            <ClipboardList size={18} />
            解答シート
          </button>
          <button className="primary-button" onClick={onSubmit} type="button">
            Submit
          </button>
        </div>
      </header>

      <section className={`exam-layout ${showAnswerSheet ? "sheet-open" : ""}`}>
        {showAnswerSheet ? (
        <aside className="answer-sheet">
          <div className="book-pill subject-reading">{session.exam.level} · {session.exam.title}</div>
          <button className="answer-sheet-close" onClick={() => setShowAnswerSheet(false)} type="button">
            Close
          </button>
          <div className="answer-section-list">
            {answerParts.map((part) => (
              <section className="answer-part" key={part.label}>
                <div className="sheet-title">- {part.label} -</div>
                {part.sections.map((section) => {
                  const sectionIndex = problemSections.findIndex((item) => item.id === section.id);
                  const sectionAnswered = section.questions.filter((item) => session.answers[item.id]).length;
                  const activeSection = section.id === currentProblem?.id;
                  return (
                    <section className={`answer-section ${activeSection ? "active" : ""}`} key={section.id}>
                      <button
                        className="answer-section-title"
                        onClick={() => moveToProblem(sectionIndex)}
                        type="button"
                      >
                        <span>{section.problemLabel}</span>
                        <small>{sectionAnswered}/{section.questions.length}</small>
                      </button>
                      <div className="answer-grid">
                        {section.questions.map((item, sectionQuestionIndex) => {
                          const globalIndex = questionIndexById.get(item.id) || 0;
                          const displayNumber = examQuestionDisplayNumber(section, item, sectionQuestionIndex, questionIndexById);
                          return (
                            <button
                              key={item.id}
                              className={[
                                "answer-dot",
                                session.answers[item.id] ? "answered" : "",
                              ].join(" ")}
                              onClick={() => {
                                onMove(globalIndex);
                                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
                              }}
                              type="button"
                            >
                              {String(displayNumber).padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </section>
            ))}
          </div>
        </aside>
        ) : null}

        <section className="exam-question-panel">
          <div className="book-badge subject-reading">{currentProblem?.partLabel}</div>
          <div className="exam-question-head">
            <span>{currentProblem?.problemLabel.replace("問題", "")}</span>
            <p>{currentProblem?.layer.title}</p>
          </div>

          <section className="exam-problem-page">
            {groupQuestionsByPassage(currentProblem?.questions || []).map((group, groupIndex) => (
              <section className="exam-passage-group" key={`${currentProblem?.id}-${groupIndex}`}>
                {group.passage ? (
                  <section className="exam-passage">
                    <HtmlContent html={group.passage} />
                  </section>
                ) : null}
                {group.questions.map((item) => {
                  const globalIndex = questionIndexById.get(item.id) || 0;
                  const sectionQuestionIndex = Math.max(
                    0,
                    currentProblem?.questions.findIndex((question) => question.id === item.id) ?? 0,
                  );
                  const displayNumber = examQuestionDisplayNumber(currentProblem, item, sectionQuestionIndex, questionIndexById);
                  const chosenOptionId = session.answers[item.id] || null;
                  return (
                    <article className="exam-sub-question" key={item.id}>
                      <div className="exam-sub-question-title">
                        <span>{String(displayNumber).padStart(2, "0")}.</span>
                        <HtmlContent html={item.title} />
                      </div>

                      {item.media_url ? (
                        <audio className="exam-audio" controls src={assetSrc(item.media_url)} />
                      ) : null}

                      {item.image_url ? (
                        <img className="exam-image" src={assetSrc(item.image_url)} alt="" />
                      ) : null}

                      <section className="options-grid exam-options">
                        {item.options.map((option, index) => (
                          <button
                            key={`${item.id}-${option.id}`}
                            className={`option-button ${chosenOptionId === option.id ? "selected" : ""}`}
                            onClick={() => onChoose(item.id, option.id)}
                            type="button"
                          >
                            <span className="option-letter">{index + 1}</span>
                            <span><HtmlInline html={option.text} /></span>
                          </button>
                        ))}
                      </section>
                    </article>
                  );
                })}
              </section>
            ))}
          </section>

          <footer className="exam-nav">
            <button className="secondary-button" onClick={() => moveToProblem(currentProblemIndex - 1)} disabled={!canPrev} type="button">
              Prev
            </button>
            <button className="primary-button" onClick={() => moveToProblem(currentProblemIndex + 1)} disabled={!canNext} type="button">
              Next
            </button>
          </footer>
        </section>
      </section>
    </div>
  );
}

export function ExamResultView({ exam, attempt, questions, onRepeat, onLibrary }) {
  const score = pct(attempt.correct, attempt.total);
  const estimatedScore = calculateExamScore(attempt, questions);
  const questionById = new Map<number, any>(questions.map((question) => [question.id, question]));
  const answerByQuestion = new Map<number, any>(attempt.answers.map((answer) => [answer.questionId, answer]));
  const reviewProblemGroups = buildReviewProblemGroups(exam, questions);

  return (
    <section className="result-view exam-result-view">
      <div className="result-score">
        <Trophy size={54} />
        <h1>{score}%</h1>
        <p>{attempt.correct} / {attempt.total} correct · {attempt.title}</p>
      </div>

      <section className={`exam-score-summary ${estimatedScore.passed ? "passed" : "failed"}`}>
        <div>
          <span>概算スコア</span>
          <strong>{estimatedScore.totalScore} / 180</strong>
          <small>{estimatedScore.passed ? "合格見込み" : "不合格見込み"} · 合格ライン {estimatedScore.overallPassMark}</small>
        </div>
        <div>
          <span>言語知識・読解</span>
          <strong>{estimatedScore.languageReadingScore} / 120</strong>
          <small>{estimatedScore.languageReadingCorrect}/{estimatedScore.languageReadingTotal} · 目安 {estimatedScore.languageReadingPassMark}</small>
        </div>
        <div>
          <span>聴解</span>
          <strong>{estimatedScore.listeningScore} / 60</strong>
          <small>{estimatedScore.listeningCorrect}/{estimatedScore.listeningTotal} · 目安 {estimatedScore.listeningPassMark}</small>
        </div>
      </section>

      <div className="result-actions">
        <button className="primary-button" onClick={onRepeat} type="button">
          <RotateCcw size={20} />
          Repeat
        </button>
        <button className="secondary-button" onClick={onLibrary} type="button">
          Exam list
        </button>
      </div>

      <div className="result-review-layout">
        <aside className="review-jump-panel" aria-label="Review question navigation">
          <div className="review-jump-title">問題番号</div>
          {reviewProblemGroups.map((group) => (
            <section className="review-jump-section" key={group.label}>
              <div className="review-jump-group-title">{group.label}</div>
              {group.sections.map((section) => (
                <section className="review-jump-problem" key={section.id}>
                  <div className="review-jump-problem-title">{section.problemLabel}</div>
                  <div className="review-jump-grid">
                    {section.items.map(({ question, index, displayNumber }) => {
                      const answer = answerByQuestion.get(question.id);
                      return (
                        <button
                          key={question.id}
                          aria-label={`${group.label} ${section.problemLabel} ${displayNumber}番`}
                          className={[
                            "review-jump-dot",
                            answer?.isCorrect ? "right" : "miss",
                          ].join(" ")}
                          onClick={() => document.getElementById(`exam-review-${question.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          type="button"
                        >
                          {displayNumber}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </section>
          ))}
        </aside>

        <section className="review-list">
          {reviewProblemGroups.map((group) => (
            <section className="review-part-block" key={group.label}>
              <div className="review-part-heading">{group.label}</div>
              {group.sections.map((section) => (
                <section className="review-problem-block" key={section.id}>
                  <div className="review-problem-heading">{section.problemLabel}</div>
                  {groupReviewItemsByPassage(section.items).map((passageGroup, passageGroupIndex) => (
                    <section
                      className={`review-passage-group ${passageGroup.passage ? "has-shared-passage" : "single-question-group"}`}
                      key={`${section.id}-${passageGroup.key}-${passageGroupIndex}`}
                    >
                      {passageGroup.passage && isReadingQuestion(passageGroup.question) ? (
                        <BilingualTranscript
                          sourceHtml={passageGroup.passage}
                          translationHtml={passageGroup.translation}
                          variant="reading"
                        />
                      ) : null}
                      {passageGroup.passage && !isReadingQuestion(passageGroup.question) ? (
                        <section className="review-shared-passage">
                          <HtmlContent html={passageGroup.passage} />
                        </section>
                      ) : null}
                      {passageGroup.passage && !isListeningQuestion(passageGroup.question) && !isReadingQuestion(passageGroup.question) && passageGroup.translation ? (
                        <section className="translation-block">
                          <HtmlContent html={passageGroup.translation} />
                        </section>
                      ) : null}
                      {passageGroup.items.map(({ question, index, displayNumber }) => {
                    const answer = answerByQuestion.get(question.id);
                    if (!answer) return null;
                    return (
              <article className="review-item exam-review-item" id={`exam-review-${answer.questionId}`} key={`${answer.questionId}-${index}`}>
                <div className={answer.isCorrect ? "review-mark right" : "review-mark miss"}>
                  {answer.isCorrect ? <Check size={18} /> : <X size={18} />}
                </div>
                <div>
                  <div className="review-title-row">
                    <span className="review-question-number">{displayNumber}</span>
                    <div className="review-title"><HtmlContent html={answer.title || question?.title || ""} /></div>
                  </div>
                  {question?.image_url ? <img className="review-image" src={assetSrc(question.image_url)} alt="" /> : null}
                  {question?.media_url ? (
                    <audio className="exam-audio compact" controls src={assetSrc(question.media_url)} />
                  ) : null}
                  {isListeningQuestion(question) && (question?.subtitle || question?.translation) ? (
                    <BilingualTranscript
                      sourceHtml={question.subtitle}
                      translationHtml={question.translation}
                    />
                  ) : null}
                  {!passageGroup.passage && isReadingQuestion(question) && (question?.passage || question?.translation) ? (
                    <BilingualTranscript
                      sourceHtml={question.passage}
                      translationHtml={question.translation}
                      variant="reading"
                    />
                  ) : null}
                  {!passageGroup.passage && !isReadingQuestion(question) && question?.passage ? <HtmlContent html={question.passage} /> : null}
                  {question?.options?.length ? (
                    <section className="review-options" aria-label={`${index + 1}番の選択肢`}>
                      {question.options.map((option, optionIndex) => {
                        const isChosen = answer.chosenOptionId === option.id;
                        const isCorrectOption = answer.correctOptionId === option.id;
                        return (
                          <div
                            className={[
                              "review-option",
                              isCorrectOption ? "correct" : "",
                              isChosen && !isCorrectOption ? "chosen-wrong" : "",
                              isChosen && isCorrectOption ? "chosen-correct" : "",
                            ].join(" ")}
                            key={`${answer.questionId}-${option.id}`}
                          >
                            <span className="review-option-number">{optionIndex + 1}</span>
                            <span className="review-option-text"><HtmlInline html={option.text} /></span>
                          </div>
                        );
                      })}
                    </section>
                  ) : null}
                  {answer.analysis ? (
                    <section className="analysis-text">
                      <InlineHtmlContent html={answer.analysis} />
                    </section>
                  ) : null}
                  {!passageGroup.passage && !isListeningQuestion(question) && !isReadingQuestion(question) && question?.translation ? (
                    <section className="translation-block">
                      <HtmlContent html={question.translation} />
                    </section>
                  ) : null}
                </div>
              </article>
                    );
                      })}
                    </section>
                  ))}
                </section>
              ))}
            </section>
          ))}
        </section>
      </div>
    </section>
  );
}

export function QuizView({ session, onBack, onChoose, onCheck, onNext }) {
  const question = session.questions[session.index];
  const progress = pct(session.index + (session.checked ? 1 : 0), session.questions.length);
  const isCorrect = Boolean(session.checkResult?.is_correct);

  return (
    <div className="quiz-view">
      <header className="quiz-header">
        <button className="icon-button" onClick={onBack} type="button" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="quiz-progress">
          <Progress value={progress} />
          <span>
            {session.index + 1} / {session.questions.length}
          </span>
        </div>
      </header>

      <section className="question-area">
        <div className={`book-pill subject-${session.book.subject}`}>
          {session.book.categoryLabel} · {session.book.book_name}
        </div>
        <h2>{question.stem}</h2>
      </section>

      <section className="options-grid">
        {question.options.map((option, index) => {
          const selected = session.chosen === index;
          const answer = session.checkResult?.correct_option_id === option.id;
          const stateClass = session.checked
            ? answer
              ? "correct"
              : selected
                ? "wrong"
                : ""
            : selected
              ? "selected"
              : "";

          return (
            <button
              key={`${question.id}-${option.id}`}
              className={`option-button ${stateClass}`}
              onClick={() => onChoose(index)}
              type="button"
            >
              <span className="option-letter">{index + 1}</span>
              <span><HtmlInline html={option.text} /></span>
              {session.checked && answer ? <Check size={20} /> : null}
              {session.checked && selected && !answer ? <X size={20} /> : null}
            </button>
          );
        })}
      </section>

      <footer className={`answer-dock ${session.checked ? (isCorrect ? "yes" : "no") : ""}`}>
        {session.checked ? (
          <div className="feedback">
            <strong>{isCorrect ? "Correct!" : "Answer"}</strong>
            <span><HtmlInline html={session.checkResult.answer_text} /></span>
          </div>
        ) : (
          <div className="feedback muted">
            <strong>Choose one</strong>
            <span>{session.mode === "mixed" ? "Mixed test, 20 questions" : "Book practice, 10 questions"}</span>
          </div>
        )}
        {session.checked ? (
          <button className="primary-button" onClick={onNext} type="button">
            {session.index === session.questions.length - 1 ? "Finish" : "Next"}
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={session.chosen === null}
            onClick={onCheck}
            type="button"
          >
            Check
          </button>
        )}
      </footer>
    </div>
  );
}

export function ResultView({ attempt, onRepeat, onLibrary }) {
  const score = pct(attempt.correct, attempt.total);
  return (
    <section className="result-view">
      <div className="result-score">
        <Trophy size={54} />
        <h1>{score}%</h1>
        <p>
          {attempt.correct} / {attempt.total} correct
        </p>
      </div>

      <div className="result-actions">
        <button className="primary-button" onClick={onRepeat} type="button">
          <RotateCcw size={20} />
          Repeat
        </button>
        <button className="secondary-button" onClick={onLibrary} type="button">
          Choose book
        </button>
      </div>

      <section className="review-list">
        {attempt.answers.map((answer, index) => (
          <article className="review-item" key={`${answer.questionId}-${index}`}>
            <div className={answer.isCorrect ? "review-mark right" : "review-mark miss"}>
              {answer.isCorrect ? <Check size={18} /> : <X size={18} />}
            </div>
            <div>
              <h3>{answer.stem}</h3>
              {answer.options?.length ? (
                <section className="review-options" aria-label={`${index + 1}番の選択肢`}>
                  {answer.options.map((option, optionIndex) => {
                    const isChosen = answer.chosenOptionId === option.id;
                    const isCorrectOption = answer.correctOptionId === option.id;
                    return (
                      <div
                        className={[
                          "review-option",
                          isCorrectOption ? "correct" : "",
                          isChosen && !isCorrectOption ? "chosen-wrong" : "",
                          isChosen && isCorrectOption ? "chosen-correct" : "",
                        ].join(" ")}
                        key={`${answer.questionId}-${option.id}`}
                      >
                        <span className="review-option-number">{optionIndex + 1}</span>
                        <span className="review-option-text"><HtmlInline html={option.text} /></span>
                      </div>
                    );
                  })}
                </section>
              ) : (
                <p>
                  Your answer: {answer.chosenText ? <HtmlInline html={answer.chosenText} /> : "-"} / Correct: <HtmlInline html={answer.answerText} />
                </p>
              )}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

function HistoryPanel({ attempts }) {
  const recent = attempts.slice(0, 8);
  return (
    <section className="history-panel">
      <div className="section-title">
        <BarChart3 size={22} />
        <h2>最近の履歴</h2>
      </div>
      {recent.length ? (
        <div className="history-list">
          {recent.map((attempt) => (
            <div className="history-row" key={attempt.id}>
              <span className="history-book">{attempt.bookName}</span>
              <span>{attempt.categoryLabel || attempt.level}</span>
              <span>{pct(attempt.correct, attempt.total)}%</span>
              <span>{formatDate(attempt.createdAt)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-history">まだ履歴はありません。</p>
      )}
    </section>
  );
}
