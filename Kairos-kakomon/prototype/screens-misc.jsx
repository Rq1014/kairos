// ============================================================
// 杂项屏：Pro 升级 / 通知中心 / 发帖 / 写评价 / Onboarding
// 视觉延续：amber=Pro · indigo=论坛/通知 · blue=学习 · rose=不会
// ============================================================

const { useState: useStateMisc } = React;

// ────────────────────────────────────────────────────────────
// 1. Pro 升级页（Paywall）
// ────────────────────────────────────────────────────────────
function PaywallScreen({ user, onBack, onPurchase }) {
  const [planId, setPlanId] = useStateMisc("yearly");
  const plan = KAKOMON_PLANS.find(p => p.id === planId);

  return (
    <div className="screen fade-in" style={{ background: "linear-gradient(180deg, #fff7ed 0%, var(--slate-50) 30%)", paddingBottom: 130 }}>
      <StatusBar />
      <div className="app-header" style={{ paddingTop: 4 }}>
        <button className="icon-btn" onClick={onBack} style={{ width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={20}/></button>
        <button className="text-xs muted">恢复购买</button>
      </div>

      <div style={{ padding: "8px 20px 0" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 8px 20px -6px rgba(244, 63, 94, 0.4)" }}>
          <Icon name="crown" size={22} strokeWidth={2.2}/>
        </div>
        <div className="text-3xl fw-700" style={{ lineHeight: 1.2, letterSpacing: "-0.02em" }}>升级 Pro</div>
        <div className="text-sm muted" style={{ marginTop: 6, lineHeight: 1.5 }}>解锁 AI 深度讲解 · 无限提问 · 跨校相似题全集</div>
      </div>

      {/* Feature comparison */}
      <div className="section" style={{ marginTop: 18 }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", padding: "10px 14px", background: "var(--slate-100)", fontSize: 11, fontWeight: 600, color: "var(--slate-600)" }}>
            <span>功能</span>
            <span style={{ textAlign: "center" }}>Free</span>
            <span style={{ textAlign: "center" }}><span className="badge pro" style={{ padding: "2px 6px" }}><Icon name="crown" size={9}/> PRO</span></span>
          </div>
          {KAKOMON_PLAN_FEATURES.map((f, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr",
              padding: "11px 14px", fontSize: 13,
              borderTop: i === 0 ? "0" : "1px solid var(--slate-100)",
              alignItems: "center",
            }}>
              <span className="fw-500 text-slate-800">{f.feature}</span>
              <span style={{ textAlign: "center", color: f.free === "—" ? "var(--slate-400)" : "var(--slate-700)", fontSize: 12 }}>{f.free}</span>
              <span style={{ textAlign: "center", color: "var(--amber-700)", fontWeight: 600, fontSize: 12 }}>{f.pro === "✓" ? <Icon name="check" size={14} strokeWidth={2.6}/> : f.pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan selector */}
      <div className="section">
        <h3>选择方案</h3>
        <div className="col" style={{ gap: 10 }}>
          {KAKOMON_PLANS.map(p => (
            <button key={p.id} onClick={() => setPlanId(p.id)} style={{
              background: planId === p.id ? "#fff" : "#fff",
              border: planId === p.id ? "2px solid var(--amber-500)" : "1px solid var(--slate-200)",
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: planId === p.id ? "0 4px 12px -4px rgba(245, 158, 11, 0.3)" : "var(--shadow-sm)",
              position: "relative",
              transition: "all .15s",
            }}>
              {p.badge && (
                <span style={{
                  position: "absolute", top: -8, right: 14,
                  background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff",
                  padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                }}>{p.badge}</span>
              )}
              <div className="col" style={{ alignItems: "flex-start", gap: 2 }}>
                <span className="text-sm fw-600">{p.label}</span>
                {p.savings && <span className="text-xs text-amber fw-600">{p.savings}</span>}
              </div>
              <div className="row gap-2" style={{ alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "var(--slate-500)" }}>¥</span>
                <span className="text-2xl fw-700" style={{ fontFamily: "var(--font-num)", letterSpacing: "-0.02em" }}>{p.price}</span>
                <span className="text-xs muted">{p.unit.replace("元", "").trim()}</span>
                <div style={{ width: 18, height: 18, borderRadius: 999, border: planId === p.id ? "5px solid var(--amber-500)" : "2px solid var(--slate-300)", marginLeft: 6 }}/>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Token pack alternative */}
      <div className="section">
        <h3>不想订阅？买 Token 包</h3>
        <div className="row gap-2">
          {[{n:10,p:8},{n:30,p:18},{n:100,p:48}].map(t => (
            <button key={t.n} className="card card-pad" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, alignItems: "center", padding: "12px 8px" }}>
              <span className="text-lg fw-700" style={{ fontFamily: "var(--font-num)" }}>{t.n}</span>
              <span className="text-xs muted">Token</span>
              <span className="text-xs fw-600 text-amber" style={{ marginTop: 2, fontFamily: "var(--font-num)" }}>¥{t.p}</span>
            </button>
          ))}
        </div>
        <div className="text-xs muted" style={{ marginTop: 8, padding: "0 4px", lineHeight: 1.5 }}>
          1 Token = 1 次 AI 深度提问 · 永久不过期
        </div>
      </div>

      {/* Future ad unlock teaser */}
      <div className="section">
        <div className="card card-pad" style={{ background: "var(--slate-100)", border: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="zap" size={16} className="muted"/>
          <div className="col flex1" style={{ gap: 1 }}>
            <span className="text-sm fw-600">看视频解锁单题</span>
            <span className="text-xs muted">即将上线 · 不想付费的备选方案</span>
          </div>
          <span className="badge" style={{ background: "var(--slate-200)", color: "var(--slate-600)" }}>SOON</span>
        </div>
      </div>

      <div style={{ height: 16 }}/>

      {/* Sticky purchase */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 64,
        padding: "12px 16px",
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid var(--slate-200)",
        backdropFilter: "blur(10px)",
      }}>
        <button className="btn btn-block btn-lg" onClick={onPurchase} style={{
          background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff",
          padding: "14px 16px", fontSize: 15,
        }}>
          <Icon name="crown" size={16}/> 立即升级 · ¥{plan.price} {plan.unit}
        </button>
        <div className="text-xs muted" style={{ textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
          7 天无理由退款 · 微信 / 支付宝 / Apple Pay
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 2. 通知中心
// ────────────────────────────────────────────────────────────
function NotificationsScreen({ onBack, onOpenQuestion, onOpenThread, onUpgradePro }) {
  const [tab, setTab] = useStateMisc("全部");
  const [items, setItems] = useStateMisc(KAKOMON_NOTIFICATIONS);
  const tabs = ["全部", "题目", "弱点", "@ 我", "贡献", "系统"];
  const tabMap = { "题目":"exam", "弱点":"weak", "@ 我":"mention", "贡献":"contrib", "系统":"system" };
  const list = items.filter(n => tab === "全部" || n.type === tabMap[tab]);
  const unread = items.filter(n => n.unread).length;

  const markAllRead = () => setItems(list => list.map(n => ({ ...n, unread: false })));
  const open = (n) => {
    setItems(list => list.map(x => x.id === n.id ? { ...x, unread: false } : x));
    if (n.questionId) onOpenQuestion(n.questionId);
  };

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title="通知" subtitle={unread > 0 ? `${unread} 条未读` : "全部已读"} onBack={onBack}
        right={<button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: 12 }}>全部已读</button>}
      />

      <div className="section" style={{ marginTop: 4 }}>
        <div className="scroll-x">
          {tabs.map(t => <Chip key={t} color="indigo" selected={tab===t} onClick={()=>setTab(t)}>
            {t} {t !== "全部" && items.filter(n => n.type === tabMap[t] && n.unread).length > 0 && (
              <span style={{ background: "var(--rose-500)", color: "#fff", borderRadius: 999, padding: "0 5px", fontSize: 10, marginLeft: 2, fontFamily: "var(--font-num)" }}>{items.filter(n => n.type === tabMap[t] && n.unread).length}</span>
            )}
          </Chip>)}
        </div>
      </div>

      <div className="section">
        {list.length === 0 ? (
          <EmptyHint icon="bell" text="这个分类暂时没有通知"/>
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {list.map(n => (
              <div key={n.id} className="card" onClick={() => open(n)} style={{
                cursor: "pointer",
                background: n.unread ? "#fff" : "var(--slate-50)",
                opacity: n.unread ? 1 : 0.7,
              }}>
                <div className="card-pad row gap-3" style={{ alignItems: "flex-start" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `var(--${n.color}-50)`,
                    color: `var(--${n.color}-600)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, position: "relative",
                  }}>
                    <Icon name={n.icon} size={16}/>
                    {n.unread && <span style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, background: "var(--rose-500)", borderRadius: 999, border: "2px solid #fff" }}/>}
                  </div>
                  <div className="col flex1" style={{ gap: 2, minWidth: 0 }}>
                    <div className="row-between">
                      <span className="text-sm fw-600 truncate">{n.title}</span>
                      <span className="text-xs muted" style={{ flexShrink: 0, marginLeft: 6 }}>{n.time}</span>
                    </div>
                    <div className="text-xs text-slate-700 line-clamp-2" style={{ lineHeight: 1.5 }}>{n.body}</div>
                    {n.actionLabel && (
                      <span className="text-xs fw-600" style={{ color: `var(--${n.color}-600)`, marginTop: 4 }}>{n.actionLabel} →</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 3. 发帖编辑器
// ────────────────────────────────────────────────────────────
function ComposeThreadScreen({ onBack, onSubmit }) {
  const [type, setType] = useStateMisc("question_discussion");
  const [title, setTitle] = useStateMisc("");
  const [body, setBody] = useStateMisc("");
  const [linkedQId, setLinkedQId] = useStateMisc(null);
  const [tags, setTags] = useStateMisc([]);
  const [anonymous, setAnonymous] = useStateMisc(false);
  const [showQuestionPicker, setShowQuestionPicker] = useStateMisc(false);

  const types = [
    { v: "question_discussion", label: "题目讨论", icon: "book", color: "blue" },
    { v: "material_request",    label: "资料互助", icon: "download", color: "amber" },
    { v: "experience",          label: "合格经验", icon: "trophy", color: "green" },
    { v: "study_circle",        label: "同校备考", icon: "user", color: "indigo" },
  ];
  const suggestTags = ["线性代数", "对角化", "动态规划", "重积分", "假设检验", "面试", "选校"];

  const linkedQ = linkedQId ? KAKOMON_QUESTIONS.find(q => q.id === linkedQId) : null;
  const linkedU = linkedQ ? KAKOMON_UNIVERSITIES.find(u => u.id === linkedQ.universityId) : null;

  const toggleTag = (t) => setTags(arr => arr.includes(t) ? arr.filter(x => x !== t) : [...arr, t]);
  const valid = title.trim().length >= 4 && body.trim().length >= 8;

  return (
    <div className="screen fade-in" style={{ paddingBottom: 80 }}>
      <StatusBar />
      <AppHeader title="发帖" onBack={onBack}
        right={
          <button className="btn btn-sm" disabled={!valid} onClick={onSubmit} style={{
            background: valid ? "var(--indigo-600)" : "var(--slate-200)",
            color: valid ? "#fff" : "var(--slate-500)",
            padding: "6px 14px",
          }}>发布</button>
        }
      />

      {/* 分类 */}
      <div className="section" style={{ marginTop: 4 }}>
        <h3>分类</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {types.map(t => (
            <button key={t.v} onClick={() => setType(t.v)} className="card" style={{
              padding: "12px 4px",
              border: type === t.v ? `2px solid var(--${t.color}-500)` : "1px solid var(--slate-200)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              background: type === t.v ? `var(--${t.color}-50)` : "#fff",
            }}>
              <Icon name={t.icon} size={16} style={{ color: type === t.v ? `var(--${t.color}-600)` : "var(--slate-500)" }}/>
              <span className="text-xs fw-600" style={{ color: type === t.v ? `var(--${t.color}-700)` : "var(--slate-700)" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 关联题目 */}
      <div className="section">
        <h3>关联题目 <span className="text-xs muted" style={{ fontWeight: 400 }}>· 可选</span></h3>
        {linkedQ ? (
          <div className="card card-pad" style={{ background: `var(--${linkedU.accent}-50)`, borderColor: `var(--${linkedU.accent}-100, var(--slate-200))` }}>
            <div className="row-between">
              <div className="row gap-2" style={{ flex: 1, minWidth: 0 }}>
                <Icon name="link" size={14} style={{ color: `var(--${linkedU.accent}-600)` }}/>
                <div className="col" style={{ minWidth: 0 }}>
                  <span className="text-sm fw-600 truncate">{linkedQ.title}</span>
                  <span className="text-xs muted">{linkedU.short} · {linkedQ.year} {linkedQ.subject} {linkedQ.questionNo}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setLinkedQId(null)}><Icon name="close" size={14}/></button>
            </div>
          </div>
        ) : (
          <button className="card card-pad btn-block" onClick={() => setShowQuestionPicker(true)} style={{
            border: "1px dashed var(--slate-300)", background: "var(--slate-50)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "16px", color: "var(--slate-500)",
          }}>
            <Icon name="plus" size={14}/> 选择关联题目
          </button>
        )}
      </div>

      {/* 标题 */}
      <div className="section">
        <h3>标题</h3>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="一句话概括你的问题或经验"
          maxLength={50}
          style={{
            width: "100%", height: 44, borderRadius: 10,
            border: "1px solid var(--slate-200)",
            padding: "0 14px", fontSize: 15, fontWeight: 500, outline: "none",
            background: "#fff",
          }}
        />
        <div className="row-between" style={{ marginTop: 4 }}>
          <span className="text-xs muted">{title.length < 4 ? "至少 4 字" : "✓"}</span>
          <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>{title.length}/50</span>
        </div>
      </div>

      {/* 内容 */}
      <div className="section">
        <h3>内容</h3>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={type === "material_request" ? "描述你需要的资料 / 可以交换什么…" : type === "experience" ? "分享你的备考经验、时间线、踩过的坑…" : "把你的疑问 / 想法说清楚，方便大家回复"}
          rows={8}
          style={{
            width: "100%", minHeight: 160, borderRadius: 10,
            border: "1px solid var(--slate-200)",
            padding: "12px 14px", fontSize: 14, lineHeight: 1.6, outline: "none",
            resize: "vertical", background: "#fff",
            fontFamily: "inherit",
          }}
        />
        <div className="row gap-3" style={{ marginTop: 8 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="copy" size={12}/> 插入图片</button>
          <button className="btn btn-ghost btn-sm"><Icon name="link" size={12}/> 插入链接</button>
          <button className="btn btn-ghost btn-sm"><Icon name="book" size={12}/> 引用参考书</button>
        </div>
      </div>

      {/* 标签 */}
      <div className="section">
        <h3>标签 <span className="text-xs muted" style={{ fontWeight: 400 }}>· 至多 3 个</span></h3>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {suggestTags.map(t => (
            <Chip key={t} color="indigo" selected={tags.includes(t)} onClick={() => tags.length < 3 || tags.includes(t) ? toggleTag(t) : null}>
              #{t}
            </Chip>
          ))}
        </div>
      </div>

      {/* 匿名 */}
      <div className="section">
        <div className="card card-pad row-between">
          <div className="row gap-2">
            <Icon name="user" size={14} className="muted"/>
            <span className="text-sm">匿名发帖</span>
          </div>
          <button onClick={() => setAnonymous(!anonymous)} style={{
            width: 38, height: 22, borderRadius: 999,
            background: anonymous ? "var(--indigo-600)" : "var(--slate-300)",
            position: "relative",
          }}>
            <span style={{ position: "absolute", top: 2, left: anonymous ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transition: "all .15s" }}/>
          </button>
        </div>
      </div>

      {/* 关联题目 picker */}
      <BottomSheet open={showQuestionPicker} onClose={() => setShowQuestionPicker(false)} title="选择关联题目">
        <div className="col" style={{ gap: 8 }}>
          {KAKOMON_QUESTIONS.map(q => {
            const u = KAKOMON_UNIVERSITIES.find(x => x.id === q.universityId);
            return (
              <button key={q.id} className="card card-pad" onClick={() => { setLinkedQId(q.id); setShowQuestionPicker(false); }} style={{ textAlign: "left", width: "100%" }}>
                <div className="row gap-2" style={{ marginBottom: 4 }}>
                  <span className={"chip " + u.accent}>{u.short}</span>
                  <span className="text-xs muted">{q.year} · {q.subject} {q.questionNo}</span>
                </div>
                <div className="text-sm fw-600">{q.title}</div>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <div style={{ height: 24 }}/>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 4. 写评价（K2 大学评分）
// ────────────────────────────────────────────────────────────
function WriteReviewScreen({ universityId, onBack, onSubmit }) {
  const u = KAKOMON_UNIVERSITIES.find(x => x.id === universityId);
  const dims = ["修考难度", "过去问完整度", "教授信息透明度", "合格经验数量", "研究科口碑"];
  const [scores, setScores] = useStateMisc(Object.fromEntries(dims.map(d => [d, 0])));
  const [body, setBody] = useStateMisc("");
  const [status, setStatus] = useStateMisc(null);  // "passed" | "preparing"
  const [anonymous, setAnonymous] = useStateMisc(false);

  const avg = Object.values(scores).filter(v => v > 0).length > 0
    ? (Object.values(scores).reduce((a,b) => a+b, 0) / Object.values(scores).filter(v => v > 0).length).toFixed(1)
    : "—";
  const valid = Object.values(scores).every(v => v > 0) && body.trim().length >= 10 && status;

  return (
    <div className="screen fade-in" style={{ paddingBottom: 80 }}>
      <StatusBar />
      <AppHeader title="写评价" subtitle={u.nameCn} onBack={onBack}
        right={
          <button className="btn btn-sm" disabled={!valid} onClick={onSubmit} style={{
            background: valid ? "var(--blue-600)" : "var(--slate-200)",
            color: valid ? "#fff" : "var(--slate-500)",
            padding: "6px 14px",
          }}>提交</button>
        }
      />

      {/* 大学 hero */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad" style={{ background: `linear-gradient(135deg, var(--${u.accent}-50), #fff)` }}>
          <div className="row-between">
            <div className="row gap-2">
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `var(--${u.accent}-600)`, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
              }}>{u.short.slice(0,1)}</div>
              <div className="col">
                <span className="text-sm fw-600">{u.nameCn}</span>
                <span className="text-xs muted">{u.nameJp}</span>
              </div>
            </div>
            <div className="col" style={{ alignItems: "flex-end" }}>
              <span className="text-xs muted">综合</span>
              <span className="text-xl fw-700 text-amber" style={{ fontFamily: "var(--font-num)" }}>{avg}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 维度评分 */}
      <div className="section">
        <h3>5 维度评分</h3>
        <div className="card card-pad-lg">
          <div className="col" style={{ gap: 18 }}>
            {dims.map(d => (
              <div key={d}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span className="text-sm fw-500">{d}</span>
                  <span className="text-xs fw-600 text-amber" style={{ fontFamily: "var(--font-num)" }}>
                    {scores[d] ? scores[d].toFixed(1) : "未评"}
                  </span>
                </div>
                <div className="row gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setScores(o => ({ ...o, [d]: s }))} style={{
                      flex: 1, padding: "8px 0", borderRadius: 6,
                      background: s <= scores[d] ? "var(--amber-50)" : "var(--slate-50)",
                      color: s <= scores[d] ? "var(--amber-500)" : "var(--slate-300)",
                      transition: "all .12s",
                    }}>
                      <Icon name="star" size={18} fill={s <= scores[d] ? "var(--amber-500)" : "transparent"} stroke="currentColor" strokeWidth={1.6}/>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 身份 */}
      <div className="section">
        <h3>你的身份</h3>
        <div className="row gap-2">
          <button onClick={() => setStatus("preparing")} className="card card-pad" style={{
            flex: 1, textAlign: "left",
            border: status === "preparing" ? "2px solid var(--indigo-500)" : "1px solid var(--slate-200)",
            background: status === "preparing" ? "var(--indigo-50)" : "#fff",
          }}>
            <div className="row gap-2"><Icon name="book" size={14} style={{ color: status === "preparing" ? "var(--indigo-600)" : "var(--slate-500)" }}/><span className="text-sm fw-600">备考中</span></div>
            <span className="text-xs muted" style={{ marginTop: 4, display: "block" }}>主观体验</span>
          </button>
          <button onClick={() => setStatus("passed")} className="card card-pad" style={{
            flex: 1, textAlign: "left",
            border: status === "passed" ? "2px solid var(--green-500)" : "1px solid var(--slate-200)",
            background: status === "passed" ? "var(--green-50)" : "#fff",
          }}>
            <div className="row gap-2"><Icon name="trophy" size={14} style={{ color: status === "passed" ? "var(--green-600)" : "var(--slate-500)" }}/><span className="text-sm fw-600">已合格</span></div>
            <span className="text-xs muted" style={{ marginTop: 4, display: "block" }}>权重更高</span>
          </button>
        </div>
      </div>

      {/* 评价正文 */}
      <div className="section">
        <h3>评价正文</h3>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="过去问是否透明？教授是否好沟通？难度上限如何？建议从哪几本书开始？"
          rows={6}
          style={{
            width: "100%", minHeight: 140, borderRadius: 10,
            border: "1px solid var(--slate-200)",
            padding: "12px 14px", fontSize: 14, lineHeight: 1.6, outline: "none",
            resize: "vertical", background: "#fff", fontFamily: "inherit",
          }}
        />
        <div className="row-between" style={{ marginTop: 4 }}>
          <span className="text-xs muted">{body.length < 10 ? "至少 10 字" : "✓"}</span>
          <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>{body.length}/500</span>
        </div>
      </div>

      {/* 匿名 */}
      <div className="section">
        <div className="card card-pad row-between">
          <div className="row gap-2">
            <Icon name="user" size={14} className="muted"/>
            <span className="text-sm">匿名提交</span>
          </div>
          <button onClick={() => setAnonymous(!anonymous)} style={{
            width: 38, height: 22, borderRadius: 999,
            background: anonymous ? "var(--blue-600)" : "var(--slate-300)",
            position: "relative",
          }}>
            <span style={{ position: "absolute", top: 2, left: anonymous ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)", transition: "all .15s" }}/>
          </button>
        </div>
        <div className="text-xs muted" style={{ marginTop: 8, padding: "0 4px", lineHeight: 1.5 }}>
          评价会经过运营审核 · 不实评价将被删除
        </div>
      </div>

      <div style={{ height: 24 }}/>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 5. 目标校 Onboarding（首次登录后引导）
// ────────────────────────────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useStateMisc(1);
  const [major, setMajor] = useStateMisc("");
  const [schools, setSchools] = useStateMisc([]);
  const [level, setLevel] = useStateMisc(null);

  const majors = ["工学", "理学", "经济", "情报", "材料", "其他"];
  const examLevels = [
    { v: "beginner", label: "刚开始", desc: "了解少", icon: "book" },
    { v: "middle",   label: "已刷过几套", desc: "中段", icon: "trending" },
    { v: "advanced", label: "冲刺阶段", desc: "高强度", icon: "flame" },
  ];

  const toggleSchool = (id) => setSchools(arr => arr.includes(id) ? arr.filter(x => x !== id) : arr.length < 3 ? [...arr, id] : arr);

  const canNext = step === 1 ? !!major : step === 2 ? schools.length > 0 : !!level;

  return (
    <div className="screen fade-in" style={{ background: "linear-gradient(180deg, #eff6ff 0%, var(--slate-50) 30%)", paddingBottom: 100 }}>
      <StatusBar />

      {/* Progress */}
      <div className="row gap-2" style={{ padding: "8px 20px 16px" }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: s <= step ? "var(--blue-600)" : "var(--slate-200)", transition: "all .2s" }}/>
        ))}
      </div>

      <div style={{ padding: "12px 24px 0" }}>
        <div className="text-xs muted">第 {step} 步 / 3</div>
        {step === 1 && <>
          <div className="text-2xl fw-700" style={{ marginTop: 6, lineHeight: 1.3, letterSpacing: "-0.01em" }}>你的方向是？</div>
          <div className="text-sm muted" style={{ marginTop: 6 }}>用于精准推荐过去问和参考书</div>
        </>}
        {step === 2 && <>
          <div className="text-2xl fw-700" style={{ marginTop: 6, lineHeight: 1.3, letterSpacing: "-0.01em" }}>选择目标校</div>
          <div className="text-sm muted" style={{ marginTop: 6 }}>最多 3 所 · 之后可在「我的」修改</div>
        </>}
        {step === 3 && <>
          <div className="text-2xl fw-700" style={{ marginTop: 6, lineHeight: 1.3, letterSpacing: "-0.01em" }}>当前备考阶段</div>
          <div className="text-sm muted" style={{ marginTop: 6 }}>影响首页推荐密度和难度</div>
        </>}
      </div>

      <div className="section" style={{ marginTop: 18 }}>
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {majors.map(m => (
              <button key={m} onClick={() => setMajor(m)} className="card card-pad" style={{
                padding: "20px 12px", textAlign: "center",
                border: major === m ? "2px solid var(--blue-500)" : "1px solid var(--slate-200)",
                background: major === m ? "var(--blue-50)" : "#fff",
                fontSize: 15, fontWeight: 600,
                color: major === m ? "var(--blue-700)" : "var(--slate-800)",
              }}>{m}</button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="col" style={{ gap: 8 }}>
            {KAKOMON_UNIVERSITIES.map(u => {
              const sel = schools.includes(u.id);
              return (
                <button key={u.id} onClick={() => toggleSchool(u.id)} className="card" style={{
                  padding: 14, textAlign: "left",
                  border: sel ? `2px solid var(--${u.accent}-500)` : "1px solid var(--slate-200)",
                  background: sel ? `var(--${u.accent}-50)` : "#fff",
                  display: "flex", gap: 12, alignItems: "center",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: sel ? `var(--${u.accent}-600)` : `var(--${u.accent}-50)`,
                    color: sel ? "#fff" : `var(--${u.accent}-600)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>{u.short.slice(0,1)}</div>
                  <div className="col flex1">
                    <span className="text-sm fw-600">{u.nameCn}</span>
                    <span className="text-xs muted">{u.nameJp}</span>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 999, border: sel ? "7px solid var(--blue-600)" : "2px solid var(--slate-300)", transition: "all .15s" }}/>
                </button>
              );
            })}
            <div className="text-xs muted" style={{ textAlign: "center", marginTop: 8 }}>
              已选 <b style={{ color: "var(--blue-600)", fontFamily: "var(--font-num)" }}>{schools.length}</b> / 3
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="col" style={{ gap: 10 }}>
            {examLevels.map(l => (
              <button key={l.v} onClick={() => setLevel(l.v)} className="card card-pad-lg" style={{
                textAlign: "left",
                border: level === l.v ? "2px solid var(--blue-500)" : "1px solid var(--slate-200)",
                background: level === l.v ? "var(--blue-50)" : "#fff",
                display: "flex", gap: 14, alignItems: "center",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: level === l.v ? "var(--blue-600)" : "var(--slate-100)",
                  color: level === l.v ? "#fff" : "var(--slate-600)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}><Icon name={l.icon} size={20}/></div>
                <div className="col flex1">
                  <span className="text-md fw-600">{l.label}</span>
                  <span className="text-xs muted">{l.desc}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "16px 20px 20px",
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid var(--slate-200)",
        backdropFilter: "blur(10px)",
      }}>
        <div className="row gap-2">
          {step > 1 && (
            <button className="btn btn-outlined" onClick={() => setStep(step - 1)}>
              <Icon name="back" size={14}/> 上一步
            </button>
          )}
          <button className="btn btn-primary btn-lg btn-block" disabled={!canNext} onClick={() => {
            if (step < 3) setStep(step + 1);
            else onComplete({ major, schools, level });
          }} style={{
            background: canNext ? "var(--blue-600)" : "var(--slate-200)",
            color: canNext ? "#fff" : "var(--slate-500)",
            flex: 1,
          }}>
            {step < 3 ? <>下一步 <Icon name="forward" size={14}/></> : <><Icon name="sparkles" size={14}/> 开始学习</>}
          </button>
        </div>
      </div>
    </div>
  );
}

window.PaywallScreen = PaywallScreen;
window.NotificationsScreen = NotificationsScreen;
window.ComposeThreadScreen = ComposeThreadScreen;
window.WriteReviewScreen = WriteReviewScreen;
window.OnboardingScreen = OnboardingScreen;
