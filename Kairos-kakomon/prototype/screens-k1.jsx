// ============================================================
// K1 — Login + Profile + Settings
// ============================================================

const { useState: useStateK1 } = React;

function LoginScreen({ onLogin }) {
  const [tab, setTab] = useStateK1("login");
  const [email, setEmail] = useStateK1("zhang@example.com");
  const [pw, setPw] = useStateK1("••••••••");

  return (
    <div className="screen fade-in" style={{ background: "linear-gradient(180deg, #f0f9ff 0%, var(--slate-50) 40%)" }}>
      <StatusBar />
      <div style={{ padding: "40px 24px 0" }}>
        <div className="row gap-2" style={{ marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, var(--blue-600), var(--teal-500))",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700,
          }}>過</div>
          <div className="col">
            <div className="text-xl fw-700" style={{ letterSpacing: "-0.01em" }}>Kakomon · 過去問</div>
            <div className="text-xs muted">大学院入试（修考）智能学习</div>
          </div>
        </div>
        <div className="text-3xl fw-700" style={{ lineHeight: 1.2, marginTop: 28, letterSpacing: "-0.02em" }}>欢迎回来</div>
        <div className="text-sm muted" style={{ marginTop: 6 }}>把过去问拆到题，每题都讲透</div>
      </div>

      <div style={{ padding: "32px 24px 0" }}>
        <div className="segmented" style={{ marginBottom: 18 }}>
          <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>登录</button>
          <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>注册</button>
        </div>

        <div className="col" style={{ gap: 12 }}>
          <Input label="邮箱" value={email} onChange={setEmail} placeholder="your@email.com" />
          <Input label="密码" value={pw} onChange={setPw} type="password" placeholder="••••••••" />
          {tab === "register" && <Input label="昵称" value="" onChange={() => {}} placeholder="例如 张同学" />}
        </div>

        {tab === "login" && (
          <div className="row-between" style={{ marginTop: 10 }}>
            <label className="row gap-2 text-xs muted">
              <input type="checkbox" defaultChecked /> 记住我
            </label>
            <a className="text-xs text-blue fw-600" href="#">忘记密码？</a>
          </div>
        )}

        <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 20 }} onClick={onLogin}>
          {tab === "login" ? "登录" : "注册并登录"}
        </button>

        <div className="row gap-2" style={{ margin: "24px 0", alignItems: "center" }}>
          <div style={{ flex: 1, height: 1, background: "var(--slate-200)" }}/>
          <span className="text-xs muted">或</span>
          <div style={{ flex: 1, height: 1, background: "var(--slate-200)" }}/>
        </div>

        <div className="row gap-2">
          <button className="btn btn-outlined btn-block" style={{ flex: 1 }}>微信</button>
          <button className="btn btn-outlined btn-block" style={{ flex: 1 }}>LINE</button>
          <button className="btn btn-outlined btn-block" style={{ flex: 1 }}>Apple</button>
        </div>

        <div className="text-xs muted" style={{ textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
          继续即代表同意 <a className="text-blue" href="#">服务条款</a> 与 <a className="text-blue" href="#">隐私政策</a>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type, placeholder }) {
  return (
    <label className="col" style={{ gap: 6 }}>
      <span className="text-xs fw-600 muted" style={{ marginLeft: 2 }}>{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        type={type || "text"}
        placeholder={placeholder}
        style={{
          height: 44, borderRadius: 10,
          border: "1px solid var(--slate-200)",
          padding: "0 14px", fontSize: 14, outline: "none",
          background: "#fff",
        }}
      />
    </label>
  );
}

// ---------- Profile ----------
function ProfileScreen({ user, onOpenSettings, onUpgradePro, onOpenSubScreen, isPro, setIsPro }) {
  const target = KAKOMON_UNIVERSITIES.filter(u => user.targetUniversityIds.includes(u.id));

  // build heatmap from weak points (8x6 grid)
  const heatCells = [];
  user.weakPoints.forEach(w => {
    for (let i = 0; i < w.count; i++) heatCells.push(w.level);
  });
  while (heatCells.length < 42) heatCells.push(0);

  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title="我的"
        right={
          <button className="icon-btn" style={{ width:36, height:36, borderRadius:999, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onOpenSettings}>
            <Icon name="settings" size={18}/>
          </button>
        }
      />

      {/* Profile header */}
      <div className="section" style={{ marginTop: 4 }}>
        <div className="card card-pad-lg" style={{ background: isPro ? "linear-gradient(135deg, #fff7ed, #fff)" : "linear-gradient(135deg, #eff6ff, #fff)" }}>
          <div className="row gap-3">
            <div className="avatar lg">{user.nickname[0]}</div>
            <div className="col flex1" style={{ gap: 4 }}>
              <div className="row gap-2">
                <span className="text-lg fw-700">{user.nickname}</span>
                {isPro
                  ? <span className="badge pro"><Icon name="crown" size={10}/> PRO</span>
                  : <span className="badge free">FREE</span>}
              </div>
              <div className="text-xs muted">{user.major} · 目标 {target.map(t => t.short).join(" / ")}</div>
              <div className="row gap-2" style={{ marginTop: 4 }}>
                <span className="chip outlined"><Icon name="trophy" size={10}/> 贡献分 {user.contributorPoints}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI quota */}
      <div className="section">
        <div className="card card-pad" style={{ background: "linear-gradient(135deg, #f0fdfa, #fff)" }}>
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div className="row gap-2">
              <Icon name="sparkles" size={14} className="text-teal"/>
              <span className="text-sm fw-600">AI 提问额度</span>
            </div>
            {!isPro && <button className="btn btn-sm" onClick={onUpgradePro} style={{ background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff", padding: "5px 10px" }}>升级 Pro</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <QuotaCell label="今日免费" value={isPro ? "∞" : user.freeAiRemaining} unit="次" color="teal" />
            <QuotaCell label="Token 余额" value={user.tokenBalance} unit="个" color="amber" />
            <QuotaCell label="累计提问" value={user.aiAskCount} unit="次" color="indigo" />
          </div>
        </div>
      </div>

      {/* Study stats */}
      <div className="section">
        <h3>学习统计</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <StatCard icon="check"    color="green"  value={user.solvedCount}   label="已做题" onClick={() => onOpenSubScreen("solved")} />
          <StatCard icon="alert"    color="amber"  value={user.unclearCount} label="模糊" onClick={() => onOpenSubScreen("unclear")} />
          <StatCard icon="flame"    color="rose"   value={user.wrongCount}   label="不会" badge="错题本" onClick={() => onOpenSubScreen("wrong")} />
          <StatCard icon="bookmark" color="blue"   value={user.favoriteCount} label="收藏" onClick={() => onOpenSubScreen("favorites")} />
        </div>
      </div>

      {/* Weak point heatmap */}
      <div className="section">
        <h3>
          <span>弱点地图</span>
          <span className="more">最近 30 天</span>
        </h3>
        <div className="card card-pad-lg">
          <div className="heatmap">
            {heatCells.slice(0, 42).map((v, i) => (
              <div key={i} className={"cell" + (v ? " l" + v : "")} title={`level ${v}`}/>
            ))}
          </div>
          <div className="row gap-3" style={{ marginTop: 12 }}>
            <span className="text-xs muted">少</span>
            <div className="row" style={{ gap: 3 }}>
              <span className="cell" style={{ width: 12, height: 12, borderRadius: 3, background: "var(--slate-100)" }}/>
              <span className="cell" style={{ width: 12, height: 12, borderRadius: 3, background: "#dbeafe" }}/>
              <span className="cell" style={{ width: 12, height: 12, borderRadius: 3, background: "#93c5fd" }}/>
              <span className="cell" style={{ width: 12, height: 12, borderRadius: 3, background: "#fbbf24" }}/>
              <span className="cell" style={{ width: 12, height: 12, borderRadius: 3, background: "#fb7185" }}/>
              <span className="cell" style={{ width: 12, height: 12, borderRadius: 3, background: "#be123c" }}/>
            </div>
            <span className="text-xs muted">多</span>
            <span className="text-xs muted" style={{ marginLeft: "auto" }}>共 31 个弱点</span>
          </div>
          <div className="divider" />
          <div className="col" style={{ gap: 8 }}>
            {user.weakPoints.slice(0, 4).map((w, i) => (
              <div key={i} className="row-between">
                <div className="row gap-2">
                  <span className={"cell"} style={{ width: 10, height: 10, borderRadius: 3, background: w.level >= 4 ? "#fb7185" : w.level >= 3 ? "#fbbf24" : "#93c5fd" }} />
                  <span className="text-xs">{w.subject} · {w.point}</span>
                </div>
                <span className="text-xs muted">{w.count} 错题</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick entries */}
      <div className="section">
        <div className="card" style={{ overflow: "hidden" }}>
          {[
            { icon: "flame",    label: "我的错题",       count: user.wrongCount },
            { icon: "bookmark", label: "我的收藏",       count: user.favoriteCount },
            { icon: "sparkles", label: "我的 AI 提问",   count: user.aiAskCount },
            { icon: "upload",   label: "上传贡献",       hint: "可换 Pro 时间", color: "amber" },
          ].map((r, i, arr) => (
            <button key={i} className="row-between" style={{
              width: "100%", padding: "13px 14px", textAlign: "left",
              borderBottom: i < arr.length - 1 ? "1px solid var(--slate-100)" : "none",
            }}>
              <div className="row gap-2">
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: `var(--${r.color || "slate"}-50)`,
                  color: `var(--${r.color || "slate"}-600)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}><Icon name={r.icon} size={14}/></div>
                <span className="text-sm fw-500">{r.label}</span>
                {r.hint && <span className="badge token">{r.hint}</span>}
              </div>
              <div className="row gap-2 text-xs muted">
                {r.count !== undefined && <span style={{ fontFamily: "var(--font-num)" }}>{r.count}</span>}
                <Icon name="chevronRight" size={14}/>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contributor card */}
      <div className="section">
        <div className="card card-pad-lg" style={{ background: "linear-gradient(135deg, #fff7ed, #fffbeb)", borderColor: "#fde68a" }}>
          <div className="row gap-2"><Icon name="trophy" size={14} className="text-amber"/><span className="text-sm fw-600 text-amber">贡献者计划</span></div>
          <div className="text-sm fw-600" style={{ marginTop: 6, lineHeight: 1.4 }}>上传过去问 / 参考书索引，可获得积分或 Pro 时间</div>
          <div className="row-between" style={{ marginTop: 10 }}>
            <div className="col" style={{ gap: 2 }}>
              <span className="text-xs muted">我的积分</span>
              <span className="text-xl fw-700 text-amber" style={{ fontFamily: "var(--font-num)" }}>{user.contributorPoints}</span>
            </div>
            <div className="col" style={{ gap: 2 }}>
              <span className="text-xs muted">距离 1 个月 Pro</span>
              <span className="text-xs fw-600">还差 60 分</span>
            </div>
            <button className="btn btn-amber btn-sm">立即贡献</button>
          </div>
          <div className="bar" style={{ marginTop: 10 }}><div className="bar-fill amber" style={{ width: "80%" }}/></div>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function StatCard({ icon, color, value, label, badge, onClick }) {
  return (
    <button className="card card-pad" onClick={onClick} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <div className="row-between" style={{ width: "100%" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `var(--${color}-50)`,
          color: `var(--${color}-600)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={icon} size={15}/></div>
        {badge && <span className="badge" style={{ background: `var(--${color}-50)`, color: `var(--${color}-600)` }}>{badge}</span>}
      </div>
      <div className="text-2xl fw-700" style={{ fontFamily: "var(--font-num)", letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs muted">{label}</div>
    </button>
  );
}

function QuotaCell({ label, value, unit, color }) {
  return (
    <div className="col" style={{ gap: 2, padding: "4px 0" }}>
      <div className="text-xs muted">{label}</div>
      <div className="row gap-2" style={{ alignItems: "baseline" }}>
        <span className={"text-xl fw-700 text-" + color} style={{ fontFamily: "var(--font-num)", letterSpacing: "-0.02em" }}>{value}</span>
        <span className="text-xs muted">{unit}</span>
      </div>
    </div>
  );
}

// ---------- Settings ----------
function SettingsScreen({ user, onBack, isPro, setIsPro, onLogout }) {
  return (
    <div className="screen fade-in">
      <StatusBar />
      <AppHeader title="设置" onBack={onBack}/>

      <SettingsGroup title="账户">
        <SettingsRow label="邮箱" value={user.email} />
        <SettingsRow label="昵称" value={user.nickname} />
        <SettingsRow label="专业方向" value={user.major} />
        <SettingsRow label="目标学校" value="2 所"/>
      </SettingsGroup>

      <SettingsGroup title="订阅">
        <SettingsRow label="会员状态" value={isPro ? "PRO（永久）" : "免费用户"} valueColor={isPro ? "var(--amber-600)" : "var(--slate-700)"} />
        <SettingsRow label={isPro ? "切回 Free（演示）" : "升级 Pro（演示）"} action={
          <button className="btn btn-sm" onClick={() => setIsPro(!isPro)} style={{ background: isPro ? "var(--slate-100)" : "linear-gradient(135deg,#f59e0b,#f43f5e)", color: isPro ? "var(--slate-700)" : "#fff" }}>
            {isPro ? "切换" : "切换"}
          </button>
        } />
      </SettingsGroup>

      <SettingsGroup title="通知">
        <SettingsRowToggle label="新过去问推送" defaultOn />
        <SettingsRowToggle label="弱点提醒" defaultOn />
        <SettingsRowToggle label="论坛 @ 我" defaultOn />
        <SettingsRowToggle label="贡献被采纳" defaultOn />
      </SettingsGroup>

      <SettingsGroup title="其他">
        <SettingsRow label="隐私政策" />
        <SettingsRow label="服务条款" />
        <SettingsRow label="App 版本" value="0.4.2 · MVP" />
      </SettingsGroup>

      <div className="section">
        <button className="btn btn-block btn-outlined" style={{ color: "var(--rose-600)", borderColor: "var(--rose-100)" }} onClick={onLogout}>退出登录</button>
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <div className="section">
      <h3>{title}</h3>
      <div className="card" style={{ overflow: "hidden" }}>
        {React.Children.map(children, (c, i, arr) => (
          <div style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--slate-100)" : "none" }}>{c}</div>
        ))}
      </div>
    </div>
  );
}

function SettingsRow({ label, value, valueColor, action }) {
  return (
    <div className="row-between" style={{ padding: "12px 14px" }}>
      <span className="text-sm">{label}</span>
      {action ? action : <span className="text-sm" style={{ color: valueColor || "var(--slate-500)" }}>{value} <Icon name="chevronRight" size={12}/></span>}
    </div>
  );
}

function SettingsRowToggle({ label, defaultOn }) {
  const [on, setOn] = useStateK1(defaultOn);
  return (
    <div className="row-between" style={{ padding: "12px 14px" }}>
      <span className="text-sm">{label}</span>
      <button onClick={() => setOn(!on)} style={{
        width: 38, height: 22, borderRadius: 999,
        background: on ? "var(--blue-600)" : "var(--slate-300)",
        position: "relative", transition: "all .15s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: on ? 18 : 2,
          width: 18, height: 18, borderRadius: 999,
          background: "#fff", transition: "all .15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}/>
      </button>
    </div>
  );
}

window.LoginScreen = LoginScreen;
window.ProfileScreen = ProfileScreen;
window.SettingsScreen = SettingsScreen;
