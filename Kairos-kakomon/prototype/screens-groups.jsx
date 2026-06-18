// ============================================================
// 学习圈 / Study Groups — QQ 群式讨论组
// 视觉：indigo 为主（社区色），与论坛同源
// ============================================================

const { useState: useStateGr, useRef: useRefGr, useEffect: useEffectGr } = React;

// ────────────────────────────────────────────────────────────
// 1. 学习圈列表（按目标校 / 科目 / 经验 分类）
// ────────────────────────────────────────────────────────────
function GroupListScreen({ onBack, onOpenGroup, onCreateGroup }) {
  const [filter, setFilter] = useStateGr("全部");
  const filters = ["全部", "已加入", "我的目标校", "科目", "合格答疑"];
  const me = KAKOMON_USER;

  const filtered = KAKOMON_GROUPS.filter(g => {
    if (filter === "全部") return true;
    if (filter === "已加入") return g.joined;
    if (filter === "我的目标校") return me.targetUniversityIds.includes(g.target);
    if (filter === "科目") return g.scope === "subject" || g.scope === "school+subject";
    if (filter === "合格答疑") return g.scope === "experience";
    return true;
  });

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title="学习圈" subtitle="找到一起练习的朋友" onBack={onBack}
        right={
          <button className="icon-btn" onClick={onCreateGroup} style={{ width: 36, height: 36, borderRadius: 999, background: "var(--indigo-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="plus" size={18} strokeWidth={2.4}/>
          </button>
        }
      />

      {/* hero */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad" style={{ background: "linear-gradient(135deg, var(--indigo-50), #fff)", borderColor: "var(--indigo-100)" }}>
          <div className="row gap-2">
            <Icon name="user" size={14} className="text-indigo"/>
            <span className="text-sm fw-600 text-indigo">和你目标校的同学组队刷题</span>
          </div>
          <div className="text-xs text-slate-700" style={{ marginTop: 4, lineHeight: 1.5 }}>
            按学校 / 科目 / 经验找到合适小组，每天共同打卡，遇到难题群内即时讨论。
          </div>
          <div className="row gap-3" style={{ marginTop: 10 }}>
            <div className="col" style={{ gap: 0 }}>
              <span className="text-xs muted">活跃学习圈</span>
              <span className="text-md fw-700" style={{ fontFamily: "var(--font-num)" }}>{KAKOMON_GROUPS.length}</span>
            </div>
            <div style={{ width: 1, background: "var(--slate-200)" }}/>
            <div className="col" style={{ gap: 0 }}>
              <span className="text-xs muted">今日打卡</span>
              <span className="text-md fw-700 text-indigo" style={{ fontFamily: "var(--font-num)" }}>177</span>
            </div>
            <div style={{ width: 1, background: "var(--slate-200)" }}/>
            <div className="col" style={{ gap: 0 }}>
              <span className="text-xs muted">已合格成员</span>
              <span className="text-md fw-700 text-green" style={{ fontFamily: "var(--font-num)" }}>34</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 14 }}>
        <div className="scroll-x">
          {filters.map(f => <Chip key={f} color="indigo" selected={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </div>
      </div>

      <div className="section">
        <div className="col" style={{ gap: 10 }}>
          {filtered.map(g => <GroupCard key={g.id} g={g} onClick={() => onOpenGroup(g.id)}/>)}
        </div>
      </div>

      <div style={{ height: 24 }}/>
    </div>
  );
}

function GroupCard({ g, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: "pointer" }}>
      <div className="card-pad-lg">
        <div className="row gap-3">
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `linear-gradient(135deg, var(--${g.accent}-100), var(--${g.accent}-50))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, flexShrink: 0,
          }}>{g.emoji}</div>
          <div className="col flex1" style={{ gap: 3, minWidth: 0 }}>
            <div className="row-between">
              <div className="row gap-2" style={{ flex: 1, minWidth: 0 }}>
                <span className="text-sm fw-700 truncate">{g.name}</span>
                {g.verified && <Icon name="check" size={12} className="text-indigo" strokeWidth={2.6}/>}
              </div>
              {g.joined && <span className="badge" style={{ background: "var(--green-50)", color: "var(--green-700)", flexShrink: 0 }}>已加入</span>}
            </div>
            <div className="row gap-3" style={{ fontSize: 11, color: "var(--slate-500)" }}>
              <span><Icon name="user" size={10}/> {g.memberCount} 人</span>
              <span><Icon name="zap" size={10}/> {g.dailyActive} 在线</span>
              <span>群主 · {g.ownerName}</span>
            </div>
            <div className="row gap-2" style={{ marginTop: 6, flexWrap: "wrap" }}>
              {g.badges.map(b => <span key={b} className="chip outlined" style={{ fontSize: 11 }}>{b}</span>)}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-700 line-clamp-2" style={{ marginTop: 10, lineHeight: 1.55 }}>{g.desc}</div>

        <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--slate-50)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div className="row gap-2" style={{ minWidth: 0, flex: 1 }}>
            <Icon name="flame" size={12} className="text-rose"/>
            <span className="text-xs muted truncate">今日任务 · <b style={{ color: "var(--slate-800)", fontWeight: 600 }}>{g.todayTask}</b></span>
          </div>
          <span className="text-xs fw-600 text-indigo" style={{ flexShrink: 0 }}>查看 →</span>
        </div>

        <div className="row-between" style={{ marginTop: 10 }}>
          <div className="col" style={{ flex: 1 }}>
            <div className="row-between" style={{ marginBottom: 4 }}>
              <span className="text-xs muted">群平均进度</span>
              <span className="text-xs fw-600" style={{ fontFamily: "var(--font-num)" }}>{g.avgProgress}%</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: g.avgProgress + "%", background: `var(--${g.accent}-500)` }}/></div>
          </div>
          {!g.joined && (
            <button className="btn btn-sm" style={{
              marginLeft: 12, padding: "6px 14px",
              background: g.openSlots > 0 ? "var(--indigo-600)" : "var(--slate-200)",
              color: g.openSlots > 0 ? "#fff" : "var(--slate-500)",
            }} onClick={e => { e.stopPropagation(); }}>
              {g.openSlots > 0 ? "加入" : "已满"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 2. 学习圈详情：聊天 / 成员 / 活动
// ────────────────────────────────────────────────────────────
function GroupDetailScreen({ groupId, onBack, onOpenQuestion }) {
  const g = KAKOMON_GROUPS.find(x => x.id === groupId);
  const [tab, setTab] = useStateGr("chat");
  const tabs = ["chat", "members", "events"];
  const tabLabels = { chat: "聊天", members: `成员 ${KAKOMON_GROUP_MEMBERS.length}`, events: "活动" };

  return (
    <div className="screen fade-in" style={{ paddingBottom: tab === "chat" ? 120 : 80 }}>
      <StatusBar />
      <AppHeader
        title={g.name}
        subtitle={`${g.memberCount} 成员 · ${g.dailyActive} 在线`}
        onBack={onBack}
        right={<>
          <button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="bell" size={18}/></button>
          <button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="more" size={18}/></button>
        </>}
      />

      {/* group hero strip */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad" style={{ background: `linear-gradient(135deg, var(--${g.accent}-50), #fff)`, borderColor: `var(--${g.accent}-100, var(--slate-200))` }}>
          <div className="row gap-3">
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, var(--${g.accent}-100), var(--${g.accent}-50))`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>{g.emoji}</div>
            <div className="col flex1" style={{ minWidth: 0 }}>
              <div className="row gap-2"><span className="text-sm fw-600 truncate">{g.name}</span></div>
              <div className="text-xs muted line-clamp-2" style={{ marginTop: 2 }}>{g.desc}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
            <div className="col"><span className="text-xs muted">群进度</span><span className="text-lg fw-700" style={{ fontFamily: "var(--font-num)" }}>{g.avgProgress}%</span></div>
            <div className="col"><span className="text-xs muted">今日打卡</span><span className="text-lg fw-700 text-green" style={{ fontFamily: "var(--font-num)" }}>32</span></div>
            <div className="col"><span className="text-xs muted">本周题数</span><span className="text-lg fw-700 text-indigo" style={{ fontFamily: "var(--font-num)" }}>184</span></div>
          </div>
        </div>
      </div>

      {/* Segmented tabs */}
      <div className="section" style={{ marginTop: 12 }}>
        <Segmented items={tabs.map(t => ({ value: t, label: tabLabels[t] }))} value={tab} onChange={setTab}/>
      </div>

      {tab === "chat" && <GroupChat g={g} onOpenQuestion={onOpenQuestion}/>}
      {tab === "members" && <GroupMembers/>}
      {tab === "events" && <GroupEvents/>}

      {tab === "chat" && <GroupComposer/>}
    </div>
  );
}

function GroupChat({ g, onOpenQuestion }) {
  const msgs = KAKOMON_GROUP_MESSAGES[g.id] || [];
  return (
    <div className="section" style={{ marginTop: 12 }}>
      {/* Pinned */}
      {msgs.filter(m => m.pinned).map(m => (
        <div key={m.id} className="card card-pad" style={{ background: "var(--amber-50)", borderColor: "#fde68a", marginBottom: 12 }}>
          <div className="row gap-2"><Icon name="flag" size={12} className="text-amber"/><span className="text-xs fw-600 text-amber">置顶</span></div>
          <div className="text-sm text-slate-800" style={{ marginTop: 6, lineHeight: 1.6 }}>{m.body}</div>
          <div className="text-xs muted" style={{ marginTop: 6 }}>— {m.from} · {m.time}</div>
        </div>
      ))}

      {/* Today task pill */}
      <div style={{ textAlign: "center", margin: "0 0 12px" }}>
        <span className="text-xs muted" style={{ background: "var(--slate-100)", padding: "3px 12px", borderRadius: 999 }}>今天</span>
      </div>

      {/* Messages */}
      <div className="col" style={{ gap: 12 }}>
        {msgs.filter(m => !m.pinned).map(m => m.system ? (
          <div key={m.id} style={{ textAlign: "center" }}>
            <div className="card card-pad" style={{ display: "inline-block", padding: "8px 14px", background: "var(--indigo-50)", borderColor: "var(--indigo-100)" }}>
              <div className="row gap-2"><Icon name="message" size={12} className="text-indigo"/><span className="text-xs text-indigo">{m.from}: {m.body}</span></div>
            </div>
          </div>
        ) : (
          <GroupMessageItem key={m.id} m={m} onOpenQuestion={onOpenQuestion}/>
        ))}
      </div>
    </div>
  );
}

function GroupMessageItem({ m, onOpenQuestion }) {
  const isMe = m.from === "张同学";
  return (
    <div className="row gap-2" style={{ alignItems: "flex-start", flexDirection: isMe ? "row-reverse" : "row" }}>
      <div className="avatar sm" style={{ background: isMe ? "linear-gradient(135deg,var(--blue-500),var(--indigo-500))" : "var(--slate-300)", flexShrink: 0 }}>{m.from[0]}</div>
      <div className="col" style={{ maxWidth: "78%", alignItems: isMe ? "flex-end" : "flex-start", gap: 4 }}>
        <div className="row gap-2">
          {!isMe && <span className="text-xs fw-600">{m.from}</span>}
          {!isMe && <AuthorBadge type={m.badge}/>}
          <span className="text-xs muted">{m.time}</span>
        </div>
        <div style={{
          background: isMe ? "var(--blue-600)" : "#fff",
          color: isMe ? "#fff" : "var(--slate-800)",
          padding: "9px 13px",
          borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          border: isMe ? "0" : "1px solid var(--slate-200)",
          fontSize: 14, lineHeight: 1.55,
        }}>{m.body}</div>
        {m.attachQuestion && (
          <div className="card card-pad" style={{ background: "var(--slate-50)", padding: "8px 10px", cursor: "pointer" }} onClick={() => onOpenQuestion(m.attachQuestion.qId)}>
            <div className="row gap-2"><Icon name="link" size={11} className="text-blue"/><span className="text-xs fw-600 text-blue truncate">{m.attachQuestion.title}</span></div>
          </div>
        )}
        {m.react && (
          <span className="badge" style={{ background: "var(--slate-100)", fontSize: 11 }}>{m.react}</span>
        )}
      </div>
    </div>
  );
}

function GroupMembers() {
  return (
    <div className="section">
      <div className="col" style={{ gap: 8 }}>
        {KAKOMON_GROUP_MEMBERS.map(mb => (
          <div key={mb.name} className="card card-pad" style={mb.isMe ? { background: "var(--blue-50)", borderColor: "var(--blue-100)" } : null}>
            <div className="row gap-3">
              <div style={{ position: "relative" }}>
                <div className="avatar sm">{mb.name[0]}</div>
                {mb.lastActive === "在线" && <span style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, background: "var(--green-500)", border: "2px solid #fff", borderRadius: 999 }}/>}
              </div>
              <div className="col flex1" style={{ gap: 2 }}>
                <div className="row gap-2">
                  <span className="text-sm fw-600">{mb.name}</span>
                  {mb.isMe && <span className="badge passed">我</span>}
                  {mb.role !== "成员" && <span className="badge" style={{ background: "var(--indigo-50)", color: "var(--indigo-600)" }}>{mb.role}</span>}
                  <AuthorBadge type={mb.badge}/>
                </div>
                <span className="text-xs muted">{mb.lastActive}</span>
              </div>
              <div className="col" style={{ alignItems: "flex-end", gap: 2, minWidth: 50 }}>
                <span className="text-xs muted">进度</span>
                <span className="text-sm fw-700" style={{ fontFamily: "var(--font-num)" }}>{mb.progress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 12 }}/>
      <button className="btn btn-block btn-outlined"><Icon name="plus" size={14}/> 邀请同学加入</button>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function GroupEvents() {
  const iconMap = { study: "flame", qa: "message", offline: "user" };
  const colorMap = { study: "rose", qa: "indigo", offline: "amber" };
  return (
    <div className="section">
      <div className="col" style={{ gap: 8 }}>
        {KAKOMON_GROUP_EVENTS.map((ev, i) => (
          <div key={i} className="card card-pad">
            <div className="row gap-3">
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `var(--${colorMap[ev.type]}-50)`,
                color: `var(--${colorMap[ev.type]}-600)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={iconMap[ev.type]} size={16}/>
              </div>
              <div className="col flex1" style={{ gap: 2 }}>
                <span className="text-xs muted">{ev.date}</span>
                <span className="text-sm fw-600">{ev.title}</span>
                <span className="text-xs muted" style={{ marginTop: 2 }}><Icon name="user" size={10}/> {ev.attendees} 人参加</span>
              </div>
              <button className="btn btn-sm btn-outlined">报名</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 12 }}/>
      <button className="btn btn-block btn-outlined"><Icon name="plus" size={14}/> 发起活动</button>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function GroupComposer() {
  const [text, setText] = useStateGr("");
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 64,
      padding: "10px 12px",
      background: "rgba(255,255,255,0.96)",
      borderTop: "1px solid var(--slate-200)",
      backdropFilter: "blur(10px)",
    }}>
      <div className="row gap-2" style={{ marginBottom: 8 }}>
        <button className="chip slate chip-btn"><Icon name="link" size={10}/> 引用题目</button>
        <button className="chip slate chip-btn"><Icon name="flame" size={10}/> 今日打卡</button>
        <button className="chip slate chip-btn"><Icon name="sparkles" size={10}/> @ AI</button>
      </div>
      <div className="row gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="说点什么…"
          style={{
            flex: 1, height: 38, borderRadius: 999,
            border: "1px solid var(--slate-200)",
            padding: "0 14px", fontSize: 14, outline: "none",
            background: "var(--slate-50)",
          }}
        />
        <button style={{ width: 38, height: 38, borderRadius: 999, background: "var(--indigo-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="send" size={16}/>
        </button>
      </div>
    </div>
  );
}

window.GroupListScreen = GroupListScreen;
window.GroupDetailScreen = GroupDetailScreen;
