// ============================================================
// K3 — Study Dashboard, University List, Question List
// ============================================================

const { useState } = React;

// ---------- Study Dashboard ----------
function StudyDashboard({ user, onOpenQuestion, onOpenUniversity, onAskAi, onOpenWrongBook, onSearchQuestions, onOpenReferences, onOpenForum, onOpenNotifications }) {
  const [editOpen, setEditOpen] = useState(false);
  const [targetCfg, setTargetCfg] = useState({
    type: "graduate", // graduate | undergrad
    schools: user.targetUniversityIds, // ids
    grad: "情报理工学系研究科", // 研究科 / 学院
    major: user.major, // 主修
    subjects: ["数学", "情报"] // 需考科目
  });
  const target = KAKOMON_UNIVERSITIES.filter((u) => targetCfg.schools.includes(u.id));
  const continueQ = KAKOMON_QUESTIONS.find((q) => q.id === "q-todai-2024-math-3");

  // 距下次考试还有多少天（基于 user.nextExam）
  const exam = user.nextExam;
  const daysToExam = exam ? Math.max(0, Math.ceil((new Date(exam.date) - new Date()) / 86400000)) : null;
  const examMonth = exam ? new Date(exam.date).getMonth() + 1 : null;
  const examDay = exam ? new Date(exam.date).getDate() : null;
  const urgencyColor = daysToExam !== null ? daysToExam < 30 ? "rose" : daysToExam < 90 ? "amber" : "blue" : "blue";
  const recommended = KAKOMON_QUESTIONS.filter((q) => ["q-titech-2021-math-2", "q-kyodai-2023-math-1", "q-waseda-2024-stat-2"].includes(q.id));
  const crossSchool = "东工大 2021 也考过同样的对角化思路";

  // weak point top 3
  const weakTop = [...user.weakPoints].sort((a, b) => b.level - a.level).slice(0, 4);

  return (
    <div className="screen fade-in">
      <StatusBar />
      <div style={{ padding: "4px 16px 0" }}>
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div className="col" style={{ gap: 2 }}>
            <div className="text-xs muted">早上好，</div>
            <div className="text-2xl fw-700" style={{ letterSpacing: "-0.01em" }}>{user.nickname}</div>

            {/* 考试倒计时 — 已移到右上角，这里不再展示 */}

            <div className="row gap-2" style={{ marginTop: 10, flexWrap: "wrap" }}>
              <span className="chip slate" style={{ fontSize: 11 }}>
                <Icon name="flag" size={10} /> {targetCfg.type === "graduate" ? "大学院（修考）" : "学部"}
              </span>
              {target.map((u) =>
              <span key={u.id} className="chip blue" style={{ cursor: "pointer" }} onClick={() => onOpenUniversity(u.id)}>
                  <Icon name="flag" size={11} /> {u.short}
                </span>
              )}
              <span className="chip outlined chip-btn" style={{ cursor: "pointer" }} onClick={() => setEditOpen(true)}>+ 修改目标</span>
            </div>
            <div className="text-xs muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
              {targetCfg.grad} · {targetCfg.subjects.join(" / ")}
            </div>
          </div>
          <div className="row gap-2">
            {/* 考试倒计时 — 小方块 */}
            {exam &&
              <button title={`${exam.name} · ${exam.date}`} style={{
                width: 44, height: 44, borderRadius: 10,
                background: `linear-gradient(135deg, var(--${urgencyColor}-500), var(--${urgencyColor}-600))`,
                color: "#fff",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-num)", lineHeight: 1,
                boxShadow: `0 4px 10px -3px var(--${urgencyColor}-100)`,
              }}>
                <span style={{ fontSize: 9, fontFamily: "var(--font-cn)", opacity: 0.92, marginBottom: 3, letterSpacing: "0.02em" }}>考</span>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>{daysToExam}<span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>d</span></span>
              </button>
            }
            <button className="icon-btn" onClick={onOpenNotifications} style={{ position: "relative", width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="bell" size={18} />
              <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, background: "var(--rose-500)", borderRadius: 999 }} />
            </button>
          </div>
        </div>
      </div>

      {/* AI quota strip */}
      <div className="section">
        <div className="card" style={{
          background: "linear-gradient(135deg, #ecfeff 0%, #f0f9ff 100%)",
          borderColor: "var(--cyan-500)", borderWidth: 0,
          backgroundImage: "linear-gradient(135deg, #f0fdfa, #eff6ff)"
        }}>
          <div className="card-pad row-between gap-3">
            <div className="row gap-3">
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, var(--teal-500), var(--cyan-500))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="sparkles" size={18} />
              </div>
              <div className="col" style={{ gap: 1 }}>
                <div className="text-sm fw-600">AI 提问额度</div>
                <div className="text-xs muted">今日剩 <b className="text-teal">{user.freeAiRemaining}</b> 次免费 · Token <b className="text-amber" style={{ fontFamily: "var(--font-num)" }}>{user.tokenBalance}</b></div>
              </div>
            </div>
            <button className="btn btn-sm" style={{ background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff", padding: "6px 12px" }}>
              <Icon name="crown" size={11} /> 升级 Pro
            </button>
          </div>
        </div>
      </div>

      {/* Continue studying */}
      <div className="section">
        <h3>继续学习</h3>
        <div className="card" onClick={() => onOpenQuestion(continueQ.id)} style={{ cursor: "pointer" }}>
          <div className="card-pad">
            <div className="row gap-2" style={{ marginBottom: 8 }}>
              <span className="chip blue">东大 · 2024</span>
              <span className="chip slate">数学 第3问</span>
              <span className="chip amber">中等偏难</span>
            </div>
            <div className="text-md fw-600" style={{ lineHeight: 1.4 }}>{continueQ.title}</div>
            <div className="text-xs muted" style={{ marginTop: 6, lineHeight: 1.5 }}>已读完 标准解析 · 剩余「举一反三」3 题未完成</div>
            <div className="bar" style={{ marginTop: 10 }}>
              <div className="bar-fill" style={{ width: "55%" }} />
            </div>
            <div className="row-between" style={{ marginTop: 6 }}>
              <span className="text-xs muted">进度 55%</span>
              <span className="text-xs text-blue fw-600">继续 <Icon name="forward" size={11} /></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="section">
        <h3>快捷</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
          { icon: "search", label: "搜过去问", color: "blue", onClick: onSearchQuestions },
          { icon: "flame", label: "错题本", color: "rose", onClick: onOpenWrongBook },
          { icon: "sparkles", label: "问 AI", color: "teal", onClick: onAskAi },
          { icon: "pageRef", label: "参考书索引", color: "indigo", onClick: onOpenReferences }].
          map((a, i) =>
          <button key={i} className="card card-pad" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 8px" }} onClick={a.onClick}>
              <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `var(--${a.color}-50)`,
              color: `var(--${a.color}-600)`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
                <Icon name={a.icon} size={18} />
              </div>
              <span className="text-xs fw-500 text-slate-700">{a.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Weak points mini heatmap */}
      <div className="section">
        <h3>
          <span>弱点地图</span>
          <span className="more">查看完整 <Icon name="chevronRight" size={12} /></span>
        </h3>
        <div className="card card-pad">
          <div className="col" style={{ gap: 10 }}>
            {weakTop.map((w, i) =>
            <div key={i}>
                <div className="row-between" style={{ marginBottom: 4 }}>
                  <div className="row gap-2">
                    <span className="text-xs fw-600">{w.subject}</span>
                    <span className="text-xs muted">/ {w.point}</span>
                  </div>
                  <span className="text-xs muted">{w.count} 错题</span>
                </div>
                <div className="bar"><div className={"bar-fill " + (w.level >= 4 ? "rose" : w.level === 3 ? "amber" : "teal")} style={{ width: w.level * 22 + "%" }} /></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-school alert */}
      <div className="section">
        <div className="card card-pad" style={{ background: "var(--purple-50)", borderColor: "#e9d5ff", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ color: "var(--purple-600)", marginTop: 2 }}>
            <Icon name="link" size={18} />
          </div>
          <div className="col flex1" style={{ gap: 4 }}>
            <div className="text-sm fw-600" style={{ color: "var(--purple-600)" }}>跨校关联提醒</div>
            <div className="text-xs text-slate-700" style={{ lineHeight: 1.5 }}>{crossSchool}。和你目标校重叠度 <b>92%</b>，建议加入举一反三训练。</div>
            <button className="text-xs fw-600" style={{ color: "var(--purple-600)", alignSelf: "flex-start", marginTop: 2 }} onClick={() => onOpenQuestion("q-todai-2024-math-3")}>查看 →</button>
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div className="section">
        <h3>
          <span>推荐过去问</span>
          <span className="more">基于你的弱点 · {target.map((t) => t.short).join(" · ")}</span>
        </h3>
        <div className="col" style={{ gap: 8 }}>
          {recommended.map((q) => {
            const u = KAKOMON_UNIVERSITIES.find((x) => x.id === q.universityId);
            return (
              <div key={q.id} className="card" onClick={() => onOpenQuestion(q.id)} style={{ cursor: "pointer" }}>
                <div className="card-pad">
                  <div className="row gap-2" style={{ marginBottom: 6 }}>
                    <span className={"chip " + u.accent}>{u.short}</span>
                    <span className="chip slate">{q.year} · {q.subject}</span>
                    <span className="text-xs muted" style={{ marginLeft: "auto" }}>{q.questionNo}</span>
                  </div>
                  <div className="text-sm fw-600" style={{ lineHeight: 1.4 }}>{q.title}</div>
                  <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
                    {q.knowledgePoints.slice(0, 3).map((k) => <span key={k} className="chip outlined">{k}</span>)}
                  </div>
                </div>
              </div>);

          })}
        </div>
      </div>

      <div style={{ height: 24 }} />

      <EditTargetSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        value={targetCfg}
        onSave={(v) => {setTargetCfg(v);setEditOpen(false);}} />
      
    </div>);

}

// ---------- Edit Target Sheet ----------
function EditTargetSheet({ open, onClose, value, onSave }) {
  const [draft, setDraft] = useState(value);
  const [view, setView] = useState("main"); // main | picker
  React.useEffect(() => {
    if (open) { setDraft(value); setView("main"); }
  }, [open, value]);

  const types = [
    { v: "graduate",  label: "大学院（修考）", desc: "修士入试 / 院试", icon: "trophy" },
    { v: "undergrad", label: "学部",            desc: "本科入试 / 编入",  icon: "book" },
  ];
  const majors = ["情报理工", "电子情报", "机械工", "数理工", "经济", "材料工", "建筑", "外语", "经营", "其他"];
  const subjects = ["数学", "情报", "物理", "化学", "英语", "专业课", "面试"];

  const toggle = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const removeSchool = (id) => {
    setDraft(d => {
      const next = { ...d, schools: d.schools.filter(x => x !== id) };
      if (d.schoolGrads) {
        const sg = { ...d.schoolGrads };
        delete sg[id];
        next.schoolGrads = sg;
      }
      if (d.schoolMajors) {
        const sm = { ...d.schoolMajors };
        delete sm[id];
        next.schoolMajors = sm;
      }
      return next;
    });
  };
  const addSchool = (id, grad, majorId) => {
    setDraft(d => ({
      ...d,
      schools: d.schools.includes(id) ? d.schools : [...d.schools, id],
      schoolGrads:  { ...(d.schoolGrads || {}),  [id]: grad     || null },
      schoolMajors: { ...(d.schoolMajors || {}), [id]: majorId  || null },
    }));
  };

  const valid = draft.schools.length > 0 && draft.subjects.length > 0;

  // ----- Picker sub-view -----
  if (view === "picker") {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <SchoolSearchPicker
          selected={draft.schools}
          schoolGrads={draft.schoolGrads || {}}
          schoolMajors={draft.schoolMajors || {}}
          max={8}
          onAdd={addSchool}
          onRemove={removeSchool}
          onBack={() => setView("main")}
        />
      </BottomSheet>
    );
  }

  // ----- AI Recommend sub-view -----
  if (view === "recommend") {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <SchoolRecommendPanel
          major={draft.major}
          subjects={draft.subjects}
          schools={draft.schools}
          max={8}
          onAdd={addSchool}
          onBack={() => setView("main")}
        />
      </BottomSheet>
    );
  }

  // ----- Main view -----
  const selectedSchools = draft.schools.map(id => KAKOMON_UNIVERSITIES.find(u => u.id === id)).filter(Boolean);

  return (
    <BottomSheet open={open} onClose={onClose} title="修改目标">
      <div className="col" style={{ gap: 18, paddingTop: 4 }}>

        {/* Type */}
        <div className="col" style={{ gap: 8 }}>
          <div className="text-sm fw-600">备考类型</div>
          <div className="row gap-2">
            {types.map(t => (
              <button key={t.v} onClick={() => setDraft(d => ({ ...d, type: t.v }))} className="card" style={{
                flex: 1, padding: "12px 10px", textAlign: "left",
                border: draft.type === t.v ? "2px solid var(--blue-500)" : "1px solid var(--slate-200)",
                background: draft.type === t.v ? "var(--blue-50)" : "#fff",
              }}>
                <div className="row gap-2">
                  <Icon name={t.icon} size={14} style={{ color: draft.type === t.v ? "var(--blue-600)" : "var(--slate-500)" }}/>
                  <span className="text-sm fw-600">{t.label}</span>
                </div>
                <span className="text-xs muted" style={{ marginTop: 4, display: "block" }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target schools — compact row */}
        <div className="col" style={{ gap: 8 }}>
          <div className="row-between">
            <div className="text-sm fw-600">目标校</div>
            <span className="text-xs muted">已选 <b className="text-blue" style={{ fontFamily: "var(--font-num)" }}>{draft.schools.length}</b> · 至多 8 所</span>
          </div>

          {selectedSchools.length === 0 ? (
            <div className="row gap-2">
              <button onClick={() => setView("picker")} className="card" style={{
                flex: 1, padding: "14px 10px", textAlign: "left",
                border: "1px solid var(--slate-200)", background: "#fff",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <div className="row gap-2">
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--blue-50)", color: "var(--blue-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="search" size={14}/>
                  </div>
                  <span className="text-sm fw-700">手动选择</span>
                </div>
                <span className="text-xs muted" style={{ lineHeight: 1.4 }}>搜索学校名 · 选择研究科和専攻</span>
              </button>
              <button onClick={() => setView("recommend")} className="card" style={{
                flex: 1, padding: "14px 10px", textAlign: "left",
                border: "1px solid #99f6e4",
                background: "linear-gradient(135deg, var(--teal-50), #fff)",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
                <div className="row gap-2">
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,var(--teal-500),var(--cyan-500))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="sparkles" size={14}/>
                  </div>
                  <span className="text-sm fw-700 text-teal">AI 推荐</span>
                </div>
                <span className="text-xs muted" style={{ lineHeight: 1.4 }}>按你的专业 + 科目自动匹配</span>
              </button>
            </div>
          ) : (
            <div className="col" style={{ gap: 6 }}>
              {selectedSchools.map(u => {
                const grad = (draft.schoolGrads || {})[u.id];
                const majorId = (draft.schoolMajors || {})[u.id];
                const majorKey = grad ? `${u.id}::${grad}` : null;
                const majorList = majorKey && window.UNI_MAJORS ? window.UNI_MAJORS[majorKey] : null;
                const majorObj = majorList && majorId ? majorList.find(m => m.id === majorId) : null;
                const subline = grad
                  ? (majorObj ? `${grad} · ${majorObj.short}` : grad)
                  : "未指定研究科";
                return (
                  <div key={u.id} className="card card-pad" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: `var(--${u.accent}-50)`,
                      color: `var(--${u.accent}-600)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>{u.short.slice(0,1)}</div>
                    <div className="col flex1" style={{ gap: 1, minWidth: 0 }}>
                      <span className="text-sm fw-600 truncate">{u.short} · {u.nameJp}</span>
                      <span className="text-xs muted truncate">{subline}</span>
                    </div>
                    <button className="icon-btn" onClick={() => removeSchool(u.id)} style={{ width: 28, height: 28, borderRadius: 999, color: "var(--slate-400)" }}>
                      <Icon name="close" size={14}/>
                    </button>
                  </div>
                );
              })}
              <div className="row gap-2" style={{ marginTop: 4 }}>
                <button onClick={() => setView("picker")} className="btn btn-outlined btn-sm" style={{ flex: 1, padding: "8px 12px" }}>
                  <Icon name="search" size={12}/> 手动添加
                </button>
                <button onClick={() => setView("recommend")} className="btn btn-sm" style={{
                  flex: 1, padding: "8px 12px",
                  background: "linear-gradient(135deg, var(--teal-500), var(--cyan-500))",
                  color: "#fff",
                }}>
                  <Icon name="sparkles" size={12}/> AI 推荐
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Major */}
        <div className="col" style={{ gap: 8 }}>
          <div className="text-sm fw-600">专业方向</div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {majors.map(m => (
              <Chip key={m} color="indigo" selected={draft.major === m} onClick={() => setDraft(d => ({ ...d, major: m }))}>{m}</Chip>
            ))}
          </div>
          <span className="text-xs muted" style={{ marginLeft: 2 }}>系统会根据专业自动匹配对应学院 / 系</span>
        </div>

        {/* Subjects */}
        <div className="col" style={{ gap: 8 }}>
          <div className="row-between">
            <div className="text-sm fw-600">需考科目</div>
            <span className="text-xs muted">已选 <b className="text-amber" style={{ fontFamily: "var(--font-num)" }}>{draft.subjects.length}</b></span>
          </div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {subjects.map(s => (
              <Chip key={s} color="slate" selected={draft.subjects.includes(s)}
                onClick={() => setDraft(d => ({ ...d, subjects: toggle(d.subjects, s) }))}>{s}</Chip>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" disabled={!valid} onClick={() => onSave(draft)} style={{
          background: valid ? "var(--blue-600)" : "var(--slate-200)",
          color: valid ? "#fff" : "var(--slate-500)",
        }}>
          <Icon name="check" size={14}/> 保存目标
        </button>
        <div style={{ height: 8 }}/>
      </div>
    </BottomSheet>
  );
}

// ---------- School Search Picker (sheet sub-view: type / search / select with optional 研究科) ----------
function SchoolSearchPicker({ selected, schoolGrads, schoolMajors, max, onAdd, onRemove, onBack }) {
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  // 展开后内部的"暂选 研究科"草稿，按 schoolId 存
  const [draftGrad, setDraftGrad] = useState({});

  const kw = q.trim().toLowerCase();
  const list = KAKOMON_UNIVERSITIES.filter(u => {
    if (!kw) return true;
    return u.nameCn.toLowerCase().includes(kw)
      || u.nameJp.toLowerCase().includes(kw)
      || u.short.toLowerCase().includes(kw)
      || u.nameEn.toLowerCase().includes(kw)
      || (u.regionGroup || "").toLowerCase().includes(kw);
  });

  const selectedSet = new Set(selected);
  const hotShorts = ["东大", "东工大", "京大", "早大", "庆应", "一桥"];

  return (
    <div className="col" style={{ gap: 12, paddingTop: 0 }}>
      {/* Header */}
      <div className="row gap-2" style={{ paddingBottom: 4, alignItems: "center" }}>
        <button className="icon-btn" onClick={onBack} style={{ width: 32, height: 32, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="back" size={18}/>
        </button>
        <div className="col flex1" style={{ minWidth: 0 }}>
          <span className="text-md fw-600">选择目标校</span>
          <span className="text-xs muted">搜索后点击选择 · 可附加研究科</span>
        </div>
        <span className="text-xs" style={{ color: selected.length >= max ? "var(--rose-500)" : "var(--slate-500)", fontFamily: "var(--font-num)", fontWeight: 600 }}>
          {selected.length}/{max}
        </span>
      </div>

      {/* Search input */}
      <div style={{ position: "relative" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          autoFocus
          placeholder="输入学校名 · 东大 / 早大 / Tokyo / 慶應"
          style={{
            width: "100%", height: 42, borderRadius: 12,
            border: "1px solid var(--slate-200)",
            padding: "0 38px 0 38px", fontSize: 14, outline: "none",
            background: "var(--slate-50)",
          }}
        />
        <div style={{ position: "absolute", left: 14, top: 12, color: "var(--slate-400)" }}><Icon name="search" size={16}/></div>
        {q && (
          <button onClick={() => setQ("")} style={{ position: "absolute", right: 10, top: 11, color: "var(--slate-400)" }}>
            <Icon name="close" size={16}/>
          </button>
        )}
      </div>

      {/* Hot suggestions when empty query */}
      {!kw && (
        <div className="col" style={{ gap: 6 }}>
          <span className="text-xs muted" style={{ marginLeft: 2 }}>热门</span>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {hotShorts.map(s => (
              <Chip key={s} color="blue" onClick={() => setQ(s)}>{s}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="col" style={{ gap: 8 }}>
        <span className="text-xs muted" style={{ marginLeft: 2 }}>
          {kw ? `${list.length} 个匹配结果` : `全部 ${list.length} 所大学`}
        </span>
        {list.length === 0 ? (
          <div className="text-xs muted" style={{ textAlign: "center", padding: "30px 0" }}>
            没找到「{q}」相关的大学。试试日文名或简称。
          </div>
        ) : list.map(u => {
          const isSelected = selectedSet.has(u.id);
          const isExpanded = expandedId === u.id;
          const currentGrad = schoolGrads[u.id];
          const grads = (window.UNI_GRADS && window.UNI_GRADS[u.id]) || [];
          const atLimit = !isSelected && selected.length >= max;

          return (
            <div key={u.id} className="card" style={{
              borderColor: isSelected ? `var(--${u.accent}-500)` : "var(--slate-200)",
              borderWidth: isSelected ? 2 : 1,
              background: isSelected ? `var(--${u.accent}-50)` : "#fff",
            }}>
              <button
                onClick={() => {
                  if (atLimit) return;
                  setExpandedId(isExpanded ? null : u.id);
                }}
                style={{ width: "100%", padding: 12, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                disabled={atLimit}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: isSelected ? `var(--${u.accent}-600)` : `var(--${u.accent}-50)`,
                  color: isSelected ? "#fff" : `var(--${u.accent}-600)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{u.short.slice(0,1)}</div>
                <div className="col flex1" style={{ gap: 2, minWidth: 0 }}>
                  <div className="row gap-2">
                    <span className="text-sm fw-700">{u.short}</span>
                    <span className="text-xs muted truncate">{u.nameJp}</span>
                  </div>
                  <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                    <span className="badge" style={{ fontSize: 10, background: u.type === "private" ? "var(--indigo-50)" : "var(--blue-50)", color: u.type === "private" ? "var(--indigo-600)" : "var(--blue-700)" }}>
                      {u.type === "private" ? "私立" : "国公立"}
                    </span>
                    <span className="text-xs muted">{u.regionGroup}</span>
                    {isSelected && currentGrad && (
                      <span className="text-xs fw-500" style={{ color: `var(--${u.accent}-700)` }}>· {currentGrad}</span>
                    )}
                  </div>
                </div>
                {isSelected ? (
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: `var(--${u.accent}-600)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="check" size={12} strokeWidth={3}/>
                  </span>
                ) : (
                  <div style={{ flexShrink: 0, color: atLimit ? "var(--slate-300)" : "var(--slate-500)" }}>
                    {atLimit ? <span className="text-xs">已满</span> : <Icon name="chevronDown" size={16}/>}
                  </div>
                )}
              </button>

              {/* Expanded panel: pick 研究科 + 専攻 */}
              {isExpanded && (
                <div style={{ padding: "0 12px 12px", borderTop: "1px solid var(--slate-100)" }}>
                  <ExpandedSchoolPicker
                    u={u}
                    isSelected={isSelected}
                    currentGrad={currentGrad}
                    currentMajor={(schoolMajors || {})[u.id]}
                    grads={grads}
                    draftGrad={draftGrad[u.id] || currentGrad}
                    setDraftGrad={(g) => setDraftGrad(d => ({ ...d, [u.id]: g }))}
                    onAdd={onAdd}
                    onRemove={() => { onRemove(u.id); setExpandedId(null); }}
                    onClose={() => setExpandedId(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={onBack} style={{ marginTop: 4 }}>
        <Icon name="check" size={14}/> 完成（已选 {selected.length}）
      </button>
      <div style={{ height: 8 }}/>
    </div>
  );
}

// ---------- AI School Recommend Panel ----------
function SchoolRecommendPanel({ major, subjects, schools, max, onAdd, onBack }) {
  const [generating, setGenerating] = useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setGenerating(false), 600);
    return () => clearTimeout(t);
  }, []);

  // 计算推荐 — 简单按专业 + 科目模糊匹配
  const recommendations = React.useMemo(() => {
    const subjectSet = new Set(subjects || []);
    const sci = ["情报理工", "电子情报", "数理工", "机械工", "材料工", "建筑"].includes(major);
    const econ = ["经济", "经营"].includes(major);
    const lang = ["外语"].includes(major);

    const scored = KAKOMON_UNIVERSITIES.map(u => {
      let score = 0;
      let reasons = [];
      // hotSubject 命中
      const hits = u.hotSubjects.filter(s => subjectSet.has(s));
      if (hits.length) { score += hits.length * 30; reasons.push(`覆盖 ${hits.join(" / ")}`); }
      // 类型偏好
      if (sci && u.tags.includes("理工"))  { score += 15; reasons.push("理工强项"); }
      if (econ && u.tags.includes("文商")) { score += 18; reasons.push("文商对口"); }
      if (econ && u.id === "hitotsubashi") { score += 20; reasons.push("经济顶尖"); }
      if (lang && u.id === "sophia")       { score += 25; reasons.push("外语顶尖"); }
      // 评分
      score += (u.rating - 4) * 12;
      // 完整度加成
      score += (u.pastExamCount > 200 ? 6 : 0);
      return { u, score, reasons };
    }).filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return scored;
  }, [major, subjects.join(",")]);

  const schoolSet = new Set(schools);

  // 自动选 best grad based on major + subjects
  const pickGrad = (uId) => {
    const grads = window.UNI_GRADS ? window.UNI_GRADS[uId] : null;
    if (!grads) return null;
    if (["情报理工", "电子情报"].includes(major)) return grads.find(g => g.includes("情报")) || grads[0];
    if (["机械工", "材料工"].includes(major))    return grads.find(g => g.includes("工"))   || grads[0];
    if (major === "经济")                         return grads.find(g => g.includes("经济")) || grads[0];
    if (major === "外语")                         return grads.find(g => g.includes("外") || g.includes("文")) || grads[0];
    return grads[0];
  };

  const hasInput = (major || "").trim() && (subjects || []).length > 0;

  return (
    <div className="col" style={{ gap: 12 }}>
      {/* Header */}
      <div className="row gap-2" style={{ paddingBottom: 4, alignItems: "center" }}>
        <button className="icon-btn" onClick={onBack} style={{ width: 32, height: 32, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="back" size={18}/>
        </button>
        <div className="col flex1" style={{ minWidth: 0 }}>
          <div className="row gap-2">
            <span className="text-md fw-600">AI 推荐目标校</span>
            <span className="badge" style={{ background: "linear-gradient(135deg,var(--teal-500),var(--cyan-500))", color: "#fff" }}>BETA</span>
          </div>
          <span className="text-xs muted">基于你的专业 + 需考科目自动匹配</span>
        </div>
        <span className="text-xs" style={{ color: schools.length >= max ? "var(--rose-500)" : "var(--slate-500)", fontFamily: "var(--font-num)", fontWeight: 600 }}>{schools.length}/{max}</span>
      </div>

      {/* Input summary */}
      <div className="card card-pad" style={{ background: "var(--slate-50)", borderColor: "var(--slate-200)" }}>
        <div className="row gap-2" style={{ marginBottom: 6 }}>
          <Icon name="zap" size={11} className="text-teal"/>
          <span className="text-xs fw-600 muted">你的输入</span>
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {major ? <span className="chip indigo">{major}</span> : <span className="chip outlined" style={{ color: "var(--slate-400)" }}>未填专业</span>}
          {(subjects || []).map(s => <span key={s} className="chip slate">{s}</span>)}
          {(subjects || []).length === 0 && <span className="chip outlined" style={{ color: "var(--slate-400)" }}>未选科目</span>}
        </div>
      </div>

      {!hasInput && (
        <div className="card card-pad" style={{ background: "var(--amber-50)", borderColor: "#fde68a" }}>
          <div className="row gap-2"><Icon name="alert" size={13} className="text-amber"/><span className="text-xs fw-600 text-amber">需要更多信息</span></div>
          <div className="text-xs text-slate-700" style={{ marginTop: 4, lineHeight: 1.5 }}>
            返回主界面填写「专业方向」+「需考科目」后，AI 才能为你匹配合适的学校与研究科。
          </div>
          <button className="btn btn-outlined btn-sm" style={{ marginTop: 10 }} onClick={onBack}>返回填写</button>
        </div>
      )}

      {hasInput && generating && (
        <div className="col" style={{ gap: 10, padding: "20px 0", alignItems: "center" }}>
          <div className="row gap-2">
            {[0,1,2].map(i => (
              <span key={i} style={{ width: 7, height: 7, borderRadius: 99, background: "var(--teal-500)", animation: `pulse 1.2s ${i*0.15}s infinite` }} />
            ))}
          </div>
          <span className="text-xs muted">AI 匹配中…</span>
          <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
        </div>
      )}

      {hasInput && !generating && (
        <>
          <div className="row-between">
            <span className="text-xs muted">为你推荐 {recommendations.length} 所</span>
            <span className="text-xs text-teal fw-600">按匹配度排序</span>
          </div>
          <div className="col" style={{ gap: 8 }}>
            {recommendations.map((r, idx) => {
              const { u, reasons } = r;
              const matchPct = Math.min(98, 60 + idx === 0 ? 32 : 30 - idx * 5);
              const isSel = schoolSet.has(u.id);
              const atLimit = !isSel && schools.length >= max;
              const recommendedGrad = pickGrad(u.id);
              return (
                <div key={u.id} className="card" style={{
                  borderColor: idx === 0 ? "var(--teal-500)" : "var(--slate-200)",
                  borderWidth: idx === 0 ? 2 : 1,
                  position: "relative",
                }}>
                  {idx === 0 && (
                    <span style={{
                      position: "absolute", top: -8, left: 12,
                      background: "linear-gradient(135deg, var(--teal-500), var(--cyan-500))",
                      color: "#fff", fontSize: 10, fontWeight: 700,
                      padding: "2px 8px", borderRadius: 999,
                    }}>最佳匹配</span>
                  )}
                  <div className="card-pad-lg" style={{ padding: 14 }}>
                    <div className="row gap-3">
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `var(--${u.accent}-50)`,
                        color: `var(--${u.accent}-600)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 15, flexShrink: 0,
                      }}>{u.short.slice(0,1)}</div>
                      <div className="col flex1" style={{ gap: 2, minWidth: 0 }}>
                        <div className="row-between">
                          <span className="text-sm fw-700">{u.short} · {u.nameJp}</span>
                          <span className="text-xs fw-700 text-teal" style={{ fontFamily: "var(--font-num)" }}>{matchPct}%</span>
                        </div>
                        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                          <span className="badge" style={{ fontSize: 10, background: u.type === "private" ? "var(--indigo-50)" : "var(--blue-50)", color: u.type === "private" ? "var(--indigo-600)" : "var(--blue-700)" }}>
                            {u.type === "private" ? "私立" : "国公立"}
                          </span>
                          <span className="text-xs muted">{u.regionGroup}</span>
                        </div>
                      </div>
                    </div>

                    {/* match bar */}
                    <div className="bar" style={{ marginTop: 10 }}>
                      <div className="bar-fill teal" style={{ width: matchPct + "%" }}/>
                    </div>

                    {/* reasons */}
                    {reasons.length > 0 && (
                      <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                        {reasons.map(r => <span key={r} className="chip teal" style={{ fontSize: 11 }}><Icon name="check" size={10}/> {r}</span>)}
                      </div>
                    )}

                    {/* recommended 研究科 */}
                    {recommendedGrad && (
                      <div className="text-xs muted" style={{ marginTop: 8 }}>
                        推荐研究科：<b style={{ color: `var(--${u.accent}-700, var(--${u.accent}-600))`, fontWeight: 600 }}>{recommendedGrad}</b>
                      </div>
                    )}

                    {/* add button */}
                    <button
                      onClick={() => { if (!atLimit) onAdd(u.id, recommendedGrad, null); }}
                      className="btn btn-block btn-sm"
                      disabled={atLimit && !isSel}
                      style={{
                        marginTop: 10, padding: "8px 12px",
                        background: isSel
                          ? "var(--green-50)"
                          : (atLimit ? "var(--slate-100)" : "linear-gradient(135deg, var(--teal-500), var(--cyan-500))"),
                        color: isSel ? "var(--green-700)" : (atLimit ? "var(--slate-400)" : "#fff"),
                      }}>
                      {isSel
                        ? <><Icon name="check" size={12} strokeWidth={2.6}/> 已加入</>
                        : (atLimit ? "已满 8 所" : <><Icon name="plus" size={12} strokeWidth={2.4}/> 一键加入</>)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {recommendations.length === 0 && (
            <div className="text-xs muted" style={{ textAlign: "center", padding: "24px 0" }}>
              暂时没有特别匹配的学校，试试调整专业方向或扩大科目范围
            </div>
          )}
        </>
      )}

      <button className="btn btn-primary btn-block btn-lg" onClick={onBack} style={{ marginTop: 4 }}>
        <Icon name="check" size={14}/> 完成（已选 {schools.length}）
      </button>
      <div style={{ height: 8 }}/>
    </div>
  );
}

// ---------- Expanded school picker: 研究科 → 専攻 二级选择 ----------
function ExpandedSchoolPicker({ u, isSelected, currentGrad, currentMajor, grads, draftGrad, setDraftGrad, onAdd, onRemove, onClose }) {
  const activeGrad = draftGrad || currentGrad;
  const majorKey = activeGrad ? `${u.id}::${activeGrad}` : null;
  const majorList = majorKey && window.UNI_MAJORS ? window.UNI_MAJORS[majorKey] : null;

  return (
    <>
      {/* Row 1 — 研究科 */}
      <div className="row-between" style={{ marginTop: 10, marginBottom: 8 }}>
        <span className="text-xs fw-600 muted">① 研究科 / 学院 <span style={{ fontWeight: 400 }}>· 可选</span></span>
        {isSelected && (
          <button onClick={onRemove} className="text-xs text-rose fw-600">移除该校</button>
        )}
      </div>
      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        {grads.map(g => (
          <Chip key={g} color={u.accent} selected={activeGrad === g}
            onClick={() => setDraftGrad(activeGrad === g ? null : g)}>
            {g}
          </Chip>
        ))}
      </div>

      {/* Row 2 — 専攻 (only when 研究科 picked and we have data) */}
      {activeGrad && majorList && (
        <div className="fade-in" style={{ marginTop: 12, padding: 10, background: `var(--${u.accent}-50)`, borderRadius: 10 }}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="text-xs fw-600" style={{ color: `var(--${u.accent}-700, var(--${u.accent}-600))` }}>② 専攻 / コース <span style={{ fontWeight: 400, color: "var(--slate-500)" }}>· {majorList.length} 选 1</span></span>
            <span className="text-xs muted truncate" style={{ maxWidth: "55%" }}>{activeGrad}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            {majorList.map(m => {
              const sel = currentMajor === m.id;
              return (
                <button key={m.id} onClick={() => { onAdd(u.id, activeGrad, m.id); onClose(); }} className="card" style={{
                  padding: "8px 10px", textAlign: "left",
                  border: sel ? `2px solid var(--${u.accent}-500)` : "1px solid var(--slate-200)",
                  background: sel ? "#fff" : "#fff",
                  display: "flex", flexDirection: "column", gap: 2,
                }}>
                  <div className="row gap-2" style={{ alignItems: "baseline" }}>
                    <span className="text-xs fw-700" style={{ color: `var(--${u.accent}-700, var(--${u.accent}-600))`, fontFamily: "var(--font-num)", letterSpacing: "0.02em" }}>{m.short}</span>
                    <span className="text-xs fw-600 truncate" style={{ color: "var(--slate-800)" }}>{m.label}</span>
                  </div>
                  {m.desc && <span className="text-xs muted truncate" style={{ fontSize: 10.5 }}>{m.desc}</span>}
                </button>
              );
            })}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, padding: "6px 8px", fontSize: 11 }} onClick={() => { onAdd(u.id, activeGrad, null); onClose(); }}>
            暂不指定専攻 · 仅添加研究科
          </button>
        </div>
      )}

      {/* No 専攻 data: show "暂不指定" only */}
      {activeGrad && !majorList && (
        <button className="btn btn-outlined btn-sm" style={{ marginTop: 12, padding: "6px 12px" }} onClick={() => { onAdd(u.id, activeGrad, null); onClose(); }}>
          <Icon name="check" size={11}/> 选择「{activeGrad}」并添加
        </button>
      )}

      {/* No 研究科 picked yet */}
      {!activeGrad && !isSelected && (
        <button className="btn btn-outlined btn-sm" style={{ marginTop: 10, padding: "6px 12px" }} onClick={() => { onAdd(u.id, null, null); onClose(); }}>
          暂不指定 · 直接添加
        </button>
      )}
    </>
  );
}

function QuestionListScreen({ universityId, onBack, onOpenQuestion }) {
  const u = KAKOMON_UNIVERSITIES.find((x) => x.id === universityId);
  const allQuestions = KAKOMON_QUESTIONS.filter((q) => q.universityId === universityId);
  const fillCount = Math.max(0, 8 - allQuestions.length); // pad with synthetic for visual density
  const [year, setYear] = useState("全部");
  const [subject, setSubject] = useState("全部");

  const synthetic = [
  { id: "syn-1", year: 2023, subject: "数学", questionNo: "第1问", title: "线性变换与基变换", difficultyLabel: "中等", knowledgePoints: ["线性变换"], masteryStatus: "mastered" },
  { id: "syn-2", year: 2023, subject: "数学", questionNo: "第2问", title: "微分方程组", difficultyLabel: "中等", knowledgePoints: ["微分方程"] },
  { id: "syn-3", year: 2022, subject: "情报", questionNo: "第1问", title: "图论：最短路", difficultyLabel: "中等", knowledgePoints: ["图论"] },
  { id: "syn-4", year: 2022, subject: "情报", questionNo: "第3问", title: "动态规划：背包变形", difficultyLabel: "难", knowledgePoints: ["DP"], masteryStatus: "wrong" },
  { id: "syn-5", year: 2021, subject: "数学", questionNo: "第1问", title: "傅里叶级数展开", difficultyLabel: "中等", knowledgePoints: ["傅里叶"] },
  { id: "syn-6", year: 2021, subject: "数学", questionNo: "第3问", title: "概率：贝叶斯推断", difficultyLabel: "中等偏难", knowledgePoints: ["概率"] }];

  const list = [...allQuestions, ...synthetic].slice(0, 8);

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title={u.nameCn} subtitle={u.nameJp + " · " + u.pastExamCount + " 题"} onBack={onBack} right={<button className="icon-btn" style={{ width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="search" size={18} /></button>} />

      <div className="section" style={{ marginTop: 8 }}>
        <div className="scroll-x" style={{ marginBottom: 6 }}>
          {["全部", "2024", "2023", "2022", "2021", "2020"].map((y) =>
          <Chip key={y} color="slate" selected={year === y} onClick={() => setYear(y)}>{y}</Chip>
          )}
        </div>
        <div className="scroll-x">
          {["全部", "数学", "情报", "物理", "英语"].map((s) =>
          <Chip key={s} color="blue" selected={subject === s} onClick={() => setSubject(s)}>{s}</Chip>
          )}
        </div>
      </div>

      <div className="section">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <span className="text-sm muted">{list.length} 题</span>
          <span className="text-xs text-blue fw-600 row gap-2"><Icon name="filter" size={12} /> 排序</span>
        </div>
        <div className="col" style={{ gap: 8 }}>
          {list.map((q) =>
          <div key={q.id} className="card" onClick={() => q.id.startsWith("syn") ? null : onOpenQuestion(q.id)} style={{ cursor: q.id.startsWith("syn") ? "default" : "pointer" }}>
              <div className="card-pad">
                <div className="row-between">
                  <div className="row gap-2">
                    <span className="text-xs fw-600 muted" style={{ fontFamily: "var(--font-num)" }}>{q.year}</span>
                    <span className="text-xs muted">{q.subject} · {q.questionNo}</span>
                  </div>
                  {q.masteryStatus === "mastered" && <span className="chip green"><Icon name="check" size={10} /> 我会</span>}
                  {q.masteryStatus === "wrong" && <span className="chip rose">不会</span>}
                </div>
                <div className="text-sm fw-600" style={{ marginTop: 6, lineHeight: 1.4 }}>{q.title}</div>
                <div className="row-between" style={{ marginTop: 8 }}>
                  <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                    {q.knowledgePoints && q.knowledgePoints.slice(0, 2).map((k) => <span key={k} className="chip outlined">{k}</span>)}
                  </div>
                  <span className="chip amber">{q.difficultyLabel}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>);

}

window.StudyDashboard = StudyDashboard;
window.QuestionListScreen = QuestionListScreen;