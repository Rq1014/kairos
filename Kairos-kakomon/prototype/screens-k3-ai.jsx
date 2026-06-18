// ============================================================
// K3 — AI Context Sheet + AI Chat
// ============================================================

const { useState: useStateAi, useEffect: useEffectAi, useRef: useRefAi } = React;

function AiContextSheet({ open, onClose, onSubmit, contextQuestionId, user }) {
  const q = KAKOMON_QUESTIONS.find(x => x.id === contextQuestionId);
  const u = q ? KAKOMON_UNIVERSITIES.find(x => x.id === q.universityId) : null;
  const [direction, setDirection] = useStateAi("情报");
  const [schools, setSchools] = useStateAi(q ? [q.universityId] : ["todai"]);
  const [points, setPoints] = useStateAi(q ? q.knowledgePoints.slice(0,3) : []);
  const [text, setText] = useStateAi("");
  const [submitting, setSubmitting] = useStateAi(false);

  const directions = ["工学", "理学", "经济", "情报", "材料", "其他"];
  const schoolOpts = KAKOMON_UNIVERSITIES.slice(0, 5);
  const pointOpts = q ? q.knowledgePoints : ["线性代数", "微积分", "概率统计"];

  const toggle = (arr, setArr, v) =>
    arr.includes(v) ? setArr(arr.filter(x => x !== v)) : setArr([...arr, v]);

  const valid = schools.length > 0 && text.trim().length > 0;

  const handleSubmit = () => {
    if (!valid) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onSubmit({ direction, schools, points, text });
    }, 600);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="让 AI 按你的目标校回答">
      <div className="col" style={{ gap: 16, paddingTop: 6 }}>
        {q && (
          <div className="card card-pad" style={{ background: "var(--slate-100)", border: 0 }}>
            <div className="text-xs muted" style={{ marginBottom: 4 }}>当前题目</div>
            <div className="text-sm fw-600" style={{ lineHeight: 1.4 }}>{u.short} · {q.year} {q.subject} {q.questionNo} · {q.title}</div>
          </div>
        )}

        <div className="col" style={{ gap: 8 }}>
          <div className="text-sm fw-600">专业方向</div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {directions.map(d => (
              <Chip key={d} color="blue" selected={direction === d} onClick={() => setDirection(d)}>{d}</Chip>
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 8 }}>
          <div className="row-between">
            <div className="text-sm fw-600">目标学校</div>
            <span className="text-xs muted">{schools.length} 选</span>
          </div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {schoolOpts.map(s => (
              <Chip key={s.id} color="teal" selected={schools.includes(s.id)} onClick={() => toggle(schools, setSchools, s.id)}>{s.short}</Chip>
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 8 }}>
          <div className="text-sm fw-600">学科 / 考点</div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {pointOpts.map(p => (
              <Chip key={p} color="indigo" selected={points.includes(p)} onClick={() => toggle(points, setPoints, p)}>#{p}</Chip>
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 8 }}>
          <div className="text-sm fw-600">提问内容</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="例如：我不懂为什么这里可以对角化"
            rows={4}
            style={{
              width: "100%",
              border: "1px solid var(--slate-200)",
              borderRadius: 10,
              padding: 10,
              fontSize: 14,
              outline: "none",
              resize: "none",
              background: "var(--slate-50)",
            }}
          />
        </div>

        <div className="card card-pad" style={{ background: "var(--amber-50)", borderColor: "#fde68a" }}>
          <div className="row gap-2"><Icon name="coin" size={14} className="text-amber" /><span className="text-xs fw-600 text-amber">本次成本</span></div>
          <div className="text-xs muted" style={{ marginTop: 4, lineHeight: 1.5 }}>
            {user.freeAiRemaining > 0
              ? <>今日剩余 <b>{user.freeAiRemaining}</b> 次免费提问 · 不消耗 Token</>
              : <>本次消耗 <b>1 Token</b>（剩 {user.tokenBalance}）· Pro 用户本题无限追问</>}
          </div>
        </div>

        {!valid && (text.length > 0 || schools.length === 0) && (
          <div className="text-xs text-rose">{schools.length === 0 ? "请至少选择 1 所目标校" : "请输入提问内容"}</div>
        )}

        <button
          className="btn btn-block btn-lg"
          disabled={!valid || submitting}
          onClick={handleSubmit}
          style={{
            background: valid ? "linear-gradient(135deg, var(--teal-600), var(--cyan-600))" : "var(--slate-200)",
            color: valid ? "#fff" : "var(--slate-500)",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          <Icon name="sparkles" size={16} /> {submitting ? "AI 思考中…" : "开始问 AI"}
        </button>
      </div>
    </BottomSheet>
  );
}

// ---------- AI Chat ----------
function AiChatScreen({ contextQuestionId, initialPrompt, user, onBack }) {
  const q = KAKOMON_QUESTIONS.find(x => x.id === contextQuestionId);
  const u = q ? KAKOMON_UNIVERSITIES.find(x => x.id === q.universityId) : null;

  const buildAnswer = (prompt) => ({
    role: "assistant",
    sections: [
      { title: "思路", body: "实对称矩阵的特征值都是实数，且不同特征值对应的特征向量天然正交。题中已给出 v₁, v₂, v₃ 正交单位化，所以可直接构造正交矩阵 P。" },
      { title: "关键考点", body: "① 谱定理（实对称矩阵正交对角化）；② Pᵀ = P⁻¹ 的运算性质；③ 用特征值代入多项式 f(λ) 判断 f(A) 的可逆性。" },
      { title: "常见误区", body: "把 P⁻¹ 当成一般矩阵的逆来计算。其实因为 P 正交，Pᵀ = P⁻¹，所以 Aⁿ = P·diag(λⁿ)·Pᵀ。" },
      { title: "推荐练习", body: "可对照《マセマ 线代》P.128 例题，与东工大 2021 数学第2问对比训练。" },
    ],
    chips: ["换种说法", "给我类似题", "只讲第2步", "推荐参考书页码"],
  });

  const [messages, setMessages] = useStateAi([
    { role: "user", text: initialPrompt || "为什么这里一定可以对角化？Aⁿ 怎么算？" },
    buildAnswer(initialPrompt || ""),
  ]);
  const [composer, setComposer] = useStateAi("");
  const [thinking, setThinking] = useStateAi(false);
  const [tokensUsed, setTokensUsed] = useStateAi(1); // initial question costs 1
  const [toast, setToast] = useStateAi(null);
  const scrollRef = useRefAi();

  const flashToast = (text, icon = "check") => {
    setToast({ text, icon });
    setTimeout(() => setToast(null), 1800);
  };

  useEffectAi(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  const fakeReply = (chip) => {
    if (chip === "换种说法") {
      return {
        role: "assistant",
        sections: [
          { title: "用更直白的话", body: "你可以把这题想成：A 已经把空间分解成 3 条互相垂直的轴，每条轴对应一个伸缩倍数（2, -1, 5）。对角化就是把视角换到这 3 条轴上看 A，矩阵就变成对角矩阵。" },
          { title: "为什么 Aⁿ 简单", body: "在轴上做 n 次伸缩 = 倍数变成 n 次方。所以 Aⁿ 就是把 diag 里每个数变成 n 次方，再换回原坐标系。" },
        ],
        chips: ["再举个例子", "和 PCA 有什么关系", "推荐参考书页码"],
      };
    }
    if (chip === "给我类似题") {
      return {
        role: "assistant",
        sections: [
          { title: "推荐 3 道", body: "① 东工大 2021 数学第2问（同套路）；② 京大 2022 数学第1问（多项式可逆性判定）；③ 阪大 2023 数学第2问（行列式表达可逆性）。" },
          { title: "训练顺序建议", body: "先做①巩固对角化求幂；再做②练习特征值代入；最后做③综合可逆性判断。" },
        ],
        chips: ["先看第①题", "推荐参考书页码", "只讲第2步"],
      };
    }
    if (chip === "只讲第2步") {
      return {
        role: "assistant",
        sections: [
          { title: "Step 2 核心", body: "Aⁿ = (P D Pᵀ)ⁿ = P D Pᵀ P D Pᵀ … = P Dⁿ Pᵀ。中间所有 Pᵀ P 都消成 I，因为 P 正交。" },
          { title: "结果", body: "Aⁿ = P · diag(2ⁿ, (-1)ⁿ, 5ⁿ) · Pᵀ。要算具体矩阵就把 v₁, v₂, v₃ 代入即可。" },
        ],
        chips: ["验算一下 n=2", "推荐参考书页码", "给我类似题"],
      };
    }
    if (chip === "推荐参考书页码") {
      return {
        role: "assistant",
        sections: [
          { title: "最匹配", body: "《マセマ 线性代数》P.128-131：实对称矩阵正交对角化定理，例题与本题结构一致。" },
          { title: "补充扩展", body: "《青本 数学》P.204：用正交矩阵简化求幂，解法套路相同；《演习 大学院入试 数学》P.56 例题 12：用特征值多项式判断可逆。" },
        ],
        chips: ["先翻第一本", "给我类似题"],
      };
    }
    return {
      role: "assistant",
      sections: [{ title: "回复", body: "好的，让我从另一个角度切入：" + chip }],
      chips: ["换种说法", "给我类似题", "推荐参考书页码"],
    };
  };

  const send = (text) => {
    setMessages(m => [...m, { role: "user", text }]);
    setThinking(true);
    setTokensUsed(n => n + 1);
    setTimeout(() => {
      setMessages(m => [...m, fakeReply(text)]);
      setThinking(false);
    }, 800);
  };

  const onAction = (action, msgIdx) => {
    if (action === "加入错题本") flashToast("已加入错题本", "flame");
    else if (action === "保存为笔记") flashToast("已保存到我的笔记", "bookmark");
    else if (action === "复制") flashToast("已复制到剪贴板", "copy");
    else if (action === "分享给学习圈") flashToast("已转发到学习圈", "send");
  };

  const onChip = (c) => send(c);
  const onSubmitComposer = () => {
    if (!composer.trim()) return;
    send(composer.trim());
    setComposer("");
  };

  return (
    <div className="screen fade-in" style={{ paddingBottom: 80 }}>
      <StatusBar />
      <AppHeader
        title="AI · 这道题"
        subtitle={u && q ? `${u.short} · ${q.year} ${q.subject} ${q.questionNo}` : ""}
        onBack={onBack}
        right={<button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="more" size={18}/></button>}
      />

      {/* Pinned context + token meter */}
      {q && (
        <div className="section" style={{ marginTop: 4 }}>
          <div className="card card-pad" style={{ background: "var(--teal-50)", borderColor: "#99f6e4" }}>
            <div className="row-between">
              <div className="row gap-2"><Icon name="link" size={14} className="text-teal" /><span className="text-xs fw-600 text-teal">已锁定上下文</span></div>
              <TokenMeter user={user} used={tokensUsed}/>
            </div>
            <div className="text-sm fw-600" style={{ marginTop: 4, lineHeight: 1.4 }}>{q.title}</div>
            <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
              {q.knowledgePoints.slice(0,3).map(k => <span key={k} className="chip outlined">#{k}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="section" ref={scrollRef} style={{ marginTop: 12 }}>
        <div className="col" style={{ gap: 12 }}>
          {messages.map((m, i) => m.role === "user" ? (
            <div key={i} style={{ alignSelf: "flex-end", maxWidth: "85%" }}>
              <div style={{
                background: "var(--blue-600)", color: "#fff",
                padding: "10px 14px", borderRadius: "14px 14px 4px 14px",
                fontSize: 14, lineHeight: 1.5,
              }}>{m.text}</div>
            </div>
          ) : (
            <AiAnswer key={i} message={m} onChip={onChip} onAction={(a) => onAction(a, i)} />
          ))}
          {thinking && (
            <div className="row gap-2" style={{ alignItems: "flex-start" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--teal-500),var(--cyan-500))", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name="sparkles" size={14}/>
              </div>
              <div className="card card-pad" style={{ background: "#fff" }}>
                <div className="row gap-2">
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: 99, background: "var(--slate-300)", animation: `pulse 1.2s ${i*0.15}s infinite` }} />
                  ))}
                </div>
              </div>
              <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      {toast && (
        <div style={{
          position: "absolute", left: "50%", bottom: 110,
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.92)",
          color: "#fff", padding: "10px 16px", borderRadius: 999,
          fontSize: 13, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 6,
          zIndex: 60, animation: "fade-in 0.2s ease",
          boxShadow: "0 8px 20px -4px rgba(0,0,0,0.3)",
        }}>
          <Icon name={toast.icon} size={13} strokeWidth={2.4}/> {toast.text}
        </div>
      )}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid var(--slate-200)",
        backdropFilter: "blur(10px)",
      }}>
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <input
            value={composer}
            onChange={e => setComposer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSubmitComposer()}
            placeholder="继续追问…"
            style={{
              flex: 1, height: 38, borderRadius: 999,
              border: "1px solid var(--slate-200)",
              padding: "0 14px", fontSize: 14, outline: "none",
              background: "var(--slate-50)",
            }}
          />
          <button onClick={onSubmitComposer} style={{
            width: 38, height: 38, borderRadius: 999,
            background: "linear-gradient(135deg, var(--teal-600), var(--cyan-600))",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="send" size={16}/></button>
        </div>
        <div className="text-xs muted" style={{ textAlign: "center", marginTop: 6 }}>
          {user.freeAiRemaining > 0 ? `今日剩 ${user.freeAiRemaining} 次免费追问` : `每次追问消耗 1 Token · 升级 Pro 无限追问`}
        </div>
      </div>
    </div>
  );
}

function TokenMeter({ user, used }) {
  if (user.isPro) {
    return (
      <span className="badge pro" style={{ padding: "2px 8px" }}>
        <Icon name="crown" size={10}/> 无限
      </span>
    );
  }
  const total = (user.freeAiRemaining || 0) + (user.tokenBalance || 0);
  const remaining = Math.max(0, total - used);
  return (
    <div className="row gap-2" style={{ alignItems: "center" }}>
      <Icon name="coin" size={11} className="text-amber"/>
      <span className="text-xs fw-600" style={{ fontFamily: "var(--font-num)" }}>{remaining}<span className="muted" style={{ fontWeight: 400 }}>/{total}</span></span>
    </div>
  );
}

function AiAnswer({ message, onChip, onAction }) {
  return (
    <div className="row gap-2" style={{ alignItems: "flex-start", maxWidth: "92%" }}>
      <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--teal-500),var(--cyan-500))", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name="sparkles" size={14}/>
      </div>
      <div className="col" style={{ gap: 8, flex: 1 }}>
        <div className="card card-pad" style={{ background: "#fff" }}>
          <div className="col" style={{ gap: 12 }}>
            {message.sections.map((s, i) => (
              <div key={i}>
                <div className="text-xs fw-700 text-teal" style={{ marginBottom: 4, letterSpacing: "0.02em" }}>{s.title}</div>
                <div className="text-sm text-slate-800" style={{ lineHeight: 1.65 }}>{s.body}</div>
              </div>
            ))}
          </div>
          {/* Action row */}
          <div className="row gap-2" style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--slate-100)", flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => onAction("加入错题本")}>
              <Icon name="flame" size={11} className="text-rose"/> 加入错题本
            </button>
            <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => onAction("保存为笔记")}>
              <Icon name="bookmark" size={11} className="text-blue"/> 保存为笔记
            </button>
            <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => onAction("复制")}>
              <Icon name="copy" size={11}/> 复制
            </button>
            <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px", marginLeft: "auto" }} onClick={() => onAction("分享给学习圈")}>
              <Icon name="send" size={11} className="text-indigo"/> 分享
            </button>
          </div>
        </div>
        {message.chips && (
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {message.chips.map(c => (
              <button key={c} className="chip teal chip-btn" onClick={() => onChip(c)} style={{ cursor: "pointer", border: "1px solid #99f6e4" }}>
                <Icon name="zap" size={10}/> {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.AiContextSheet = AiContextSheet;
window.AiChatScreen = AiChatScreen;
