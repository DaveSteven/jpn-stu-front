import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  Headphones,
  Languages,
  Layers3,
  NotebookPen,
  RotateCcw,
  Search,
  Target,
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
  examQuestionCategoryLabel,
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
  onOpenGrammarPractice,
  onOpenVocabularyPractice,
  onOpenReadingPractice,
  onOpenExamList,
  onOpenListening,
  onOpenVocabulary,
  onOpenWrongBook,
  onOpenUser,
}) {
  const currentAttempts = attempts.filter(
    (item) => item.level === level && item.subject === subject,
  );
  const totalCorrect = currentAttempts.reduce(
    (sum, item) => sum + item.correct,
    0,
  );
  const totalQuestions = currentAttempts.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const currentSubjectLabel = subjectLabel(subject);
  const questionPool = books.reduce(
    (sum, book) => sum + book.question_count,
    0,
  );
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
          <button
            className="wrong-icon-button"
            onClick={onOpenWrongBook}
            type="button"
            aria-label="Wrong book"
          >
            <NotebookPen size={23} />
            {wrongItems.length ? (
              <span className="wrong-badge">{wrongItems.length}</span>
            ) : null}
          </button>
          <button
            className="avatar-button"
            onClick={onOpenUser}
            type="button"
            aria-label="User profile"
          >
            <span>{currentUser?.display_name?.slice(0, 1) || "D"}</span>
          </button>
        </div>
      </header>

      {questionPool ? (
        <section className="home-continue-card">
          <div>
            <div className="eyebrow">今日のおすすめ</div>
            <h2>{level} {currentSubjectLabel} ランダム練習</h2>
            <p>現在のカテゴリから20問。問題と選択肢は毎回シャッフルされます。</p>
          </div>
          <button className="primary-button" onClick={onMixedTest} type="button">
            20問を始める <ArrowRight size={19} />
          </button>
        </section>
      ) : null}

      <section className="home-section">
        <div className="home-section-heading">
          <div><h2>开始练习</h2><p>选择专项训练，或进行完整模拟考试</p></div>
        </div>
        <div className="home-module-grid">
          <article className="home-training-module featured">
            <div className="home-module-heading"><div><Target size={25} /><span><strong>专项练习</strong><small>针对不同能力单独强化</small></span></div><em>推荐</em></div>
            <div className="home-module-actions">
              <button onClick={onOpenVocabularyPractice} disabled={!exams.length} type="button"><Languages size={22} /><span><strong>文字词汇专项</strong><small>读音、词义和用法强化</small></span><ChevronRight size={19} /></button>
              <button onClick={onOpenGrammarPractice} disabled={!exams.length} type="button"><BrainCircuit size={22} /><span><strong>文法专项</strong><small>按题型、试卷和题量组题</small></span><ChevronRight size={19} /></button>
              <button onClick={onOpenReadingPractice} disabled={!exams.length} type="button"><BookOpen size={22} /><span><strong>读解专项</strong><small>短篇、长篇和信息检索</small></span><ChevronRight size={19} /></button>
              <button onClick={onOpenListening} type="button"><Headphones size={22} /><span><strong>听力专项</strong><small>按试卷逐题精听与循环</small></span><ChevronRight size={19} /></button>
            </div>
          </article>
          <article className="home-training-module exam-module">
            <div className="home-module-heading"><div><ClipboardList size={25} /><span><strong>模拟考试</strong><small>按照正式考试结构完成整套试卷</small></span></div></div>
            <div className="home-exam-summary"><strong>{exams.length}</strong><span>{level} 历年试卷</span>{latestExamAttempt ? <small>最近成绩 {pct(latestExamAttempt.correct, latestExamAttempt.total)}%</small> : <small>尚未参加考试</small>}</div>
            <button className="primary-button" onClick={onOpenExamList} type="button">选择模拟试卷 <ArrowRight size={19} /></button>
          </article>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <div><h2>基础题库</h2><p>选择知识领域后，按课练习</p></div>
        </div>
        <div className="subject-library-tabs" role="tablist" aria-label="Question subject">
          {SUBJECTS.map((item, index) => {
            const Icon = [BrainCircuit, BookOpen, Layers3][index];
            return (
              <button key={item.id} className={subject === item.id ? `active subject-${item.id}` : ""} onClick={() => onSubject(item.id)} type="button">
                <Icon size={21} /><strong>{item.label}</strong>{subject === item.id ? <span>{questionPool}题</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="home-library-heading">
        <div><span className={`book-badge subject-${subject}`}>{level} {currentSubjectLabel}</span><h2>课程练习</h2></div>
        <span>{books.length} 册 · {questionPool} 题</span>
      </div>
      <section className="book-grid home-book-grid">
        {books.length ? (
          books.map((book) => {
            const stats = bookStats.get(book.id);
            return (
              <article className="book-card" key={book.id}>
                <div className="book-card-main">
                  <div className={`book-badge subject-${book.subject}`}>
                    {book.categoryLabel}
                  </div>
                  <h2 className="book-display-number">{book.displayName}</h2>
                  <div className="book-meta">
                    <span>{book.question_count} questions</span>
                    {stats ? <span>Best {stats.best}%</span> : <span>New</span>}
                  </div>
                  <Progress
                    value={stats ? pct(stats.correct, stats.total) : 0}
                  />
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
          })
        ) : (
          <div className="empty-books">
            <strong>
              {level} {currentSubjectLabel}
            </strong>
            <span>このカテゴリの問題はまだありません。</span>
          </div>
        )}
      </section>

      <section className="home-review-grid">
        <div className="home-study-summary">
          <small>当前分类</small><strong>{pct(totalCorrect, totalQuestions)}%</strong><span>{currentAttempts.length} 次练习</span>
        </div>
        <button onClick={onOpenWrongBook} type="button"><RotateCcw size={22} /><span><strong>错题复习</strong><small>{wrongItems.length ? `${wrongItems.length} 题待复习` : "暂无错题"}</small></span><ChevronRight size={20} /></button>
        <button onClick={onOpenUser} type="button"><History size={22} /><span><strong>学习记录</strong><small>查看成绩与练习历史</small></span><ChevronRight size={20} /></button>
      </section>
    </>
  );
}

export function ExamListView({
  exams,
  level,
  examAttempts,
  onLevel,
  onBack,
  onStartExam,
  onReviewAttempt,
}) {
  const examStats = new Map<number, any>(
    examAttempts.map((attempt) => [attempt.examId, attempt]),
  );

  return (
    <section className="exam-list-view">
      <header className="quiz-header">
        <button
          className="icon-button"
          onClick={onBack}
          type="button"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <div className="eyebrow">Exam Library</div>
          <h1>模擬試験</h1>
        </div>
      </header>

      <div
        className="level-switch exam-level-switch"
        role="tablist"
        aria-label="JLPT level"
      >
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
                    <button
                      className="secondary-button review-exam-button"
                      onClick={() => onReviewAttempt(last)}
                      type="button"
                    >
                      解説を見る
                    </button>
                  ) : null}
                  <button
                    className="start-button"
                    onClick={() => onStartExam(exam)}
                    type="button"
                    aria-label={`Start ${exam.title}`}
                  >
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

export const PRACTICE_CATEGORIES = {
  vocabulary: {
    label: "文字词汇",
    eyebrow: "Vocabulary Practice",
    types: [
      { id: 11, label: "汉字读音", description: "选择汉字的正确读音" },
      { id: 12, label: "汉字书写", description: "选择假名对应的正确汉字" },
      { id: 13, label: "词语构成", description: "选择符合构词规则的表达" },
      { id: 14, label: "语境填空", description: "根据句子语境选择词语" },
      { id: 15, label: "近义替换", description: "选择意义最接近的表达" },
      { id: 16, label: "词语用法", description: "判断词语使用正确的句子" },
    ],
  },
  grammar: {
    label: "文法",
    eyebrow: "Grammar Practice",
    types: [
      { id: 21, label: "文法填空", description: "选择最适合句中空格的表达" },
      { id: 22, label: "句子排序", description: "判断 ★ 位置应放入的内容" },
      { id: 23, label: "文章填空", description: "结合整篇文章选择合适表达" },
    ],
  },
  reading: {
    label: "读解",
    eyebrow: "Reading Practice",
    types: [
      { id: 31, label: "短篇理解", description: "阅读短文并回答问题" },
      { id: 32, label: "中篇理解", description: "理解文章结构和主要内容" },
      { id: 33, label: "对比阅读", description: "比较两篇文章或不同观点" },
      { id: 34, label: "综合理解", description: "综合分析文章内容" },
      { id: 35, label: "长篇理解", description: "阅读长文并理解作者意图" },
      { id: 36, label: "信息检索", description: "从通知和资料中查找信息" },
    ],
  },
};

export function GrammarPracticeSetupView({ exams, level, category = "grammar", onBack, onStart }) {
  const practiceCategory = PRACTICE_CATEGORIES[category] || PRACTICE_CATEGORIES.grammar;
  const [mode, setMode] = useState("random");
  const [examId, setExamId] = useState(exams[0]?.id ? String(exams[0].id) : "");
  const [types, setTypes] = useState(practiceCategory.types.map((type) => type.id));
  const [count, setCount] = useState(20);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  function toggleType(type) {
    setTypes((current) => current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type]);
  }

  async function submit(event) {
    event.preventDefault();
    if (!types.length || (mode === "exam" && !examId)) return;
    setStarting(true);
    setMessage("");
    try {
      await onStart({ mode, examId, types, category, count: Math.max(1, Math.min(100, Number(count) || 20)) });
    } catch (error) {
      setMessage(error.message || "专项题目加载失败，请稍后重试");
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="grammar-practice-setup">
      <header className="quiz-header">
        <button className="icon-button" onClick={onBack} type="button" aria-label="Back"><ArrowLeft size={22} /></button>
        <div className="grammar-practice-title"><div className="eyebrow">{practiceCategory.eyebrow}</div><h1>{level} {practiceCategory.label}专项</h1><p>按需要组合题型、来源和练习数量</p></div>
      </header>

      <form onSubmit={submit}>
        <section className="practice-config-section">
          <div className="practice-config-heading"><span>1</span><div><h2>选择题目来源</h2><p>可以指定一张试卷，也可以跨试卷随机抽题</p></div></div>
          <div className="practice-source-grid">
            <label className={mode === "random" ? "selected" : ""}><input type="radio" name="source" checked={mode === "random"} onChange={() => setMode("random")} /><Target size={23} /><span><strong>全部试卷随机</strong><small>从 {level} 历年试卷中打乱抽取</small></span></label>
            <label className={mode === "exam" ? "selected" : ""}><input type="radio" name="source" checked={mode === "exam"} onChange={() => setMode("exam")} /><ClipboardList size={23} /><span><strong>指定试卷</strong><small>只练习一张试卷中的{practiceCategory.label}题</small></span></label>
          </div>
          {mode === "exam" ? <select className="practice-exam-select" value={examId} onChange={(event) => setExamId(event.target.value)}>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select> : null}
        </section>

        <section className="practice-config-section">
          <div className="practice-config-heading"><span>2</span><div><h2>选择{practiceCategory.label}题型</h2><p>可同时选择多种题型</p></div></div>
          <div className="practice-type-grid">
            {practiceCategory.types.map((item) => <label className={types.includes(item.id) ? "selected" : ""} key={item.id}><input type="checkbox" checked={types.includes(item.id)} onChange={() => toggleType(item.id)} /><Check size={20} /><span><strong>{item.label}</strong><small>{item.description}</small></span></label>)}
          </div>
        </section>

        {mode === "random" ? (
          <section className="practice-config-section practice-count-section">
            <div className="practice-config-heading"><span>3</span><div><h2>设置题目数量</h2><p>实际题量不会超过所选范围内的可用题目</p></div></div>
            <div className="practice-count-options">{[5, 10, 20, 30].map((value) => <button className={count === value ? "selected" : ""} onClick={() => setCount(value)} type="button" key={value}>{value}题</button>)}<label><input type="number" min="1" max="100" value={count} onChange={(event) => setCount(Number(event.target.value))} /><span>题</span></label></div>
          </section>
        ) : null}

        {message ? <p className="form-error" role="alert">{message}</p> : null}
        <div className="practice-start-bar"><div><strong>{types.length} 种题型 · {mode === "random" ? `${count || 0} 题` : "全部匹配题目"}</strong><span>{mode === "random" ? `${level} 全部试卷随机` : exams.find((exam) => String(exam.id) === examId)?.title}</span></div><button className="primary-button" disabled={!types.length || !exams.length || starting} type="submit">{starting ? "正在组题…" : "开始专项练习"} {!starting ? <ArrowRight size={19} /> : null}</button></div>
      </form>
    </section>
  );
}

const VOCABULARY_POS = {
  noun: "名詞",
  verb: "動詞",
  adverb: "副詞",
};

const VOCABULARY_STATUS = {
  new: "未学習",
  learning: "学習中",
  mastered: "習得済み",
};

const TRANSITIVITY_LABEL = {
  transitive: "他動詞",
  intransitive: "自動詞",
  both: "自他両用",
};

const RELATION_LABEL = {
  synonym: "類義語",
  antonym: "反義語",
  related: "関連語",
};

export function VocabularyView({ entries, stats, onBack, onReview }) {
  const [lesson, setLesson] = useState("all");
  const [partOfSpeech, setPartOfSpeech] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        const normalizedQuery = query.trim().toLowerCase();
        return (
          (lesson === "all" || entry.lesson === Number(lesson)) &&
          (partOfSpeech === "all" || entry.part_of_speech === partOfSpeech) &&
          (status === "all" || entry.study_status === status) &&
          (!normalizedQuery ||
            [
              entry.word,
              entry.reading_hiragana,
              entry.reading_katakana,
              entry.meaning_zh,
            ].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(normalizedQuery),
            ))
        );
      }),
    [entries, lesson, partOfSpeech, status, query],
  );

  const currentIndex = filtered.length ? index % filtered.length : 0;
  const entry = filtered[currentIndex];

  function updateFilter(setter, value) {
    setter(value);
    setIndex(0);
    setRevealed(false);
  }

  function move(step) {
    if (!filtered.length) return;
    setIndex((value) => (value + step + filtered.length) % filtered.length);
    setRevealed(false);
  }

  async function review(remembered) {
    if (!entry || saving) return;
    setSaving(true);
    try {
      await onReview(entry.id, remembered);
      move(1);
    } finally {
      setSaving(false);
    }
  }

  const groupedRelations: Record<string, any[]> = entry
    ? (entry.relations || []).reduce((groups, item) => {
        if (!groups[item.type]) groups[item.type] = [];
        groups[item.type].push(item);
        return groups;
      }, {})
    : {};

  return (
    <section className="vocabulary-page">
      <header className="quiz-header vocabulary-header">
        <button
          className="icon-button"
          onClick={onBack}
          type="button"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="vocabulary-title">
          <div className="eyebrow">Vocabulary Deck</div>
          <h1>高頻単語帳</h1>
          <p>新標日中級上・三円単語</p>
        </div>
      </header>

      <section className="vocabulary-stats" aria-label="Vocabulary progress">
        <div>
          <strong>{stats.total}</strong>
          <span>単語</span>
        </div>
        <div>
          <strong>{stats.new}</strong>
          <span>未学習</span>
        </div>
        <div>
          <strong>{stats.learning}</strong>
          <span>学習中</span>
        </div>
        <div>
          <strong>{stats.mastered}</strong>
          <span>習得済み</span>
        </div>
      </section>

      <section className="vocabulary-filters">
        <label className="vocabulary-search">
          <Search size={19} />
          <input
            value={query}
            onChange={(event) => updateFilter(setQuery, event.target.value)}
            placeholder="単語・読み・中国語で検索"
          />
        </label>
        <select
          value={lesson}
          onChange={(event) => updateFilter(setLesson, event.target.value)}
        >
          <option value="all">全16課</option>
          {Array.from({ length: 16 }, (_, value) => value + 1).map((value) => (
            <option key={value} value={value}>
              第{value}課
            </option>
          ))}
        </select>
        <select
          value={partOfSpeech}
          onChange={(event) =>
            updateFilter(setPartOfSpeech, event.target.value)
          }
        >
          <option value="all">全品詞</option>
          <option value="noun">名詞</option>
          <option value="verb">動詞</option>
          <option value="adverb">副詞</option>
        </select>
        <select
          value={status}
          onChange={(event) => updateFilter(setStatus, event.target.value)}
        >
          <option value="all">全進捗</option>
          <option value="new">未学習</option>
          <option value="learning">学習中</option>
          <option value="mastered">習得済み</option>
        </select>
      </section>

      {entry ? (
        <>
          <article className={`vocabulary-card ${revealed ? "revealed" : ""}`}>
            <div className="vocabulary-card-meta">
              <span
                className={`vocabulary-status status-${entry.study_status}`}
              >
                {VOCABULARY_STATUS[entry.study_status]}
              </span>
            </div>
            <div className="vocabulary-word-block">
              <h2>{entry.word}</h2>
              <div>
                {VOCABULARY_POS[entry.part_of_speech]}
                {entry.transitivity
                  ? ` · ${TRANSITIVITY_LABEL[entry.transitivity]}`
                  : ""}
              </div>
              <div className="vocabulary-readings">
                <span>{entry.reading_hiragana}</span>
                <span>{entry.reading_katakana}</span>
              </div>
            </div>

            {revealed ? (
              <div className="vocabulary-details">
                <section className="vocabulary-meaning">
                  <span>意味</span>
                  <strong>{entry.meaning_zh}</strong>
                </section>

                {Object.entries(groupedRelations).map(([type, items]) => (
                  <section className="vocabulary-detail-section" key={type}>
                    <h3>{RELATION_LABEL[type] || "関連語"}</h3>
                    <div className="vocabulary-tags">
                      {items.map((item, itemIndex) => (
                        <span
                          className={
                            item.term === "無自然対応"
                              ? "no-natural-relation"
                              : ""
                          }
                          key={`${item.term}-${itemIndex}`}
                        >
                          {item.term === "無自然対応"
                            ? "自然な対応語なし"
                            : item.term}
                          {item.term_reading_katakana ? (
                            <small>{item.term_reading_katakana}</small>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </section>
                ))}

                {entry.collocations?.length ? (
                  <section className="vocabulary-detail-section">
                    <h3>固定搭配</h3>
                    <div className="vocabulary-tags collocation-tags">
                      {entry.collocations.map((item, itemIndex) => (
                        <span key={`${item}-${itemIndex}`}>{item}</span>
                      ))}
                    </div>
                  </section>
                ) : null}

                {entry.examples?.length ? (
                  <section className="vocabulary-detail-section">
                    <h3>例文</h3>
                    <ul className="vocabulary-examples">
                      {entry.examples.map((item, itemIndex) => {
                        const sentence =
                          typeof item === "string" ? item : item.sentence;
                        const reading =
                          typeof item === "string" ? "" : item.reading_katakana;
                        return (
                          <li key={`${sentence}-${itemIndex}`}>
                            <strong>{sentence}</strong>
                            {reading ? <small>{reading}</small> : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : (
              <button
                className="reveal-vocabulary"
                type="button"
                onClick={() => setRevealed(true)}
              >
                意味を見る
              </button>
            )}
          </article>

          <div className="vocabulary-card-footer">
            <button
              className="secondary-button"
              onClick={() => move(-1)}
              type="button"
            >
              前へ
            </button>
            <span>
              {currentIndex + 1} / {filtered.length}
            </span>
            {revealed ? (
              <div className="vocabulary-review-actions">
                <button
                  className="review-again"
                  disabled={saving}
                  onClick={() => review(false)}
                  type="button"
                >
                  もう一度
                </button>
                <button
                  className="review-known"
                  disabled={saving}
                  onClick={() => review(true)}
                  type="button"
                >
                  覚えた
                </button>
              </div>
            ) : (
              <button
                className="secondary-button"
                onClick={() => move(1)}
                type="button"
              >
                次へ
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="empty-books">
          <strong>該当する単語がありません</strong>
          <span>検索条件を変えてください。</span>
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
        <p>
          {items.length
            ? `${items.length} questions need review`
            : "No mistakes in this category yet."}
        </p>
      </div>
      <button
        className="secondary-button"
        onClick={onOpen}
        type="button"
        disabled={!items.length}
      >
        View
      </button>
    </section>
  );
}

export function WrongBookView({ level, items, onBack, onReview }) {
  return (
    <section className="wrong-page">
      <header className="quiz-header">
        <button
          className="icon-button"
          onClick={onBack}
          type="button"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="wrong-page-title">
          <div className="book-pill subject-kanji">ミス問題ノート</div>
          <p>
            {level} · {items.length} questions
          </p>
        </div>
      </header>

      {items.length ? (
        <section className="wrong-review-card">
          <div>
            <div className="book-badge subject-kanji">{level} ミス問題</div>
            <h2>ミス問題復習</h2>
            <p>
              ミスした問題から最大20問をランダムに出題します。正解すると自動的にノートから外れます。
            </p>
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
                  {item.lastChosenText ? (
                    <>
                      {" "}
                      / Last: <HtmlInline html={item.lastChosenText} />
                    </>
                  ) : (
                    ""
                  )}
                </p>
                <small>
                  {item.subjectLabel} · {item.bookName}
                </small>
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

export function LoginView({ onLogin, onRegister }) {
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
      setMessage(
        "ログインに失敗しました。ユーザー名とパスワードを確認してください。",
      );
    }
  }

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div>Japanese Study</div>
          <p>
            {mode === "login"
              ? "Log in to continue"
              : "Create a new study profile"}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            ログイン
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
            type="button"
          >
            ユーザー追加
          </button>
        </div>

        <form className="new-user-form" onSubmit={submit}>
          {mode === "register" ? (
            <label>
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="例：David"
              />
            </label>
          ) : null}
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="例：david"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
            />
          </label>
          {message ? <p className="form-error">{message}</p> : null}
          <button
            className="primary-button"
            type="submit"
            disabled={
              !username.trim() ||
              !password ||
              (mode === "register" && !displayName.trim())
            }
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
        <button
          className="icon-button"
          onClick={onBack}
          type="button"
          aria-label="Back"
        >
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

      <button
        className="secondary-button logout-button"
        onClick={onLogout}
        type="button"
      >
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
  return (
    <div
      className="html-content"
      dangerouslySetInnerHTML={{ __html: cleanHtml(html) }}
    />
  );
}

function InlineHtmlContent({ html }) {
  if (!html) return null;
  return (
    <div
      className="html-content"
      dangerouslySetInnerHTML={{ __html: cleanInlineHtml(html) }}
    />
  );
}

function htmlParagraphs(html) {
  const cleaned = cleanHtml(html);
  if (!cleaned) return [];

  if (typeof DOMParser === "undefined") return [cleaned];

  const doc = new DOMParser().parseFromString(
    `<section>${cleaned}</section>`,
    "text/html",
  );
  const paragraphs = Array.from(doc.body.querySelectorAll("p"))
    .map((node) => cleanHtml(node.innerHTML).trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : [cleaned];
}

function BilingualTranscript({
  sourceHtml,
  translationHtml,
  variant = "listening",
}) {
  const [showTranslation, setShowTranslation] = useState(false);
  const sourceLines = htmlParagraphs(sourceHtml);
  const translationLines = htmlParagraphs(translationHtml);
  const maxLines = Math.max(
    sourceLines.length,
    showTranslation ? translationLines.length : 0,
  );

  if (!maxLines) return null;

  return (
    <section
      className={`listening-transcript ${variant === "reading" ? "reading-transcript" : ""} ${showTranslation ? "with-translation" : ""}`}
    >
      {translationLines.length ? (
        <div className="bilingual-toolbar">
          <button
            className="bilingual-toggle"
            onClick={() => setShowTranslation((value) => !value)}
            type="button"
          >
            {showTranslation ? "中文訳を隠す" : "中文訳を表示"}
          </button>
        </div>
      ) : null}
      {Array.from({ length: maxLines }).map((_, index) => (
        <div
          className="bilingual-line"
          key={`${index}-${sourceLines[index] || translationLines[index] || ""}`}
        >
          {sourceLines[index] ? (
            <HtmlContent html={sourceLines[index]} />
          ) : null}
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

export function RandomPracticeSessionView({ session, onBack, onChoose, onMove, onSubmit }) {
  const question = session.questions[session.index];
  const chosenOptionId = session.answers[question.id] || null;
  const isLast = session.index === session.questions.length - 1;

  return (
    <section className="random-practice-view">
      <header className="quiz-header">
        <button className="icon-button" onClick={onBack} type="button" aria-label="Back"><ArrowLeft size={22} /></button>
        <div className="quiz-progress"><Progress value={pct(session.index + 1, session.questions.length)} /><span>{session.index + 1} / {session.questions.length}</span></div>
      </header>
      <article className="random-practice-question">
        <div className="random-practice-meta"><span className="book-pill subject-reading">{session.exam.level} · {examQuestionCategoryLabel(question)}</span><small>{question.source_exam_title}</small></div>
        <div className="random-practice-number">第 {question.practice_order || session.index + 1} 题</div>
        {question.passage ? <section className="exam-passage"><HtmlContent html={question.passage} /></section> : null}
        <div className="random-practice-title"><HtmlContent html={question.title} /></div>
        {question.image_url ? <img className="exam-image" src={assetSrc(question.image_url)} alt="" /> : null}
        <section className="options-grid exam-options">
          {question.options.map((option, index) => <button key={option.id} className={`option-button ${chosenOptionId === option.id ? "selected" : ""}`} onClick={() => onChoose(question.id, option.id)} type="button"><span className="option-letter">{index + 1}</span><span><HtmlInline html={option.text} /></span><span /></button>)}
        </section>
      </article>
      <footer className="exam-nav random-practice-nav">
        <button className="secondary-button" disabled={session.index === 0} onClick={() => onMove(session.index - 1)} type="button">Previous</button>
        {isLast ? <button className="primary-button" onClick={onSubmit} type="button">Submit</button> : <button className="primary-button" onClick={() => onMove(session.index + 1)} type="button">Next</button>}
      </footer>
    </section>
  );
}

export function ExamSessionView({
  session,
  onBack,
  onChoose,
  onMove,
  onSubmit,
}) {
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const question = session.questions[session.index];
  const answeredCount = Object.keys(session.answers).length;
  const problemSections = buildExamProblemSections(
    session.exam,
    session.questions,
  );
  const questionIndexById = new Map(
    session.questions.map((item, index) => [item.id, index]),
  );
  const currentProblemIndex = Math.max(
    0,
    problemSections.findIndex((section) =>
      section.questions.some((item) => item.id === question.id),
    ),
  );
  const currentProblem =
    problemSections[currentProblemIndex] || problemSections[0];
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
    requestAnimationFrame(() =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  }

  return (
    <div className="exam-view">
      <header className="quiz-header">
        <button
          className="icon-button"
          onClick={onBack}
          type="button"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="quiz-progress">
          <Progress value={pct(answeredCount, session.questions.length)} />
          <span>
            {answeredCount} / {session.questions.length}
          </span>
        </div>
        <div className="exam-header-actions">
          <button
            className="secondary-button"
            onClick={() => setShowAnswerSheet((value) => !value)}
            type="button"
          >
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
            <div className="book-pill subject-reading">
              {session.exam.level} · {session.exam.title}
            </div>
            <button
              className="answer-sheet-close"
              onClick={() => setShowAnswerSheet(false)}
              type="button"
            >
              Close
            </button>
            <div className="answer-section-list">
              {answerParts.map((part) => (
                <section className="answer-part" key={part.label}>
                  <div className="sheet-title">- {part.label} -</div>
                  {part.sections.map((section) => {
                    const sectionIndex = problemSections.findIndex(
                      (item) => item.id === section.id,
                    );
                    const sectionAnswered = section.questions.filter(
                      (item) => session.answers[item.id],
                    ).length;
                    const activeSection = section.id === currentProblem?.id;
                    return (
                      <section
                        className={`answer-section ${activeSection ? "active" : ""}`}
                        key={section.id}
                      >
                        <button
                          className="answer-section-title"
                          onClick={() => moveToProblem(sectionIndex)}
                          type="button"
                        >
                          <span>{section.problemLabel}</span>
                          <small>
                            {sectionAnswered}/{section.questions.length}
                          </small>
                        </button>
                        <div className="answer-grid">
                          {section.questions.map(
                            (item, sectionQuestionIndex) => {
                              const globalIndex =
                                questionIndexById.get(item.id) || 0;
                              const displayNumber = examQuestionDisplayNumber(
                                section,
                                item,
                                sectionQuestionIndex,
                                questionIndexById,
                              );
                              return (
                                <button
                                  key={item.id}
                                  className={[
                                    "answer-dot",
                                    session.answers[item.id] ? "answered" : "",
                                  ].join(" ")}
                                  onClick={() => {
                                    onMove(globalIndex);
                                    requestAnimationFrame(() =>
                                      window.scrollTo({
                                        top: 0,
                                        behavior: "smooth",
                                      }),
                                    );
                                  }}
                                  type="button"
                                >
                                  {String(displayNumber).padStart(2, "0")}
                                </button>
                              );
                            },
                          )}
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
          <div className="book-badge subject-reading">
            {currentProblem?.partLabel}
          </div>
          <div className="exam-question-head">
            <span>{currentProblem?.problemLabel.replace("問題", "")}</span>
            <p>{currentProblem?.layer.title}</p>
          </div>

          <section className="exam-problem-page">
            {groupQuestionsByPassage(currentProblem?.questions || []).map(
              (group, groupIndex) => (
                <section
                  className="exam-passage-group"
                  key={`${currentProblem?.id}-${groupIndex}`}
                >
                  {group.passage ? (
                    <section className="exam-passage">
                      <HtmlContent html={group.passage} />
                    </section>
                  ) : null}
                  {group.questions.map((item) => {
                    const globalIndex = questionIndexById.get(item.id) || 0;
                    const sectionQuestionIndex = Math.max(
                      0,
                      currentProblem?.questions.findIndex(
                        (question) => question.id === item.id,
                      ) ?? 0,
                    );
                    const displayNumber = examQuestionDisplayNumber(
                      currentProblem,
                      item,
                      sectionQuestionIndex,
                      questionIndexById,
                    );
                    const chosenOptionId = session.answers[item.id] || null;
                    return (
                      <article className="exam-sub-question" key={item.id}>
                        <div className="exam-sub-question-title">
                          <span>{String(displayNumber).padStart(2, "0")}.</span>
                          <HtmlContent html={item.title} />
                        </div>

                        {item.media_url ? (
                          <audio
                            className="exam-audio"
                            controls
                            src={assetSrc(item.media_url)}
                          />
                        ) : null}

                        {item.image_url ? (
                          <img
                            className="exam-image"
                            src={assetSrc(item.image_url)}
                            alt=""
                          />
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
                              <span>
                                <HtmlInline html={option.text} />
                              </span>
                            </button>
                          ))}
                        </section>
                      </article>
                    );
                  })}
                </section>
              ),
            )}
          </section>

          <footer className="exam-nav">
            <button
              className="secondary-button"
              onClick={() => moveToProblem(currentProblemIndex - 1)}
              disabled={!canPrev}
              type="button"
            >
              Prev
            </button>
            <button
              className="primary-button"
              onClick={() => moveToProblem(currentProblemIndex + 1)}
              disabled={!canNext}
              type="button"
            >
              Next
            </button>
          </footer>
        </section>
      </section>
    </div>
  );
}

export function ExamResultView({
  exam,
  attempt,
  questions,
  onRepeat,
  onLibrary,
  practice = false,
  practiceCategory = "grammar",
}) {
  const score = pct(attempt.correct, attempt.total);
  const estimatedScore = calculateExamScore(attempt, questions);
  const questionById = new Map<number, any>(
    questions.map((question) => [question.id, question]),
  );
  const answerByQuestion = new Map<number, any>(
    attempt.answers.map((answer) => [answer.questionId, answer]),
  );
  const answerForQuestion = (question) =>
    answerByQuestion.get(question.id) || {
      questionId: question.id,
      title: question.title,
      chosenOptionId: null,
      chosenText: null,
      correctOptionId: null,
      answerText: "",
      analysis: question.analysis || "",
      isCorrect: false,
      unanswered: true,
    };
  const reviewProblemGroups = buildReviewProblemGroups(exam, questions);
  const practiceTypes = (PRACTICE_CATEGORIES[practiceCategory] || PRACTICE_CATEGORIES.grammar).types;
  const grammarTypeStats = practiceTypes.map((type) => {
    const typeQuestions = questions.filter((question) => question.question_type === type.id);
    const correct = typeQuestions.filter((question) => answerByQuestion.get(question.id)?.isCorrect).length;
    return { ...type, correct, total: typeQuestions.length };
  }).filter((type) => type.total);

  return (
    <section className="result-view exam-result-view">
      <div className="result-score">
        <Trophy size={54} />
        <h1>{score}%</h1>
        <p>
          {attempt.correct} / {attempt.total} correct · {attempt.title}
        </p>
      </div>

      {practice ? (
        <section className="grammar-type-summary">
          {grammarTypeStats.map((type) => <div key={type.id}><span>{type.label}</span><strong>{pct(type.correct, type.total)}%</strong><small>{type.correct} / {type.total} 正确</small></div>)}
        </section>
      ) : <section
        className={`exam-score-summary ${estimatedScore.passed ? "passed" : "failed"}`}
      >
        <div>
          <span>概算スコア</span>
          <strong>{estimatedScore.totalScore} / 180</strong>
          <small>
            {estimatedScore.passed ? "合格見込み" : "不合格見込み"} · 合格ライン{" "}
            {estimatedScore.overallPassMark}
          </small>
        </div>
        <div>
          <span>言語知識・読解</span>
          <strong>{estimatedScore.languageReadingScore} / 120</strong>
          <small>
            {estimatedScore.languageReadingCorrect}/
            {estimatedScore.languageReadingTotal} · 目安{" "}
            {estimatedScore.languageReadingPassMark}
          </small>
        </div>
        <div>
          <span>聴解</span>
          <strong>{estimatedScore.listeningScore} / 60</strong>
          <small>
            {estimatedScore.listeningCorrect}/{estimatedScore.listeningTotal} ·
            目安 {estimatedScore.listeningPassMark}
          </small>
        </div>
      </section>}

      <div className="result-actions">
        <button className="primary-button" onClick={onRepeat} type="button">
          <RotateCcw size={20} />
          {practice ? "重新设置" : "Repeat"}
        </button>
        <button className="secondary-button" onClick={onLibrary} type="button">
          {practice ? "返回首页" : "Exam list"}
        </button>
      </div>

      <div className="result-review-layout">
        <aside
          className="review-jump-panel"
          aria-label="Review question navigation"
        >
          <div className="review-jump-title">問題番号</div>
          {reviewProblemGroups.map((group) => (
            <section className="review-jump-section" key={group.label}>
              <div className="review-jump-group-title">{group.label}</div>
              {group.sections.map((section) => (
                <section className="review-jump-problem" key={section.id}>
                  <div className="review-jump-problem-title">
                    {section.problemLabel}
                  </div>
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
                          onClick={() =>
                            document
                              .getElementById(`exam-review-${question.id}`)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              })
                          }
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
                  <div className="review-problem-heading">
                    {section.problemLabel}
                  </div>
                  {groupReviewItemsByPassage(section.items).map(
                    (passageGroup, passageGroupIndex) => (
                      <section
                        className={`review-passage-group ${passageGroup.passage ? "has-shared-passage" : "single-question-group"}`}
                        key={`${section.id}-${passageGroup.key}-${passageGroupIndex}`}
                      >
                        {passageGroup.passage &&
                        isReadingQuestion(passageGroup.question) ? (
                          <BilingualTranscript
                            sourceHtml={passageGroup.passage}
                            translationHtml={passageGroup.translation}
                            variant="reading"
                          />
                        ) : null}
                        {passageGroup.passage &&
                        !isReadingQuestion(passageGroup.question) ? (
                          <section className="review-shared-passage">
                            <HtmlContent html={passageGroup.passage} />
                          </section>
                        ) : null}
                        {passageGroup.passage &&
                        !isListeningQuestion(passageGroup.question) &&
                        !isReadingQuestion(passageGroup.question) &&
                        passageGroup.translation ? (
                          <section className="translation-block">
                            <HtmlContent html={passageGroup.translation} />
                          </section>
                        ) : null}
                        {passageGroup.items.map(
                          ({ question, index, displayNumber }) => {
                            const answer = answerForQuestion(question);
                            return (
                              <article
                                className="review-item exam-review-item"
                                id={`exam-review-${answer.questionId}`}
                                key={`${answer.questionId}-${index}`}
                              >
                                <div
                                  className={
                                    answer.isCorrect
                                      ? "review-mark right"
                                      : "review-mark miss"
                                  }
                                >
                                  {answer.isCorrect ? (
                                    <Check size={18} />
                                  ) : (
                                    <X size={18} />
                                  )}
                                </div>
                                <div>
                                  <div className="review-title-row">
                                    <span className="review-question-number">
                                      {displayNumber}
                                    </span>
                                    <div className="review-title">
                                      <HtmlContent
                                        html={
                                          answer.title || question?.title || ""
                                        }
                                      />
                                    </div>
                                  </div>
                                  {question?.image_url ? (
                                    <img
                                      className="review-image"
                                      src={assetSrc(question.image_url)}
                                      alt=""
                                    />
                                  ) : null}
                                  {question?.media_url ? (
                                    <audio
                                      className="exam-audio compact"
                                      controls
                                      src={assetSrc(question.media_url)}
                                    />
                                  ) : null}
                                  {isListeningQuestion(question) &&
                                  (question?.subtitle ||
                                    question?.translation) ? (
                                    <BilingualTranscript
                                      sourceHtml={question.subtitle}
                                      translationHtml={question.translation}
                                    />
                                  ) : null}
                                  {!passageGroup.passage &&
                                  isReadingQuestion(question) &&
                                  (question?.passage ||
                                    question?.translation) ? (
                                    <BilingualTranscript
                                      sourceHtml={question.passage}
                                      translationHtml={question.translation}
                                      variant="reading"
                                    />
                                  ) : null}
                                  {!passageGroup.passage &&
                                  !isReadingQuestion(question) &&
                                  question?.passage ? (
                                    <HtmlContent html={question.passage} />
                                  ) : null}
                                  {answer.unanswered ? (
                                    <p className="review-unanswered">
                                      未作答
                                    </p>
                                  ) : null}
                                  {question?.options?.length ? (
                                    <section
                                      className="review-options"
                                      aria-label={`${index + 1}番の選択肢`}
                                    >
                                      {question.options.map(
                                        (option, optionIndex) => {
                                          const isChosen =
                                            answer.chosenOptionId === option.id;
                                          const isCorrectOption =
                                            answer.correctOptionId ===
                                            option.id;
                                          return (
                                            <div
                                              className={[
                                                "review-option",
                                                isCorrectOption
                                                  ? "correct"
                                                  : "",
                                                isChosen && !isCorrectOption
                                                  ? "chosen-wrong"
                                                  : "",
                                                isChosen && isCorrectOption
                                                  ? "chosen-correct"
                                                  : "",
                                              ].join(" ")}
                                              key={`${answer.questionId}-${option.id}`}
                                            >
                                              <span className="review-option-number">
                                                {optionIndex + 1}
                                              </span>
                                              <span className="review-option-text">
                                                <HtmlInline
                                                  html={option.text}
                                                />
                                              </span>
                                            </div>
                                          );
                                        },
                                      )}
                                    </section>
                                  ) : null}
                                  {answer.analysis ? (
                                    <section className="analysis-text">
                                      <InlineHtmlContent
                                        html={answer.analysis}
                                      />
                                    </section>
                                  ) : null}
                                  {!passageGroup.passage &&
                                  !isListeningQuestion(question) &&
                                  !isReadingQuestion(question) &&
                                  question?.translation ? (
                                    <section className="translation-block">
                                      <HtmlContent
                                        html={question.translation}
                                      />
                                    </section>
                                  ) : null}
                                </div>
                              </article>
                            );
                          },
                        )}
                      </section>
                    ),
                  )}
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
  const progress = pct(
    session.index + (session.checked ? 1 : 0),
    session.questions.length,
  );
  const isCorrect = Boolean(session.checkResult?.is_correct);

  return (
    <div className="quiz-view">
      <header className="quiz-header">
        <button
          className="icon-button"
          onClick={onBack}
          type="button"
          aria-label="Back"
        >
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
              <span>
                <HtmlInline html={option.text} />
              </span>
              {session.checked && answer ? <Check size={20} /> : null}
              {session.checked && selected && !answer ? <X size={20} /> : null}
            </button>
          );
        })}
      </section>

      <footer
        className={`answer-dock ${session.checked ? (isCorrect ? "yes" : "no") : ""}`}
      >
        {session.checked ? (
          <div className="feedback">
            <strong>{isCorrect ? "Correct!" : "Answer"}</strong>
            <span>
              <HtmlInline html={session.checkResult.answer_text} />
            </span>
          </div>
        ) : (
          <div className="feedback muted">
            <strong>Choose one</strong>
            <span>
              {session.mode === "mixed"
                ? "Mixed test, 20 questions"
                : "Book practice, 10 questions"}
            </span>
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
          <article
            className="review-item"
            key={`${answer.questionId}-${index}`}
          >
            <div
              className={
                answer.isCorrect ? "review-mark right" : "review-mark miss"
              }
            >
              {answer.isCorrect ? <Check size={18} /> : <X size={18} />}
            </div>
            <div>
              <h3>{answer.stem}</h3>
              {answer.options?.length ? (
                <section
                  className="review-options"
                  aria-label={`${index + 1}番の選択肢`}
                >
                  {answer.options.map((option, optionIndex) => {
                    const isChosen = answer.chosenOptionId === option.id;
                    const isCorrectOption =
                      answer.correctOptionId === option.id;
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
                        <span className="review-option-number">
                          {optionIndex + 1}
                        </span>
                        <span className="review-option-text">
                          <HtmlInline html={option.text} />
                        </span>
                      </div>
                    );
                  })}
                </section>
              ) : (
                <p>
                  Your answer:{" "}
                  {answer.chosenText ? (
                    <HtmlInline html={answer.chosenText} />
                  ) : (
                    "-"
                  )}{" "}
                  / Correct: <HtmlInline html={answer.answerText} />
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
