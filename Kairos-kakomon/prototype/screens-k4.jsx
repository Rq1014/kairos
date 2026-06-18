// ============================================================
// K4 — Forum Home + Thread Detail (+ ThreadCard shared)
// ============================================================

const { useState: useStateK4 } = React;

function ThreadCard({ thread, onOpen }) {
  const u = KAKOMON_UNIVERSITIES.find(x => x.id === thread.universityId);
  const q = thread.questionId ? KAKOMON_QUESTIONS.find(x => x.id === thread.questionId) : null;
  const typeLabel = {
    question_discussion: { lbl: "题目讨论", color: "blue", icon: "book" },
    material_request:    { lbl: "资料互助", color: "amber", icon: "download" },
    experience:          { lbl: "合格经验", color: "green", icon: "trophy" },
    study_circle:        { lbl: "同校备考", color: "indigo", icon: "user" },
  }[thread.type] || { lbl: "讨论", color: "slate", icon: "message" };

  return (
    <div className="card" onClick={onOpen} style={{ cursor: "pointer" }}>
      <div className="card-pad">
        <div className="row gap-2" style={{ marginBottom: 6, flexWrap: "wrap" }}>
          <span className={`chip ${typeLabel.color}`}><Icon name={typeLabel.icon} size={10}/> {typeLabel.lbl}</span>
          {u && <span className="chip outlined">{u.short}</span>}
          {thread.materialRequestStatus === "solved" && <span className="badge solved">✓ 已解决</span>}
          {thread.materialRequestStatus === "unsolved" && <span className="badge unsolved">求助中</span>}
          {thread.hasAcceptedAnswer && thread.type === "question_discussion" && <span className="badge solved">✓ 已采纳</span>}
        </div>
        <div className="text-sm fw-600" style={{ lineHeight: 1.4 }}>{thread.title}</div>
        <div className="text-xs muted line-clamp-2" style={{ marginTop: 4, lineHeight: 1.5 }}>{thread.excerpt}</div>
        {q && (
          <div style={{ marginTop: 8, padding: 8, background: "var(--slate-100)", borderRadius: 8, display: "flex", gap: 6, alignItems: "center" }}>
            <Icon name="link" size={12} className="muted"/>
            <span className="text-xs muted truncate">关联：{q.year} {q.subject} {q.questionNo} · {q.title}</span>
          </div>
        )}
        <div className="row-between" style={{ marginTop: 10 }}>
          <div className="row gap-2">
            <AuthorBadge type={thread.authorBadge} />
            <span className="text-xs muted">{thread.authorName.split(" · ")[1]}</span>
          </div>
          <div className="row gap-3 text-xs muted">
            <span><Icon name="message" size={11}/> {thread.replyCount}</span>
            <span><Icon name="eye" size={11}/> {thread.viewCount}</span>
            <span>{thread.lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ForumHomeScreen({ onOpenThread, onCompose, onOpenGroupList, onOpenGroup }) {
  const [tab, setTab] = useStateK4("全部");
  const tabs = ["全部", "题目讨论", "资料互助", "合格经验", "同校备考"];
  const tabMap = {
    "题目讨论": "question_discussion",
    "资料互助": "material_request",
    "合格经验": "experience",
    "同校备考": "study_circle",
  };
  const list = KAKOMON_THREADS.filter(t => tab === "全部" ? true : t.type === tabMap[tab]);

  return (
    <div className="screen fade-in">
      <StatusBar />
      <div style={{ padding: "8px 16px 0" }}>
        <div className="row-between">
          <div>
            <div className="text-2xl fw-700">论坛</div>
            <div className="text-xs muted">题目 · 资料 · 经验 · 同校</div>
          </div>
          <button className="icon-btn" style={{ width: 36, height: 36, borderRadius: 999, background: "var(--indigo-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onCompose}>
            <Icon name="plus" size={18} strokeWidth={2.4}/>
          </button>
        </div>
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <div style={{ position: "relative" }}>
          <input
            placeholder="搜索题目 / 学校 / 关键词"
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

      <div className="section" style={{ marginTop: 8 }}>
        <div className="scroll-x">
          {tabs.map(t => (
            <Chip key={t} color="indigo" selected={tab === t} onClick={() => setTab(t)}>{t}</Chip>
          ))}
        </div>
      </div>

      {/* Pinned summary card */}
      {tab === "全部" && (
        <div className="section">
          <div className="card card-pad" style={{ background: "linear-gradient(135deg, #eef2ff, #fff)", borderColor: "#c7d2fe" }}>
            <div className="row gap-2"><Icon name="trending" size={14} className="text-indigo"/><span className="text-sm fw-600 text-indigo">本周话题</span></div>
            <div className="text-sm fw-600" style={{ marginTop: 4 }}>东大 vs 东工大 · 修考线代套路对比</div>
            <div className="text-xs muted" style={{ marginTop: 4 }}>24 楼 · 891 浏览 · 运营整理中</div>
          </div>
        </div>
      )}

      {/* Study Groups horizontal entry */}
      {tab === "全部" && (
        <div className="section">
          <h3>
            <span className="row gap-2"><Icon name="user" size={13} className="text-indigo"/><span>学习圈 · 一起刷题</span></span>
            <span className="more" onClick={onOpenGroupList} style={{ cursor: "pointer" }}>查看全部 <Icon name="chevronRight" size={12}/></span>
          </h3>
          <div className="scroll-x">
            {KAKOMON_GROUPS.slice(0, 4).map(g => (
              <div key={g.id} className="card" onClick={() => onOpenGroup(g.id)} style={{ flex: "0 0 200px", cursor: "pointer" }}>
                <div className="card-pad" style={{ padding: 12 }}>
                  <div className="row gap-2" style={{ marginBottom: 6 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `linear-gradient(135deg, var(--${g.accent}-100), var(--${g.accent}-50))`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>{g.emoji}</div>
                    <div className="col flex1" style={{ minWidth: 0 }}>
                      <span className="text-xs fw-700 truncate">{g.name}</span>
                      <span className="text-xs muted">{g.memberCount} 人 · {g.dailyActive} 在线</span>
                    </div>
                  </div>
                  <div className="text-xs muted line-clamp-2" style={{ lineHeight: 1.5, minHeight: 32 }}>{g.todayTask}</div>
                  {g.joined ? (
                    <button className="btn btn-sm btn-block" style={{ marginTop: 8, background: "var(--green-50)", color: "var(--green-700)", padding: "5px 0" }}>✓ 已加入</button>
                  ) : (
                    <button className="btn btn-sm btn-block" style={{ marginTop: 8, background: "var(--indigo-600)", color: "#fff", padding: "5px 0" }}>加入</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="col" style={{ gap: 8 }}>
          {list.map(t => <ThreadCard key={t.id} thread={t} onOpen={() => onOpenThread(t.id)} />)}
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

// ---------- Thread Detail ----------
function ThreadDetailScreen({ threadId, user, onBack, onOpenQuestion, onUpgradePro }) {
  const t = KAKOMON_THREADS.find(x => x.id === threadId);
  const replies = KAKOMON_THREAD_REPLIES[threadId] || [
    { id: "r1", author: "学长A", badge: "passed", time: "1 小时前", body: "这种题型最近三年都在考，建议把对角化的几何意义看透。", upvotes: 8, isAccepted: false },
    { id: "r2", author: "Mei", badge: "preparing", time: "30 分钟前", body: "刚刷完，分享一下我的笔记…", upvotes: 3, isAccepted: t.hasAcceptedAnswer },
  ];
  const u = KAKOMON_UNIVERSITIES.find(x => x.id === t.universityId);
  const q = t.questionId ? KAKOMON_QUESTIONS.find(x => x.id === t.questionId) : null;
  const [composer, setComposer] = useStateK4("");

  return (
    <div className="screen fade-in" style={{ paddingBottom: 130 }}>
      <StatusBar />
      <AppHeader title="帖子" onBack={onBack}
        right={<>
          <button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="bookmark" size={18}/></button>
          <button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="more" size={18}/></button>
        </>}
      />

      {/* Original post */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad-lg">
          <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 8 }}>
            {u && <span className="chip indigo">{u.short}</span>}
            {t.tags.map(tg => <span key={tg} className="chip outlined">#{tg}</span>)}
          </div>
          <div className="text-lg fw-700" style={{ lineHeight: 1.35 }}>{t.title}</div>
          <div className="row gap-2" style={{ marginTop: 10 }}>
            <div className="avatar sm">{t.authorName.split(" · ")[1]?.[0] || "U"}</div>
            <div className="col" style={{ gap: 1 }}>
              <div className="row gap-2">
                <span className="text-xs fw-600">{t.authorName.split(" · ")[1] || t.authorName}</span>
                <AuthorBadge type={t.authorBadge}/>
              </div>
              <span className="text-xs muted">{t.lastActivity} · {t.viewCount} 浏览</span>
            </div>
          </div>
          <div className="text-sm text-slate-800" style={{ marginTop: 12, lineHeight: 1.7 }}>{t.excerpt}</div>

          {q && (
            <div className="card card-pad" style={{ background: "var(--blue-50)", borderColor: "#bfdbfe", marginTop: 12, cursor: "pointer" }} onClick={() => onOpenQuestion(q.id)}>
              <div className="row gap-2"><Icon name="link" size={12} className="text-blue"/><span className="text-xs fw-600 text-blue">关联题目</span></div>
              <div className="text-sm fw-600" style={{ marginTop: 4 }}>{q.title}</div>
              <div className="text-xs muted" style={{ marginTop: 2 }}>{u && u.short} · {q.year} {q.subject} {q.questionNo}</div>
            </div>
          )}

          <div className="row gap-3" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--slate-100)" }}>
            <button className="btn btn-ghost btn-sm"><Icon name="thumbsUp" size={13}/> 顶 12</button>
            <button className="btn btn-ghost btn-sm"><Icon name="message" size={13}/> {t.replyCount}</button>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}><Icon name="bookmark" size={13}/> 收藏</button>
          </div>
        </div>
      </div>

      {/* AI Summary CTA - locked Pro */}
      <div className="section">
        <div className="card card-pad" style={{
          background: "linear-gradient(135deg, #fff, #fef3c7)",
          borderColor: "#fcd34d",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          <div className="row gap-2" style={{ flex: 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="sparkles" size={14}/></div>
            <div className="col" style={{ gap: 1 }}>
              <div className="text-sm fw-600">AI 总结本帖</div>
              <div className="text-xs muted">提取核心观点 + 答案要点</div>
            </div>
          </div>
          <button className="btn btn-sm" onClick={onUpgradePro} style={{ background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff" }}>
            <Icon name="lock" size={11}/> Pro
          </button>
        </div>
      </div>

      {/* Replies */}
      <div className="section">
        <h3>
          <span>{replies.length} 条回复</span>
          <span className="more">最热</span>
        </h3>
        <div className="col" style={{ gap: 8 }}>
          {replies.map(r => (
            <div key={r.id} className="card card-pad" style={r.isAccepted ? { background: "var(--green-50)", borderColor: "#86efac", borderWidth: 1 } : null}>
              {r.isAccepted && (
                <div className="row gap-2" style={{ marginBottom: 8 }}>
                  <span className="badge solved"><Icon name="check" size={10} strokeWidth={2.6}/> 楼主已采纳</span>
                </div>
              )}
              <div className="row gap-2">
                <div className="avatar sm">{r.author[0]}</div>
                <div className="col" style={{ gap: 1 }}>
                  <div className="row gap-2">
                    <span className="text-xs fw-600">{r.author}</span>
                    <AuthorBadge type={r.badge}/>
                  </div>
                  <span className="text-xs muted">{r.time}</span>
                </div>
              </div>
              <div className="text-sm text-slate-800" style={{ marginTop: 10, lineHeight: 1.7 }}>{r.body}</div>
              <div className="row gap-3" style={{ marginTop: 10 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}><Icon name="thumbsUp" size={12}/> {r.upvotes}</button>
                <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }}>回复</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 16 }} />

      {/* Reply composer */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 64,
        padding: "10px 12px",
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid var(--slate-200)",
        backdropFilter: "blur(10px)",
      }}>
        <div className="row gap-2">
          <input
            value={composer}
            onChange={e => setComposer(e.target.value)}
            placeholder="说说你的看法…"
            style={{
              flex: 1, height: 38, borderRadius: 999,
              border: "1px solid var(--slate-200)",
              padding: "0 14px", fontSize: 14, outline: "none",
              background: "var(--slate-50)",
            }}
          />
          <button style={{
            width: 38, height: 38, borderRadius: 999,
            background: "var(--indigo-600)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="send" size={16}/></button>
        </div>
      </div>
    </div>
  );
}

window.ThreadCard = ThreadCard;
window.ForumHomeScreen = ForumHomeScreen;
window.ThreadDetailScreen = ThreadDetailScreen;
