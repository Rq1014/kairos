// ============================================================
// 教授详情 + 资料互助详情 + 大学对比
// ============================================================

const { useState: useStateB3 } = React;

// ────────────────────────────────────────────────────────────
// 1. 教授详情（含 AI 自动总结）
// ────────────────────────────────────────────────────────────
function ProfessorDetailScreen({ professorName, universityId, isPro, onBack, onUpgradePro, onOpenQuestion }) {
  const u = KAKOMON_UNIVERSITIES.find(x => x.id === universityId);
  const detail = KAKOMON_PROFESSOR_DETAILS[professorName];

  if (!detail) {
    return (
      <div className="screen fade-in">
        <StatusBar />
        <AppHeader title={professorName} onBack={onBack}/>
        <EmptyHint icon="user" text="该教授详情正在收集中"/>
      </div>
    );
  }

  const relatedQs = (detail.relatedQuestions || []).map(qid => KAKOMON_QUESTIONS.find(q => q.id === qid)).filter(Boolean);

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title={detail.nameJp} subtitle={u.short + " · " + detail.lab.split(" · ")[0]} onBack={onBack}
        right={<button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="bookmark" size={18}/></button>}
      />

      {/* Hero */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad-lg" style={{ background: `linear-gradient(135deg, var(--${u.accent}-50), #fff)`, borderColor: `var(--${u.accent}-100, var(--slate-200))` }}>
          <div className="row gap-3">
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: `linear-gradient(135deg, var(--${u.accent}-500), var(--${u.accent}-700, var(--${u.accent}-600)))`,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 22, flexShrink: 0,
            }}>{detail.nameJp[0]}</div>
            <div className="col flex1" style={{ gap: 3 }}>
              <div className="text-lg fw-700">{detail.nameJp}</div>
              <div className="text-xs muted">{detail.nameRoman}</div>
              <div className="row gap-2" style={{ marginTop: 4 }}>
                <span className="chip slate">{detail.title}</span>
                <span className="chip outlined">{detail.since}~</span>
              </div>
              <div className="text-xs text-slate-700" style={{ marginTop: 6 }}>{detail.lab}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
            <div className="col"><span className="text-xs muted">年均招收</span><span className="text-lg fw-700" style={{ fontFamily: "var(--font-num)" }}>{detail.admission.yearly}</span></div>
            <div className="col"><span className="text-xs muted">报录比</span><span className="text-lg fw-700 text-amber" style={{ fontFamily: "var(--font-num)" }}>{detail.admission.applyRatio.toFixed(1)}:1</span></div>
            <div className="col"><span className="text-xs muted">论文</span><span className="text-lg fw-700 text-indigo" style={{ fontFamily: "var(--font-num)" }}>{detail.publications}</span></div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="section">
        <h3>
          <span className="row gap-2"><Icon name="sparkles" size={14} className="text-teal"/><span>AI 自动总结</span></span>
          <span className="badge" style={{ background: "var(--teal-50)", color: "var(--teal-700)" }}>基于近 3 年论文 + 学长经验</span>
        </h3>
        {isPro ? (
          <ProfessorAiSummary detail={detail} full={true}/>
        ) : (
          <>
            <ProfessorAiSummary detail={detail} full={false}/>
            <div className="card card-pad" style={{ background: "linear-gradient(135deg, #fff7ed, #fff)", borderColor: "#fde68a", marginTop: 10 }}>
              <div className="row gap-2"><Icon name="lock" size={12} className="text-amber"/><span className="text-xs fw-600 text-amber">解锁完整分析 — 出题倾向 / 面试套路 / 适配度评估</span></div>
              <button className="btn btn-sm" onClick={onUpgradePro} style={{ marginTop: 8, background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff" }}>
                <Icon name="crown" size={11}/> 升级 Pro
              </button>
            </div>
          </>
        )}
      </div>

      {/* Research direction */}
      <div className="section">
        <h3>研究方向</h3>
        <div className="card card-pad">
          <div className="text-sm text-slate-800" style={{ lineHeight: 1.6 }}>{detail.direction}</div>
          <div className="row gap-2" style={{ marginTop: 10, flexWrap: "wrap" }}>
            {detail.recentTopics.map(t => <span key={t} className="chip blue">#{t}</span>)}
          </div>
        </div>
      </div>

      {/* 关联过去问 */}
      {relatedQs.length > 0 && (
        <div className="section">
          <h3>近年出题</h3>
          <div className="col" style={{ gap: 8 }}>
            {relatedQs.map(q => (
              <div key={q.id} className="card card-pad" onClick={() => onOpenQuestion(q.id)} style={{ cursor: "pointer" }}>
                <div className="row gap-2" style={{ marginBottom: 4 }}>
                  <span className={"chip " + u.accent}>{u.short}</span>
                  <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>{q.year} · {q.subject} {q.questionNo}</span>
                </div>
                <div className="text-sm fw-600">{q.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 学长经验 */}
      <div className="section">
        <h3>
          <span>学长经验帖</span>
          <span className="more">{detail.experiences.length} 条</span>
        </h3>
        <div className="col" style={{ gap: 8 }}>
          {detail.experiences.map((ex, i) => (
            <div key={i} className="card card-pad">
              <div className="row gap-2"><AuthorBadge type="passed"/><span className="text-xs fw-600">{ex.author.split(" · ")[1]}</span><span className="text-xs muted">{ex.time}</span></div>
              <div className="text-sm text-slate-800" style={{ marginTop: 8, lineHeight: 1.6 }}>{ex.text}</div>
              <div className="row gap-3" style={{ marginTop: 10 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><Icon name="thumbsUp" size={12}/> {ex.upvotes}</button>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>查看完整帖</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 24 }}/>
    </div>
  );
}

function ProfessorAiSummary({ detail, full }) {
  const blocks = [
    { icon: "brain", color: "blue",   label: "研究方向重点",  text: detail.aiSummary.researchFocus, gated: false },
    { icon: "flame", color: "rose",   label: "出题倾向",       text: detail.aiSummary.examPattern, gated: !full },
    { icon: "user",  color: "indigo", label: "面试风格",       text: detail.aiSummary.interviewStyle, gated: !full },
    { icon: "check", color: "green",  label: "推荐适配人群",   text: detail.aiSummary.recommendation, gated: !full },
  ];
  return (
    <div className="card card-pad">
      <div className="col" style={{ gap: 14 }}>
        {blocks.map((b, i) => (
          <div key={i}>
            <div className="row gap-2" style={{ marginBottom: 6 }}>
              <Icon name={b.icon} size={14} style={{ color: `var(--${b.color}-600)` }}/>
              <span className="text-sm fw-600">{b.label}</span>
              {b.gated && <span className="badge pro" style={{ fontSize: 9 }}><Icon name="crown" size={9}/> PRO</span>}
            </div>
            <div className="text-sm text-slate-700" style={{
              lineHeight: 1.7, paddingLeft: 22,
              filter: b.gated ? "blur(3px)" : "none",
              opacity: b.gated ? 0.6 : 1,
              userSelect: b.gated ? "none" : "auto",
            }}>{b.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 2. 资料互助详情（区分于普通帖子）
// ────────────────────────────────────────────────────────────
function MaterialRequestScreen({ threadId, onBack, onOpenQuestion }) {
  const t = KAKOMON_THREADS.find(x => x.id === threadId);
  const d = KAKOMON_MATERIAL_REQUEST_DETAIL[threadId] || {
    requestType: "需要",
    target: { university: t.universityId, year: 2024, subject: "数学", part: "全套" },
    progress: 0,
    canOffer: [],
    timeline: [{ time: "刚刚", text: "发起求助", icon: "alert" }],
    offers: [],
  };
  const u = KAKOMON_UNIVERSITIES.find(x => x.id === t.universityId);
  const stages = ["求助中", "有人响应", "进行中", "已采纳"];

  return (
    <div className="screen fade-in" style={{ paddingBottom: 130 }}>
      <StatusBar />
      <AppHeader title="资料互助" onBack={onBack}
        right={<button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="more" size={18}/></button>}
      />

      {/* Request hero */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad-lg" style={{ background: d.progress === 3 ? "linear-gradient(135deg, var(--green-50), #fff)" : "linear-gradient(135deg, var(--amber-50), #fff)", borderColor: d.progress === 3 ? "var(--green-100)" : "var(--amber-100)" }}>
          <div className="row gap-2" style={{ marginBottom: 8 }}>
            <span className={"badge " + (d.requestType === "需要" ? "unsolved" : "solved")}>
              <Icon name={d.requestType === "需要" ? "download" : "upload"} size={10}/> {d.requestType}
            </span>
            <span className="chip outlined">{u.short}</span>
            <span className="chip outlined">{d.target.year}</span>
            <span className="chip outlined">{d.target.subject}</span>
          </div>
          <div className="text-lg fw-700" style={{ lineHeight: 1.35 }}>{t.title}</div>
          <div className="text-sm text-slate-700" style={{ marginTop: 8, lineHeight: 1.6 }}>{t.excerpt}</div>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="section">
        <div className="card card-pad">
          <div className="text-xs fw-600 muted" style={{ marginBottom: 12 }}>互助进度</div>
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            {stages.map((s, i) => (
              <React.Fragment key={s}>
                <div className="col" style={{ alignItems: "center", flex: "0 0 auto", gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: i <= d.progress ? "var(--amber-500)" : "var(--slate-200)",
                    color: i <= d.progress ? "#fff" : "var(--slate-500)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-num)",
                  }}>{i < d.progress ? <Icon name="check" size={14} strokeWidth={2.6}/> : i + 1}</div>
                  <span className="text-xs" style={{ color: i <= d.progress ? "var(--slate-800)" : "var(--slate-400)", fontWeight: i === d.progress ? 600 : 400 }}>{s}</span>
                </div>
                {i < stages.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < d.progress ? "var(--amber-500)" : "var(--slate-200)", margin: "0 4px", marginTop: -16 }}/>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Target detail card */}
      <div className="section">
        <h3>具体需求</h3>
        <div className="card card-pad">
          <div className="col" style={{ gap: 10 }}>
            <Row label="学校"   value={<span className={"chip " + u.accent}>{u.nameCn}</span>}/>
            <Row label="年份"   value={<span className="text-sm fw-600" style={{ fontFamily: "var(--font-num)" }}>{d.target.year}</span>}/>
            <Row label="科目"   value={<span className="text-sm">{d.target.subject}</span>}/>
            <Row label="范围"   value={<span className="text-sm">{d.target.part}</span>}/>
          </div>
        </div>
      </div>

      {/* What user can offer in exchange */}
      {d.canOffer.length > 0 && (
        <div className="section">
          <h3>我可以交换</h3>
          <div className="col" style={{ gap: 8 }}>
            {d.canOffer.map((c, i) => (
              <div key={i} className="card card-pad" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Icon name="upload" size={14} className="text-green"/>
                <span className="text-sm flex1">{c}</span>
                <span className="badge solved">可提供</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="section">
        <h3>动态</h3>
        <div className="card card-pad">
          <div className="col" style={{ gap: 0 }}>
            {d.timeline.map((step, i, arr) => (
              <div key={i} className="row gap-3" style={{ alignItems: "flex-start" }}>
                <div className="col" style={{ alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 999,
                    background: step.future ? "var(--slate-100)" : "var(--amber-100)",
                    color: step.future ? "var(--slate-400)" : "var(--amber-600)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name={step.icon} size={11}/></div>
                  {i < arr.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: step.future ? "var(--slate-100)" : "var(--amber-100)" }}/>}
                </div>
                <div className="col" style={{ paddingBottom: i < arr.length - 1 ? 14 : 0, flex: 1 }}>
                  <span className="text-sm" style={{ color: step.future ? "var(--slate-400)" : "var(--slate-800)" }}>{step.text}</span>
                  <span className="text-xs muted" style={{ marginTop: 2 }}>{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offers */}
      <div className="section">
        <h3>{d.offers.length} 条响应</h3>
        <div className="col" style={{ gap: 8 }}>
          {d.offers.map((o, i) => (
            <div key={i} className="card card-pad">
              <div className="row gap-2">
                <div className="avatar sm">{o.author[0]}</div>
                <div className="col flex1">
                  <div className="row gap-2">
                    <span className="text-xs fw-600">{o.author}</span>
                    <AuthorBadge type={o.badge}/>
                  </div>
                  <span className="text-xs muted">{o.time}</span>
                </div>
                <button className="btn btn-sm" style={{ background: "var(--green-500)", color: "#fff", padding: "5px 10px" }}>采纳</button>
              </div>
              <div className="text-sm text-slate-800" style={{ marginTop: 8, lineHeight: 1.6 }}>{o.body}</div>
              <div className="row gap-3" style={{ marginTop: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><Icon name="thumbsUp" size={12}/> {o.upvotes}</button>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>私聊</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 16 }}/>

      {/* Sticky "我能提供" CTA */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 64,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid var(--slate-200)",
        backdropFilter: "blur(10px)",
      }}>
        <div className="row gap-2">
          <button className="btn btn-outlined" style={{ flex: "0 0 auto" }}>
            <Icon name="message" size={14}/> 私聊
          </button>
          <button className="btn btn-block" style={{ flex: 1, background: "linear-gradient(135deg, var(--amber-500), var(--amber-600))", color: "#fff" }}>
            <Icon name="upload" size={14}/> 我能提供这份资料
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="row-between">
      <span className="text-xs muted">{label}</span>
      <div>{value}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 3. 大学对比页
// ────────────────────────────────────────────────────────────
function UniversityCompareScreen({ initialIds = [], onBack, onOpenUniversity }) {
  const [selected, setSelected] = useStateB3(initialIds.length === 2 ? initialIds : ["todai", "titech"]);
  const [showPicker, setShowPicker] = useStateB3(null); // 0 | 1 | null

  const [a, b] = selected.map(id => KAKOMON_UNIVERSITIES.find(u => u.id === id));
  const dims = ["难度", "完整度", "透明度", "合格经验", "口碑", "资料丰富度"];

  const commonSubjects = a.hotSubjects.filter(s => b.hotSubjects.includes(s));

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title="并排对比" subtitle="决定哪所更适合你" onBack={onBack}/>

      {/* school selector — 2 columns */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="row gap-2">
          {[a, b].map((u, i) => (
            <button key={i} className="card card-pad" onClick={() => setShowPicker(i)} style={{
              flex: 1, textAlign: "left",
              background: `linear-gradient(135deg, var(--${u.accent}-50), #fff)`,
              borderColor: `var(--${u.accent}-200, var(--slate-200))`,
            }}>
              <div className="row gap-2" style={{ marginBottom: 4 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `var(--${u.accent}-600)`, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>{u.short.slice(0,1)}</div>
                <div className="col flex1" style={{ minWidth: 0 }}>
                  <span className="text-sm fw-700 truncate">{u.short}</span>
                  <span className="text-xs muted truncate">{u.nameJp}</span>
                </div>
                <Icon name="chevronDown" size={14} className="muted"/>
              </div>
              <div className="row gap-2" style={{ marginTop: 8 }}>
                <Icon name="star" size={11} className="text-amber" fill="var(--amber-500)" stroke="var(--amber-500)"/>
                <span className="text-sm fw-700" style={{ fontFamily: "var(--font-num)" }}>{u.rating.toFixed(1)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI overall recommendation */}
      <div className="section">
        <div className="card card-pad" style={{ background: "linear-gradient(135deg, #f0fdfa, #fff)", borderColor: "#99f6e4" }}>
          <div className="row gap-2"><Icon name="sparkles" size={14} className="text-teal"/><span className="text-sm fw-600 text-teal">AI 适配建议</span></div>
          <div className="text-sm text-slate-800" style={{ marginTop: 6, lineHeight: 1.6 }}>
            基于你的弱点（线代固有值 / 算法 DP）和过去问重叠度：<b className={`text-${a.accent}`}>{a.short}</b> 难度上限更高但解法套路集中；<b className={`text-${b.accent}`}>{b.short}</b> 题量更大覆盖更广。
          </div>
          <div className="row gap-2" style={{ marginTop: 10 }}>
            <span className="chip green">推荐：{b.short}</span>
            <span className="text-xs muted">理由：和你目标重叠度 92%</span>
          </div>
        </div>
      </div>

      {/* 5+1 维度并排 */}
      <div className="section">
        <h3>修考维度对比</h3>
        <div className="card card-pad-lg">
          <div className="col" style={{ gap: 14 }}>
            {dims.map(d => {
              const av = a.dimensions[d];
              const bv = b.dimensions[d];
              const winner = av === bv ? null : (av > bv ? "a" : "b");
              return (
                <div key={d}>
                  <div className="row-between" style={{ marginBottom: 6 }}>
                    <span className="text-xs fw-500">{d}</span>
                    <div className="row gap-2">
                      <span className="text-xs fw-600" style={{ color: winner === "a" ? `var(--${a.accent}-600)` : "var(--slate-500)", fontFamily: "var(--font-num)" }}>{av}</span>
                      <span className="text-xs muted">·</span>
                      <span className="text-xs fw-600" style={{ color: winner === "b" ? `var(--${b.accent}-600)` : "var(--slate-500)", fontFamily: "var(--font-num)" }}>{bv}</span>
                    </div>
                  </div>
                  {/* center-aligned dual bar */}
                  <div className="row" style={{ alignItems: "center", gap: 4 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--slate-100)", overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ width: av + "%", height: "100%", background: `var(--${a.accent}-500)`, borderRadius: 999 }}/>
                    </div>
                    <div style={{ width: 1, height: 10, background: "var(--slate-300)" }}/>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--slate-100)", overflow: "hidden" }}>
                      <div style={{ width: bv + "%", height: "100%", background: `var(--${b.accent}-500)`, borderRadius: 999 }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="section">
        <h3>关键数据</h3>
        <div className="card card-pad">
          <div className="col" style={{ gap: 12 }}>
            <StatCompareRow label="过去问"   av={a.pastExamCount}  bv={b.pastExamCount} a={a} b={b}/>
            <StatCompareRow label="评价数"   av={a.reviewCount}    bv={b.reviewCount}   a={a} b={b}/>
            <StatCompareRow label="综合评分" av={a.rating}         bv={b.rating}        a={a} b={b} unit=""/>
          </div>
        </div>
      </div>

      {/* Common subjects */}
      <div className="section">
        <h3>共有热门科目</h3>
        <div className="card card-pad">
          {commonSubjects.length === 0 ? (
            <div className="text-xs muted" style={{ textAlign: "center" }}>没有交集，方向差异较大</div>
          ) : (
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {commonSubjects.map(s => (
                <span key={s} className="chip" style={{ background: "var(--purple-50)", color: "var(--purple-600)" }}>
                  <Icon name="link" size={10}/> {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suitable for */}
      <div className="section">
        <h3>适合人群对比</h3>
        <div className="row gap-2">
          {[a, b].map(u => (
            <div key={u.id} className="card card-pad" style={{ flex: 1, background: `var(--${u.accent}-50)`, borderColor: `var(--${u.accent}-100, var(--slate-200))` }}>
              <div className="text-xs fw-700" style={{ color: `var(--${u.accent}-700, var(--${u.accent}-600))`, marginBottom: 6 }}>{u.short}</div>
              <div className="text-xs text-slate-700" style={{ lineHeight: 1.55 }}>{u.suitableFor}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail CTAs */}
      <div className="section">
        <div className="row gap-2">
          <button className="btn btn-outlined btn-block" style={{ flex: 1 }} onClick={() => onOpenUniversity(a.id)}>{a.short} 详情</button>
          <button className="btn btn-outlined btn-block" style={{ flex: 1 }} onClick={() => onOpenUniversity(b.id)}>{b.short} 详情</button>
        </div>
      </div>

      {/* picker sheet */}
      <BottomSheet open={showPicker !== null} onClose={() => setShowPicker(null)} title="选择对比学校">
        <div className="col" style={{ gap: 8 }}>
          {KAKOMON_UNIVERSITIES.map(u => (
            <button key={u.id} className="card card-pad" onClick={() => {
              const next = [...selected];
              next[showPicker] = u.id;
              setSelected(next);
              setShowPicker(null);
            }} style={{
              textAlign: "left",
              border: selected[showPicker] === u.id ? `2px solid var(--${u.accent}-500)` : "1px solid var(--slate-200)",
            }}>
              <div className="row gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `var(--${u.accent}-50)`, color: `var(--${u.accent}-600)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{u.short.slice(0,1)}</div>
                <div className="col flex1">
                  <span className="text-sm fw-600">{u.nameCn}</span>
                  <span className="text-xs muted">{u.nameJp}</span>
                </div>
                <span className="text-sm fw-700" style={{ fontFamily: "var(--font-num)" }}>{u.rating.toFixed(1)}</span>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      <div style={{ height: 24 }}/>
    </div>
  );
}

function StatCompareRow({ label, av, bv, a, b, unit = "" }) {
  const winner = av === bv ? null : av > bv ? "a" : "b";
  return (
    <div className="row-between">
      <span className="text-xs muted">{label}</span>
      <div className="row gap-3">
        <span className="text-sm fw-700" style={{ color: winner === "a" ? `var(--${a.accent}-600)` : "var(--slate-500)", fontFamily: "var(--font-num)" }}>{av}{unit}</span>
        <span className="text-xs muted">vs</span>
        <span className="text-sm fw-700" style={{ color: winner === "b" ? `var(--${b.accent}-600)` : "var(--slate-500)", fontFamily: "var(--font-num)" }}>{bv}{unit}</span>
      </div>
    </div>
  );
}

window.ProfessorDetailScreen = ProfessorDetailScreen;
window.MaterialRequestScreen = MaterialRequestScreen;
window.UniversityCompareScreen = UniversityCompareScreen;
