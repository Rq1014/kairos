// ============================================================
// K3 — Question Detail (the most complete screen)
// ============================================================

const { useState: useStateQD, useMemo: useMemoQD } = React;

function QuestionDetailScreen({ questionId, user, onBack, onAskAi, onOpenQuestion, onUpgradePro }) {
  const q = KAKOMON_QUESTIONS.find(x => x.id === questionId) || KAKOMON_QUESTIONS[0];
  const u = KAKOMON_UNIVERSITIES.find(x => x.id === q.universityId);
  const [mastery, setMastery] = useStateQD(q.masteryStatus || null);
  const [bookmarked, setBookmarked] = useStateQD(false);
  const [crowdVote, setCrowdVote] = useStateQD(null);

  const totalVotes = (q.crowdVotes?.easy ?? 12) + (q.crowdVotes?.medium ?? 38) + (q.crowdVotes?.hard ?? 84);
  const hardPct = Math.round(((q.crowdVotes?.hard ?? 84) / totalVotes) * 100);

  const lvl1 = q.relatedQuestions.filter(r => r.level === 1);
  const lvl2 = q.relatedQuestions.filter(r => r.level === 2);
  const lvl3 = q.relatedQuestions.filter(r => r.level === 3);

  return (
    <div className="screen fade-in" style={{ paddingBottom: 130 }}>
      <StatusBar />
      <AppHeader
        title={`${u.short} · ${q.year}`}
        subtitle={`${q.subject} · ${q.questionNo}`}
        onBack={onBack}
        right={
          <>
            <button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setBookmarked(b => !b)}>
              <Icon name="bookmark" size={18} fill={bookmarked ? "var(--amber-500)" : "none"} stroke={bookmarked ? "var(--amber-500)" : "currentColor"} />
            </button>
            <button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="more" size={18}/></button>
          </>
        }
      />

      {/* Metadata */}
      <div className="section">
        <div className="card card-pad-lg">
          <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 8 }}>
            <span className={"chip " + u.accent}>{u.nameCn}</span>
            <span className="chip slate">{q.graduateSchool}</span>
          </div>
          <div className="text-lg fw-700" style={{ lineHeight: 1.35, marginBottom: 6 }}>{q.title}</div>
          <div className="text-xs muted" style={{ marginBottom: 10 }}>{q.year} · {q.subject} · {q.questionNo}</div>
          <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 10 }}>
            {q.knowledgePoints.map(k => <span key={k} className="chip blue">#{k}</span>)}
          </div>
          <div className="divider-thin" style={{ margin: "8px 0" }} />
          <div className="row-between">
            <div className="row gap-2">
              <DifficultyBadge label={q.difficultyLabel} level="hard" />
              <span className="text-xs muted">·</span>
              <span className="text-xs text-slate-700"><b className="text-amber" style={{ fontFamily: "var(--font-num)" }}>{hardPct}%</b> 用户认为偏难</span>
            </div>
            <span className="text-xs muted">{totalVotes} 票</span>
          </div>
        </div>
      </div>

      {/* Question body */}
      <div className="section">
        <h3>题目</h3>
        <div className="card card-pad-lg">
          <div className="text-sm text-slate-800" style={{ lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {q.bodyText}
          </div>
          <div style={{ marginTop: 12 }}>
            <MathBlock lines={q.formulaPreview || []} />
            <div className="row gap-2" style={{ marginTop: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm"><Icon name="eye" size={12} /> 查看原版</button>
              <button className="btn btn-ghost btn-sm"><Icon name="copy" size={12} /> 复制</button>
            </div>
          </div>
        </div>
      </div>

      {/* Mastery control */}
      <div className="section">
        <h3>掌握情况</h3>
        <div className="card card-pad">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { k: "mastered", label: "我会",  color: "green",  icon: "check" },
              { k: "unclear",  label: "模糊",  color: "amber",  icon: "alert" },
              { k: "wrong",    label: "不会",  color: "rose",   icon: "close" },
            ].map(m => (
              <button key={m.k} onClick={() => setMastery(m.k)} style={{
                padding: "10px 6px",
                borderRadius: 10,
                background: mastery === m.k ? `var(--${m.color}-500)` : `var(--${m.color}-50)`,
                color: mastery === m.k ? "#fff" : `var(--${m.color}-600)`,
                fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: mastery === m.k ? "0" : `1px solid var(--${m.color}-100)`,
                transition: "all .15s",
              }}>
                <Icon name={m.icon} size={14} strokeWidth={2.4} /> {m.label}
              </button>
            ))}
          </div>
          <div className="text-xs muted" style={{ marginTop: 10, textAlign: "center" }}>
            {mastery === "wrong" ? "已加入错题本，将出现在弱点地图" : mastery === "mastered" ? "已掌握，跨校相似题会减少推荐" : mastery === "unclear" ? "稍后会再次推荐复习" : "标记后会更新你的弱点地图与推荐"}
          </div>
        </div>
      </div>

      {/* Crowd difficulty */}
      <div className="section">
        <h3>众包难度校准</h3>
        <div className="card card-pad">
          <div className="text-xs muted" style={{ marginBottom: 8 }}>做完后投票，帮助下一位备考者：</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {[
              { k: "easy", label: "简单", pct: Math.round((q.crowdVotes.easy/totalVotes)*100), color: "green" },
              { k: "medium", label: "适中", pct: Math.round((q.crowdVotes.medium/totalVotes)*100), color: "amber" },
              { k: "hard", label: "偏难", pct: hardPct, color: "rose" },
            ].map(v => (
              <button key={v.k} onClick={() => setCrowdVote(v.k)} style={{
                padding: "8px 6px", borderRadius: 8,
                background: crowdVote === v.k ? `var(--${v.color}-50)` : "transparent",
                border: crowdVote === v.k ? `1px solid var(--${v.color}-500)` : "1px solid var(--slate-200)",
                fontSize: 12, fontWeight: 600,
                color: crowdVote === v.k ? `var(--${v.color}-600)` : "var(--slate-700)",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <span>{v.label}</span>
                <span className="muted text-xs" style={{ fontFamily: "var(--font-num)", fontWeight: 500 }}>{v.pct}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Free standard explanation */}
      <div className="section">
        <h3>
          <span className="row gap-2"><span style={{ width:6, height:14, background:"var(--blue-600)", borderRadius:2, display:"inline-block" }}></span>标准解析</span>
          <span className="badge free">FREE</span>
        </h3>
        <div className="card card-pad-lg">
          <div className="col" style={{ gap: 14 }}>
            {q.standardExplanation.map((s, i) => (
              <div key={i}>
                <div className="row gap-2" style={{ marginBottom: 6 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--blue-50)", color: "var(--blue-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-num)" }}>{i+1}</span>
                  <span className="text-sm fw-600">{s.title}</span>
                </div>
                <div className="text-sm text-slate-700" style={{ lineHeight: 1.7, paddingLeft: 30 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reference book matches */}
      <div className="section">
        <h3>
          <span className="row gap-2"><span style={{ width:6, height:14, background:"var(--teal-500)", borderRadius:2, display:"inline-block" }}></span>参考书对应章节</span>
          <span className="badge free">FREE</span>
        </h3>
        <div className="col" style={{ gap: 8 }}>
          {q.referenceMatches.map(r => (
            <div key={r.id} className="card card-pad">
              <div className="row-between" style={{ marginBottom: 6 }}>
                <div className="row gap-2" style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: "var(--teal-50)", color: "var(--teal-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="book" size={16} />
                  </div>
                  <div className="col flex1" style={{ gap: 1 }}>
                    <div className="text-sm fw-600 truncate">《{r.bookTitle}》</div>
                    <div className="text-xs muted truncate">{r.chapter}</div>
                  </div>
                </div>
                <MatchTypeBadge type={r.matchType} />
              </div>
              <div className="text-xs text-slate-700" style={{ lineHeight: 1.6, marginTop: 4 }}>
                <span className="text-teal fw-600" style={{ fontFamily: "var(--font-num)" }}>{r.pageRange}</span>　·　{r.rewrittenSummary}
              </div>
              <div className="row gap-2" style={{ marginTop: 8, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost btn-sm"><Icon name="copy" size={12} /> 复制页码</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--teal-700)" }}><Icon name="forward" size={12} /> 翻到这页</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro AI extended explanation - locked */}
      <div className="section">
        <h3>
          <span className="row gap-2"><span style={{ width:6, height:14, background:"linear-gradient(135deg,#f59e0b,#f43f5e)", borderRadius:2, display:"inline-block" }}></span>AI 扩展讲解</span>
          <span className="badge pro"><Icon name="crown" size={10}/> PRO</span>
        </h3>
        <LockedContent
          message="深度解析需要解锁 Pro"
          ctaText="升级 Pro 查看"
          height={220}
          onUnlock={onUpgradePro}
        >
          <div className="card card-pad-lg">
            <div className="col" style={{ gap: 10 }}>
              <div className="row gap-2"><Icon name="brain" size={16} className="text-amber" /><span className="text-sm fw-600">为什么这题常出现在东大修考</span></div>
              <div className="text-xs text-slate-700" style={{ lineHeight: 1.6 }}>东大情报理工的线代题以「实对称矩阵 + 算法应用」为核心套路，2019-2024 共出现 5 次。本题是其中最完整的版本……</div>
              <div className="row gap-2"><Icon name="link" size={16} className="text-amber" /><span className="text-sm fw-600">可迁移到哪些题型</span></div>
              <div className="text-xs text-slate-700" style={{ lineHeight: 1.6 }}>1. 数据降维（PCA）；2. 线性回归正规方程；3. 量子力学厄米算符；4. 优化问题中的凸性判定……</div>
              <div className="row gap-2"><Icon name="alert" size={16} className="text-amber" /><span className="text-sm fw-600">常见错误</span></div>
              <div className="text-xs text-slate-700" style={{ lineHeight: 1.6 }}>多数同学忽略了 P 必须为正交矩阵这个前提，直接写 P⁻¹ 而忽略 Pᵀ……</div>
            </div>
          </div>
        </LockedContent>
      </div>

      {/* Three-level related */}
      <div className="section">
        <h3>
          <span className="row gap-2"><span style={{ width:6, height:14, background:"var(--purple-500)", borderRadius:2, display:"inline-block" }}></span>举一反三</span>
          <span className="text-xs muted">三级关联</span>
        </h3>
        <div className="col" style={{ gap: 14 }}>
          <RelatedLevel level={1} label="同题" desc="完全相同考点" color="green" items={lvl1} onOpen={onOpenQuestion} />
          <RelatedLevel level={2} label="相似考点" desc="同父概念 / 相似解法" color="blue" items={lvl2} onOpen={onOpenQuestion} />
          <RelatedLevel level={3} label="跨校相似题" desc="同学科 · 异校风格" color="purple" items={lvl3} onOpen={onOpenQuestion} />
        </div>
      </div>

      {/* Linked forum */}
      <div className="section">
        <div className="card card-pad" style={{ background: "var(--indigo-50)", borderColor: "#c7d2fe" }}>
          <div className="row gap-2" style={{ alignItems: "flex-start" }}>
            <div style={{ color: "var(--indigo-600)", marginTop: 2 }}><Icon name="forum" size={16}/></div>
            <div className="col flex1" style={{ gap: 2 }}>
              <div className="text-sm fw-600 text-indigo">论坛 · 18 条相关讨论</div>
              <div className="text-xs text-slate-700">最热：东大2024数学第3问，为什么一定可对角化？</div>
            </div>
            <Icon name="chevronRight" size={16} className="text-indigo" />
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      {/* Sticky bottom Ask AI bar */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 64,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid var(--slate-200)",
        backdropFilter: "blur(10px)",
        zIndex: 30,
      }}>
        <div className="row gap-2">
          <button className="btn btn-outlined" style={{ flex: "0 0 auto", padding: "10px 12px" }}>
            <Icon name="message" size={14} /> 论坛
          </button>
          <button className="btn btn-teal btn-block" onClick={onAskAi} style={{ flex: 1, padding: "10px 14px", background: "linear-gradient(135deg, var(--teal-600), var(--cyan-600))" }}>
            <Icon name="sparkles" size={14} />
            问这道题
            <span style={{ background: "rgba(255,255,255,0.22)", padding: "2px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 700, marginLeft: 4 }}>
              {user.freeAiRemaining > 0 ? "免费 1/1" : `消耗 1 Token`}
            </span>
          </button>
        </div>
        {user.freeAiRemaining === 0 && !user.isPro && (
          <div className="text-xs muted" style={{ textAlign: "center", marginTop: 6 }}>今日免费提问已用完，明日重置或升级 Pro</div>
        )}
      </div>
    </div>
  );
}

function RelatedLevel({ level, label, desc, color, items, onOpen }) {
  const colorMap = {
    green: { bg: "var(--green-50)", txt: "var(--green-700)", dot: "var(--green-500)" },
    blue:  { bg: "var(--blue-50)",  txt: "var(--blue-700)",  dot: "var(--blue-500)"  },
    purple:{ bg: "var(--purple-50)",txt: "var(--purple-600)",dot: "var(--purple-500)"},
  };
  const c = colorMap[color];
  return (
    <div>
      <div className="row gap-2" style={{ marginBottom: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: c.bg, color: c.txt, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-num)" }}>L{level}</span>
        <span className="text-sm fw-600" style={{ color: c.txt }}>{label}</span>
        <span className="text-xs muted">{desc}</span>
      </div>
      <div className="col" style={{ gap: 8 }}>
        {items.map(r => (
          <div key={r.id} className="card card-pad" onClick={() => onOpen(r.id)} style={{ cursor: "pointer" }}>
            <div className="row-between">
              <div className="row gap-2"><span className="text-xs fw-600 muted" style={{ fontFamily: "var(--font-num)" }}>{r.universityName} · {r.year}</span><span className="text-xs muted">{r.subject} {r.questionNo}</span></div>
              <span className="text-xs fw-600" style={{ color: c.txt, fontFamily: "var(--font-num)" }}>{Math.round(r.confidence * 100)}% 匹配</span>
            </div>
            <div className="text-sm fw-600" style={{ marginTop: 6, lineHeight: 1.4 }}>{r.title}</div>
            <div className="text-xs muted" style={{ marginTop: 4, lineHeight: 1.5 }}>{r.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.QuestionDetailScreen = QuestionDetailScreen;
