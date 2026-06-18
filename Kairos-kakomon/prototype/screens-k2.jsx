// ============================================================
// K2 — University List + University Detail (multi-tab)
// ============================================================

const { useState: useStateK2 } = React;

function UniversityListScreen({ onOpenUniversity, onTabSelect, onOpenCompare }) {
  const [search, setSearch] = useStateK2("");
  const [filter, setFilter] = useStateK2("全部");
  const filters = ["全部", "国立", "私立", "理工", "文商", "关东", "关西", "热门"];

  const list = KAKOMON_UNIVERSITIES.filter(u => {
    if (filter === "全部") return true;
    if (filter === "国立") return u.type === "national";
    if (filter === "私立") return u.type === "private";
    if (filter === "理工") return u.tags.includes("理工");
    if (filter === "文商") return u.tags.includes("文商");
    if (filter === "关东") return u.region === "关东";
    if (filter === "关西") return u.region === "关西";
    if (filter === "热门") return u.tags.includes("热门");
    return true;
  }).filter(u => !search || u.nameCn.includes(search) || u.nameJp.includes(search) || u.nameEn.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="screen fade-in">
      <StatusBar />
      <div style={{ padding: "8px 16px 0" }}>
        <div className="row-between">
          <div>
            <div className="text-2xl fw-700">大学评分</div>
            <div className="text-xs muted" style={{ marginTop: 2 }}>修考难度 · 过去问完整度 · 教授透明度</div>
          </div>
          <button className="btn btn-sm" onClick={onOpenCompare} style={{ background: "var(--purple-50)", color: "var(--purple-600)", border: "1px solid #e9d5ff" }}>
            <Icon name="graph" size={12}/> 并排对比
          </button>
        </div>
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <div style={{ position: "relative" }}>
          <input
            placeholder="搜索 中文 / 日文 / English"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", height: 40, borderRadius: 10,
              border: "1px solid var(--slate-200)",
              padding: "0 12px 0 36px", fontSize: 14, outline: "none",
              background: "#fff",
            }}
          />
          <div style={{ position: "absolute", left: 12, top: 11, color: "var(--slate-400)" }}><Icon name="search" size={16}/></div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <div className="scroll-x">
          {filters.map(f => (
            <Chip key={f} color="blue" selected={filter === f} onClick={() => setFilter(f)}>{f}</Chip>
          ))}
        </div>
      </div>

      <div className="section" style={{ marginTop: 4 }}>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <span className="text-sm muted">{list.length} 所大学</span>
          <span className="text-xs text-blue fw-600">综合评分排序</span>
        </div>
        <div className="col" style={{ gap: 10 }}>
          {list.map((u, i) => (
            <div key={u.id} className="card" onClick={() => onOpenUniversity(u.id)} style={{ cursor: "pointer" }}>
              <div className="card-pad-lg">
                <div className="row gap-3">
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `var(--${u.accent}-50)`,
                    color: `var(--${u.accent}-600)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 16,
                    flexShrink: 0,
                  }}>{u.short.slice(0,1)}</div>
                  <div className="col flex1" style={{ gap: 2, minWidth: 0 }}>
                    <div className="row-between">
                      <div className="text-md fw-600 truncate">{u.nameCn}</div>
                      <div className="row gap-2" style={{ alignItems: "center" }}>
                        <Icon name="star" size={12} className="text-amber" fill="var(--amber-500)" stroke="var(--amber-500)" />
                        <span className="text-sm fw-700" style={{ fontFamily: "var(--font-num)" }}>{u.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="text-xs muted truncate">{u.nameJp} · {u.nameEn}</div>
                  </div>
                </div>

                <div className="divider-thin" style={{ margin: "10px 0 8px" }} />

                <div className="row gap-3" style={{ fontSize: 11, color: "var(--slate-600)", flexWrap: "wrap" }}>
                  <span><Icon name="book" size={11}/> 过去问 <b style={{ fontFamily: "var(--font-num)", color: "var(--slate-800)" }}>{u.pastExamCount}</b></span>
                  <span><Icon name="message" size={11}/> 评价 <b style={{ fontFamily: "var(--font-num)", color: "var(--slate-800)" }}>{u.reviewCount}</b></span>
                  <DifficultyBadge label={difficultyLabel(u.examDifficulty)} level={u.examDifficulty} />
                </div>

                <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                  {u.hotSubjects.map(s => <span key={s} className="chip outlined">{s}</span>)}
                </div>

                {i === 0 && (
                  <div style={{ background: "var(--blue-50)", color: "var(--blue-700)", padding: "6px 10px", borderRadius: 6, fontSize: 11, marginTop: 10, fontWeight: 600 }}>
                    <Icon name="trending" size={11}/> 你的目标校 · 弱点重叠度 78%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

function difficultyLabel(d) {
  return { easy: "简单", medium: "中等", hard: "偏难", very_hard: "极难" }[d] || "中等";
}

// ---------- University Detail ----------
function UniversityDetailScreen({ universityId, onBack, onOpenQuestionList, onOpenQuestion, onOpenForum, onWriteReview, onOpenProfessor }) {
  const u = KAKOMON_UNIVERSITIES.find(x => x.id === universityId);
  const [tab, setTab] = useStateK2("概览");
  const tabs = ["概览", "过去问", "评分", "教授", "论坛"];

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title={u.nameCn} subtitle={u.nameJp} onBack={onBack}
        right={<button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="bookmark" size={18}/></button>}
      />

      {/* Hero */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad-lg" style={{
          background: `linear-gradient(135deg, var(--${u.accent}-50), #fff)`,
          borderColor: `var(--${u.accent}-100)`,
        }}>
          <div className="row gap-3">
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `var(--${u.accent}-600)`, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 20, flexShrink: 0,
            }}>{u.short.slice(0,1)}</div>
            <div className="col flex1">
              <div className="row gap-2"><span className="text-lg fw-700">{u.nameCn}</span></div>
              <div className="text-xs muted">{u.nameJp} · {u.nameEn}</div>
              <div className="row gap-2" style={{ marginTop: 6 }}>
                <span className="chip slate">{u.type === "national" ? "国立" : "私立"}</span>
                <span className="chip slate">{u.region}</span>
                <DifficultyBadge label={difficultyLabel(u.examDifficulty)} level={u.examDifficulty} />
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
            <DetailStat icon="star" value={u.rating.toFixed(1)} label="综合评分" color="amber" />
            <DetailStat icon="book" value={u.pastExamCount} label="过去问" color={u.accent} />
            <DetailStat icon="message" value={u.reviewCount} label="评价" color="indigo" />
          </div>
        </div>
      </div>

      <TopTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "概览" && (
        <div className="fade-in">
          <div className="section">
            <h3>修考难度评分</h3>
            <div className="card card-pad-lg">
              <DimensionBars dims={u.dimensions} accent={u.accent} />
            </div>
          </div>

          <div className="section">
            <h3>热门科目分布</h3>
            <div className="card card-pad">
              <div className="col" style={{ gap: 10 }}>
                {[
                  { s: "数学", c: 124, pct: 90 },
                  { s: "情报", c: 88, pct: 64 },
                  { s: "物理", c: 56, pct: 41 },
                  { s: "英语", c: 44, pct: 32 },
                ].map((x, i) => (
                  <div key={i}>
                    <div className="row-between" style={{ marginBottom: 4 }}>
                      <span className="text-xs fw-500">{x.s}</span>
                      <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>{x.c} 题</span>
                    </div>
                    <div className="bar"><div className="bar-fill" style={{ width: x.pct + "%", background: `var(--${u.accent}-500)` }}/></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="card card-pad" style={{ background: "var(--green-50)", borderColor: "#bbf7d0" }}>
              <div className="row gap-2"><Icon name="check" size={14} className="text-green"/><span className="text-sm fw-600 text-green">适合你</span></div>
              <div className="text-xs text-slate-700" style={{ marginTop: 4, lineHeight: 1.6 }}>{u.suitableFor}。基于你的弱点，建议先攻克 <b>线性代数 · 固有值与对角化</b>。</div>
            </div>
          </div>

          <div className="section">
            <h3>相似学校</h3>
            <div className="scroll-x">
              {KAKOMON_UNIVERSITIES.filter(x => x.id !== u.id).slice(0, 4).map(x => (
                <div key={x.id} className="card card-pad" style={{ flex: "0 0 140px" }}>
                  <div className="text-sm fw-600">{x.short}</div>
                  <div className="text-xs muted">{x.nameJp}</div>
                  <div className="row gap-2" style={{ marginTop: 6 }}>
                    <Icon name="star" size={11} className="text-amber" fill="var(--amber-500)" stroke="var(--amber-500)" />
                    <span className="text-xs fw-600" style={{ fontFamily: "var(--font-num)" }}>{x.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 24 }} />
        </div>
      )}

      {tab === "过去问" && (
        <div className="section fade-in">
          <div className="card card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => onOpenQuestionList(u.id)}>
            <div className="col" style={{ gap: 2 }}>
              <div className="text-sm fw-600">浏览全部 {u.pastExamCount} 道题目</div>
              <div className="text-xs muted">2014-2024 · 按年份/科目筛选</div>
            </div>
            <Icon name="chevronRight" size={18}/>
          </div>
          <div className="col" style={{ gap: 8, marginTop: 12 }}>
            <div className="text-xs fw-600 muted" style={{ marginLeft: 4 }}>最热</div>
            {KAKOMON_QUESTIONS.filter(q => q.universityId === u.id).slice(0, 4).map(q => (
              <div key={q.id} className="card card-pad" onClick={() => onOpenQuestion(q.id)} style={{ cursor: "pointer" }}>
                <div className="row gap-2" style={{ marginBottom: 6 }}>
                  <span className="text-xs fw-600 muted" style={{ fontFamily: "var(--font-num)" }}>{q.year}</span>
                  <span className="text-xs muted">{q.subject} · {q.questionNo}</span>
                </div>
                <div className="text-sm fw-600">{q.title}</div>
                {q.knowledgePoints && (
                  <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
                    {q.knowledgePoints.slice(0,2).map(k => <span key={k} className="chip outlined">{k}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ height: 24 }} />
        </div>
      )}

      {tab === "评分" && (
        <div className="section fade-in">
          <div className="card card-pad-lg">
            <div className="text-xs fw-600 muted" style={{ marginBottom: 8 }}>5 个维度评分</div>
            <DimensionBars dims={{
              修考难度: u.dimensions["难度"],
              过去问完整度: u.dimensions["完整度"],
              教授信息透明度: u.dimensions["透明度"],
              合格经验数量: u.dimensions["合格经验"],
              研究科口碑: u.dimensions["口碑"],
            }} accent={u.accent} />
          </div>
          <div className="col" style={{ gap: 8, marginTop: 12 }}>
            <div className="text-xs fw-600 muted" style={{ marginLeft: 4 }}>用户评价</div>
            {[
              { name: "Hiro", badge: "passed", time: "3 周前", score: 4.5,
                text: "过去问透明度比想象中差，教授不会主动公开，需要找学长。但题目质量很高，刷透就能合格。" },
              { name: "Ling", badge: "preparing", time: "1 个月前", score: 4.0,
                text: "数学难度上限偏高但可控，更看重 解法套路熟练度。建议早点开始刷线代。" },
            ].map((r,i) => (
              <div key={i} className="card card-pad">
                <div className="row-between">
                  <div className="row gap-2">
                    <div className="avatar sm">{r.name.slice(0,1)}</div>
                    <span className="text-sm fw-600">{r.name}</span>
                    <AuthorBadge type={r.badge} />
                  </div>
                  <div className="row gap-2">
                    <Icon name="star" size={11} className="text-amber" fill="var(--amber-500)" stroke="var(--amber-500)"/>
                    <span className="text-xs fw-600" style={{ fontFamily: "var(--font-num)" }}>{r.score}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-700" style={{ marginTop: 8, lineHeight: 1.6 }}>{r.text}</div>
                <div className="text-xs muted" style={{ marginTop: 6 }}>{r.time}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-block btn-outlined" style={{ marginTop: 14 }} onClick={onWriteReview}>
            <Icon name="edit" size={14}/> 写评价
          </button>
          <div style={{ height: 24 }} />
        </div>
      )}

      {tab === "教授" && (
        <div className="section fade-in">
          {u.professorHighlights.length > 0 ? (
            <div className="col" style={{ gap: 8 }}>
              {u.professorHighlights.map((p,i) => (
                <div key={i} className="card card-pad" onClick={() => onOpenProfessor && onOpenProfessor(p.name, u.id)} style={{ cursor: "pointer" }}>
                  <div className="row gap-3">
                    <div className="avatar" style={{ background: `linear-gradient(135deg, var(--${u.accent}-500), var(--${u.accent}-600))` }}>{p.name.slice(0,1)}</div>
                    <div className="col flex1" style={{ gap: 2 }}>
                      <div className="text-sm fw-600">{p.name}</div>
                      <div className="text-xs muted">{p.lab}</div>
                    </div>
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <span className="text-xs muted">{p.reviewCount} 评</span>
                      <Icon name="chevronRight" size={14} className="muted"/>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700" style={{ marginTop: 8, lineHeight: 1.6 }}>研究方向：{p.direction}</div>
                  <div className="row gap-2" style={{ marginTop: 8 }}>
                    <span className="chip outlined">考试相关：高</span>
                    <span className="chip outlined">面试友好</span>
                    <span className="chip teal" style={{ marginLeft: "auto" }}><Icon name="sparkles" size={10}/> AI 总结</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint icon="user" text="该校教授信息正在收集中" />
          )}
          <div style={{ height: 24 }} />
        </div>
      )}

      {tab === "论坛" && (
        <div className="section fade-in">
          <div className="col" style={{ gap: 8 }}>
            {KAKOMON_THREADS.filter(t => t.universityId === u.id).slice(0, 4).map(t => (
              <ThreadCard key={t.id} thread={t} onOpen={() => onOpenForum(t.id)} />
            ))}
          </div>
          <div style={{ height: 24 }} />
        </div>
      )}
    </div>
  );
}

function DetailStat({ icon, value, label, color }) {
  return (
    <div className="col" style={{ alignItems: "flex-start", gap: 2, padding: "6px 0" }}>
      <div className="row gap-2" style={{ color: `var(--${color}-600)` }}>
        <Icon name={icon} size={12} />
        <span className="text-xs fw-500 muted">{label}</span>
      </div>
      <div className="text-xl fw-700" style={{ fontFamily: "var(--font-num)" }}>{value}</div>
    </div>
  );
}

window.UniversityListScreen = UniversityListScreen;
window.UniversityDetailScreen = UniversityDetailScreen;
window.difficultyLabel = difficultyLabel;
