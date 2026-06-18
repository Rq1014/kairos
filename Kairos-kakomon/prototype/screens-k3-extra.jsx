// ============================================================
// K3 续作三屏：错题本 / 参考书索引 / 过去问全局搜索
// 视觉延续：blue=过去问 · teal=参考书 · rose=错题/弱点 · amber=书籍评分
// ============================================================

const { useState: useStateExt, useMemo: useMemoExt } = React;

// ────────────────────────────────────────────────────────────
// 1. 错题本 / 弱点全景
// ────────────────────────────────────────────────────────────
function WrongBookScreen({ onBack, onOpenQuestion }) {
  const [tab, setTab] = useStateExt("list");
  const [subject, setSubject] = useStateExt("全部");
  const subjects = ["全部", "线性代数", "微积分", "概率统计", "算法"];

  const list = KAKOMON_WRONG_QUESTIONS.filter(w => subject === "全部" || w.subject === subject);
  const dueToday = KAKOMON_WRONG_QUESTIONS.filter(w => w.nextReviewAt === "今天").length;

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title="错题本" subtitle={`${KAKOMON_WRONG_QUESTIONS.length} 道 · 今日待复习 ${dueToday}`} onBack={onBack}
        right={<button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="filter" size={18}/></button>}
      />

      {/* 顶部三组 stat */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad-lg" style={{ background: "linear-gradient(135deg, #fff1f2, #fff)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <div className="col" style={{ gap: 2 }}>
              <span className="text-xs muted">未掌握</span>
              <span className="text-2xl fw-700 text-rose" style={{ fontFamily: "var(--font-num)" }}>{KAKOMON_WRONG_QUESTIONS.filter(w=>w.masteryLevel<=1).length}</span>
            </div>
            <div className="col" style={{ gap: 2 }}>
              <span className="text-xs muted">即将掌握</span>
              <span className="text-2xl fw-700 text-amber" style={{ fontFamily: "var(--font-num)" }}>{KAKOMON_WRONG_QUESTIONS.filter(w=>w.masteryLevel===2).length}</span>
            </div>
            <div className="col" style={{ gap: 2 }}>
              <span className="text-xs muted">今日复习</span>
              <span className="text-2xl fw-700 text-blue" style={{ fontFamily: "var(--font-num)" }}>{dueToday}</span>
            </div>
          </div>
          <button className="btn btn-block btn-lg" style={{ marginTop: 12, background: "linear-gradient(135deg, var(--rose-500), var(--amber-500))", color: "#fff" }}>
            <Icon name="flame" size={14}/> 开始今日复习（{dueToday} 题）
          </button>
        </div>
      </div>

      {/* 切换：列表 / 知识点矩阵 */}
      <div className="section" style={{ marginTop: 14 }}>
        <Segmented items={[{value:"list",label:"题目列表"},{value:"matrix",label:"知识点矩阵"}]} value={tab} onChange={setTab}/>
      </div>

      {tab === "list" && (
        <>
          <div className="section" style={{ marginTop: 10 }}>
            <div className="scroll-x">
              {subjects.map(s => <Chip key={s} color="rose" selected={subject===s} onClick={()=>setSubject(s)}>{s}</Chip>)}
            </div>
          </div>
          <div className="section">
            <div className="col" style={{ gap: 8 }}>
              {list.map(w => (
                <div key={w.id} className="card" onClick={() => onOpenQuestion(w.questionId)} style={{ cursor: "pointer" }}>
                  <div className="card-pad">
                    <div className="row gap-2" style={{ marginBottom: 6, flexWrap: "wrap" }}>
                      <span className="chip rose">#{w.subject}</span>
                      <span className="chip outlined">{w.point}</span>
                      <span className="text-xs muted" style={{ marginLeft: "auto", fontFamily: "var(--font-num)" }}>错 {w.wrongCount} 次</span>
                    </div>
                    <div className="text-sm fw-600" style={{ lineHeight: 1.4 }}>{w.title}</div>
                    <div className="text-xs muted" style={{ marginTop: 4 }}>{w.universityShort} · {w.year} · {w.questionNo}</div>
                    <div className="row-between" style={{ marginTop: 10 }}>
                      <div className="row gap-2">
                        <MasteryDots level={w.masteryLevel}/>
                        {w.tags.map(t => <span key={t} className="badge" style={{ background: "var(--amber-50)", color: "var(--amber-700)" }}>{t}</span>)}
                      </div>
                      <span className="text-xs fw-600" style={{ color: w.nextReviewAt === "今天" ? "var(--rose-600)" : "var(--slate-500)" }}>
                        <Icon name="bell" size={11}/> {w.nextReviewAt}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "matrix" && (
        <div className="section" style={{ marginTop: 10 }}>
          <div className="col" style={{ gap: 12 }}>
            {KAKOMON_KNOWLEDGE_MATRIX.map(g => (
              <div key={g.subject} className="card card-pad-lg">
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <div className="row gap-2">
                    <span style={{ width:8, height:16, background:`var(--${g.color}-500)`, borderRadius:2, display:"inline-block" }}/>
                    <span className="text-sm fw-700">{g.subject}</span>
                  </div>
                  <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>共 {g.total} 错题</span>
                </div>
                <div className="col" style={{ gap: 12 }}>
                  {g.points.map(p => (
                    <div key={p.point}>
                      <div className="row-between" style={{ marginBottom: 4 }}>
                        <span className="text-xs fw-600">{p.point}</span>
                        <span className="text-xs muted">{p.count} 错 · 掌握 {Math.round(p.mastery*100)}%</span>
                      </div>
                      <div className="bar"><div className="bar-fill" style={{ width: (p.mastery*100)+"%", background: p.mastery<0.4?"var(--rose-500)":p.mastery<0.7?"var(--amber-500)":"var(--green-500)" }}/></div>
                      {p.overlap.length > 0 && (
                        <div className="row gap-2" style={{ marginTop: 6 }}>
                          <Icon name="link" size={11} className="text-purple" style={{ color: "var(--purple-600)" }}/>
                          <span className="text-xs muted">目标校重叠：</span>
                          {p.overlap.map(o => <span key={o} className="badge cross">{o}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn btn-block btn-outlined btn-sm" style={{ marginTop: 12 }}>
                  <Icon name="flame" size={12}/> 重做这一组（{g.total} 题）
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 24 }}/>
    </div>
  );
}

function MasteryDots({ level }) {
  return (
    <div className="row" style={{ gap: 2 }}>
      {[0,1,2,3].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: 99,
          background: i <= level ? (level<=1?"var(--rose-500)":level===2?"var(--amber-500)":"var(--green-500)") : "var(--slate-200)",
        }}/>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 2. 参考书索引
// ────────────────────────────────────────────────────────────
function ReferenceIndexScreen({ onBack, onOpenQuestion }) {
  const [category, setCategory] = useStateExt("全部");
  const cats = ["全部", "考研用书", "校内编纂", "学科教材", "真题集"];
  const [selectedBook, setSelectedBook] = useStateExt(null);

  const books = KAKOMON_REFERENCE_BOOKS.filter(b => category === "全部" || b.category === category);

  if (selectedBook) return <ReferenceBookDetail book={selectedBook} onBack={() => setSelectedBook(null)} onOpenQuestion={onOpenQuestion}/>;

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title="参考书索引" subtitle="按章节查找过去问对应位置" onBack={onBack}
        right={<button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="search" size={18}/></button>}
      />

      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad" style={{ background: "linear-gradient(135deg, #f0fdfa, #fff)", borderColor: "#99f6e4" }}>
          <div className="row gap-2"><Icon name="book" size={14} className="text-teal"/><span className="text-sm fw-600 text-teal">差异化卖点</span></div>
          <div className="text-xs text-slate-700" style={{ marginTop: 4, lineHeight: 1.5 }}>每本参考书已被拆到章节、页码，并与过去问双向对应。看到一题，立刻知道翻哪本书哪一页。</div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <div className="scroll-x">
          {cats.map(c => <Chip key={c} color="teal" selected={category===c} onClick={()=>setCategory(c)}>{c}</Chip>)}
        </div>
      </div>

      <div className="section">
        <div className="row-between" style={{ marginBottom: 10 }}>
          <span className="text-sm muted">{books.length} 本</span>
          <span className="text-xs text-teal fw-600">收藏数排序</span>
        </div>
        <div className="col" style={{ gap: 10 }}>
          {books.map(b => (
            <div key={b.id} className="card" onClick={() => setSelectedBook(b)} style={{ cursor: "pointer" }}>
              <div className="card-pad-lg">
                <div className="row gap-3">
                  <div style={{
                    width: 56, height: 76, borderRadius: 6,
                    background: `linear-gradient(135deg, var(--${b.cover}-500), var(--${b.cover}-700, var(--${b.cover}-600)))`,
                    color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, padding: 4, textAlign: "center", lineHeight: 1.2,
                    flexShrink: 0, boxShadow: "2px 2px 4px rgba(0,0,0,0.1)",
                  }}>
                    <span style={{ fontSize: 9, opacity: 0.8 }}>{b.category}</span>
                    <span style={{ marginTop: 4 }}>{b.title.split(" ")[0]}</span>
                  </div>
                  <div className="col flex1" style={{ gap: 3 }}>
                    <div className="text-md fw-700" style={{ lineHeight: 1.3 }}>{b.title}</div>
                    <div className="text-xs muted truncate">{b.titleJp} · {b.author}</div>
                    <div className="row gap-2" style={{ marginTop: 4 }}>
                      <Icon name="star" size={11} className="text-amber" fill="var(--amber-500)" stroke="var(--amber-500)"/>
                      <span className="text-xs fw-700" style={{ fontFamily: "var(--font-num)" }}>{b.rating}</span>
                      <span className="text-xs muted">· {b.ownedByCount.toLocaleString()} 人在用</span>
                    </div>
                    <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
                      {b.tags.slice(0,2).map(t => <span key={t} className="chip outlined">{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="divider-thin" style={{ margin: "10px 0 8px" }}/>
                <div className="row-between">
                  <span className="text-xs text-teal fw-600">关联 {b.coveredQuestionCount} 道过去问</span>
                  <div className="row gap-2">
                    {b.popularSchools.map(s => <span key={s} className="badge passed">{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function ReferenceBookDetail({ book, onBack, onOpenQuestion }) {
  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title={book.title} subtitle={book.titleJp} onBack={onBack}
        right={<button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="bookmark" size={18}/></button>}
      />
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad-lg" style={{ background: `linear-gradient(135deg, var(--${book.cover}-50), #fff)`, borderColor: `var(--${book.cover}-100, var(--slate-200))` }}>
          <div className="row gap-3">
            <div style={{
              width: 70, height: 92, borderRadius: 6,
              background: `linear-gradient(135deg, var(--${book.cover}-500), var(--${book.cover}-700, var(--${book.cover}-600)))`,
              color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, padding: 6, textAlign: "center", lineHeight: 1.2,
              flexShrink: 0, boxShadow: "2px 2px 6px rgba(0,0,0,0.15)",
            }}>
              <span style={{ fontSize: 10, opacity: 0.85 }}>{book.category}</span>
              <span style={{ marginTop: 6 }}>{book.title}</span>
            </div>
            <div className="col flex1" style={{ gap: 4 }}>
              <div className="text-xs muted">{book.author} · {book.lastUpdate}</div>
              <div className="row gap-2" style={{ marginTop: 4 }}>
                <Icon name="star" size={12} className="text-amber" fill="var(--amber-500)" stroke="var(--amber-500)"/>
                <span className="text-sm fw-700" style={{ fontFamily: "var(--font-num)" }}>{book.rating}</span>
                <span className="text-xs muted">{book.ownedByCount.toLocaleString()} 人在用</span>
              </div>
              <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
                {book.tags.map(t => <span key={t} className="chip outlined">{t}</span>)}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
            <div className="col"><span className="text-xs muted">章节</span><span className="text-lg fw-700" style={{ fontFamily: "var(--font-num)" }}>{book.chapters.length}</span></div>
            <div className="col"><span className="text-xs muted">关联题</span><span className="text-lg fw-700 text-teal" style={{ fontFamily: "var(--font-num)" }}>{book.coveredQuestionCount}</span></div>
            <div className="col"><span className="text-xs muted">热门校</span><span className="text-sm fw-600">{book.popularSchools.join("·")}</span></div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>章节目录</h3>
        <div className="col" style={{ gap: 8 }}>
          {book.chapters.map((c, i) => (
            <div key={c.id} className="card card-pad">
              <div className="row gap-3" style={{ alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `var(--${book.cover}-50)`, color: `var(--${book.cover}-600)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-num)" }}>{i+1}</div>
                <div className="col flex1" style={{ gap: 3, minWidth: 0 }}>
                  <div className="row-between">
                    <div className="text-sm fw-600 truncate">{c.chapter}</div>
                    {c.hot && <span className="badge" style={{ background: "var(--rose-50)", color: "var(--rose-600)" }}>🔥 热</span>}
                  </div>
                  <div className="text-xs text-teal fw-600" style={{ fontFamily: "var(--font-num)" }}>{c.pages}</div>
                  <div className="row gap-2" style={{ marginTop: 4, flexWrap: "wrap" }}>
                    {c.knowledgePoints.map(k => <span key={k} className="chip outlined">#{k}</span>)}
                  </div>
                  <div className="row-between" style={{ marginTop: 8 }}>
                    <span className="text-xs muted">关联 <b className="text-slate-800" style={{ fontFamily: "var(--font-num)" }}>{c.questionCount}</b> 道过去问</span>
                    <button className="text-xs text-teal fw-600" onClick={() => onOpenQuestion("q-todai-2024-math-3")}>查看 →</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 3. 过去问全局搜索
// ────────────────────────────────────────────────────────────
function SearchScreen({ onBack, onOpenQuestion }) {
  const [q, setQ] = useStateExt("");
  const [filters, setFilters] = useStateExt({ school: "全部", year: "全部", subject: "全部", difficulty: "全部" });
  const hasQuery = q.trim().length > 0;

  const all = KAKOMON_QUESTIONS;
  const results = useMemoExt(() => {
    if (!hasQuery) return [];
    const kw = q.trim();
    return all.filter(qq => {
      const u = KAKOMON_UNIVERSITIES.find(x => x.id === qq.universityId);
      const matchKw = qq.title.includes(kw) || (qq.knowledgePoints||[]).some(k => k.includes(kw)) || (u && u.short.includes(kw)) || qq.subject.includes(kw);
      if (!matchKw) return false;
      if (filters.school !== "全部" && u && u.short !== filters.school) return false;
      if (filters.year !== "全部" && String(qq.year) !== filters.year) return false;
      if (filters.subject !== "全部" && qq.subject !== filters.subject) return false;
      return true;
    });
  }, [q, filters]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="screen fade-in">
      <StatusBar />
      <div className="app-header" style={{ paddingTop: 6 }}>
        <button className="icon-btn" onClick={onBack} aria-label="back" style={{ width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="back" size={20}/></button>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
            placeholder="搜索题目 / 知识点 / 学校"
            style={{
              width: "100%", height: 38, borderRadius: 999,
              border: "1px solid var(--slate-200)",
              padding: "0 36px 0 14px", fontSize: 14, outline: "none",
              background: "var(--slate-100)",
            }}
          />
          {q && <button onClick={() => setQ("")} style={{ position: "absolute", right: 10, top: 9, color: "var(--slate-400)" }}><Icon name="close" size={16}/></button>}
        </div>
      </div>

      {!hasQuery && (
        <>
          <div className="section" style={{ marginTop: 14 }}>
            <h3>最近搜索</h3>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {KAKOMON_SEARCH_RECENT.map(r => (
                <span key={r} className="chip slate chip-btn" onClick={() => setQ(r)} style={{ cursor: "pointer" }}>
                  <Icon name="back" size={11}/> {r}
                </span>
              ))}
            </div>
          </div>
          <div className="section">
            <h3>
              <span>热门关键词</span>
              <span className="more">基于 7 日搜索量</span>
            </h3>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {KAKOMON_SEARCH_HOT.map((h, i) => (
                <span key={h} className="chip blue chip-btn" onClick={() => setQ(h)} style={{ cursor: "pointer" }}>
                  {i < 3 && <span style={{ color: "var(--rose-500)", fontWeight: 700, fontSize: 10 }}>TOP {i+1}</span>}
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>按学校浏览</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {KAKOMON_UNIVERSITIES.slice(0, 6).map(u => (
                <button key={u.id} className="card card-pad" onClick={() => setQ(u.short)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `var(--${u.accent}-50)`, color: `var(--${u.accent}-600)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{u.short.slice(0,1)}</div>
                  <span className="text-xs fw-600">{u.short}</span>
                  <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>{u.pastExamCount}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {hasQuery && (
        <>
          <div className="section" style={{ marginTop: 8 }}>
            <div className="scroll-x">
              <FilterDropdown label="学校" value={filters.school} options={["全部", ...KAKOMON_UNIVERSITIES.map(u => u.short)]} onChange={v => setFilter("school", v)}/>
              <FilterDropdown label="年份" value={filters.year} options={["全部","2024","2023","2022","2021","2020"]} onChange={v => setFilter("year", v)}/>
              <FilterDropdown label="科目" value={filters.subject} options={["全部","数学","情报","物理","统计"]} onChange={v => setFilter("subject", v)}/>
              <FilterDropdown label="难度" value={filters.difficulty} options={["全部","简单","中等","偏难","极难"]} onChange={v => setFilter("difficulty", v)}/>
            </div>
          </div>

          <div className="section">
            <div className="row-between" style={{ marginBottom: 10 }}>
              <span className="text-sm muted">{results.length} 个结果</span>
              <span className="text-xs text-blue fw-600 row gap-2"><Icon name="filter" size={11}/> 相关度</span>
            </div>
            {results.length === 0 ? (
              <EmptyHint icon="search" text={`没找到「${q}」相关题目，换个关键词试试`}/>
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {results.map(qq => {
                  const u = KAKOMON_UNIVERSITIES.find(x => x.id === qq.universityId);
                  return (
                    <div key={qq.id} className="card" onClick={() => onOpenQuestion(qq.id)} style={{ cursor: "pointer" }}>
                      <div className="card-pad">
                        <div className="row gap-2" style={{ marginBottom: 6 }}>
                          <span className={"chip " + (u?.accent || "slate")}>{u?.short || "—"}</span>
                          <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>{qq.year} · {qq.subject} {qq.questionNo}</span>
                        </div>
                        <div className="text-sm fw-600" style={{ lineHeight: 1.4 }}><Highlight text={qq.title} keyword={q}/></div>
                        <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                          {(qq.knowledgePoints||[]).slice(0, 3).map(k => <span key={k} className="chip outlined"><Highlight text={"#" + k} keyword={q}/></span>)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
      <div style={{ height: 24 }}/>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useStateExt(false);
  const isAll = value === "全部";
  return (
    <div style={{ position: "relative", flex: "0 0 auto" }}>
      <button onClick={() => setOpen(!open)} className="chip chip-btn" style={{
        background: isAll ? "var(--slate-100)" : "var(--blue-50)",
        color: isAll ? "var(--slate-700)" : "var(--blue-700)",
        cursor: "pointer", fontWeight: 600,
      }}>
        {label}: {value} <Icon name="chevronRight" size={11} style={{ transform: open ? "rotate(90deg)" : "rotate(90deg)" }}/>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, background: "#fff", border: "1px solid var(--slate-200)", borderRadius: 10, boxShadow: "var(--shadow-md)", zIndex: 30, minWidth: 110, overflow: "hidden" }}>
          {options.map(o => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 12px", fontSize: 13,
              background: o === value ? "var(--blue-50)" : "#fff",
              color: o === value ? "var(--blue-700)" : "var(--slate-700)",
              fontWeight: o === value ? 600 : 400,
            }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, keyword }) {
  if (!keyword) return text;
  const idx = text.indexOf(keyword);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: "var(--amber-100)", color: "var(--amber-700)", padding: "0 2px", borderRadius: 3 }}>{text.slice(idx, idx + keyword.length)}</span>
      {text.slice(idx + keyword.length)}
    </>
  );
}

window.WrongBookScreen = WrongBookScreen;
window.ReferenceIndexScreen = ReferenceIndexScreen;
window.SearchScreen = SearchScreen;
