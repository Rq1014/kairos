// ============================================================
// Reusable mini components: status bar, app header, bottom nav,
// chips, badges, segmented control, lock overlay, etc.
// ============================================================

function StatusBar() {
  return (
    <div className="status-bar">
      <span>9:41</span>
      <div className="right">
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="4" y="4" width="3" height="6" rx="0.5"/><rect x="8" y="2" width="3" height="8" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 5a8 8 0 0 1 12 0M3.2 7a5 5 0 0 1 7.6 0M5.5 9a2 2 0 0 1 3 0"/></svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="18" height="9" rx="2"/><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/><rect x="19.5" y="3" width="2" height="4" rx="0.6" fill="currentColor"/></svg>
      </div>
    </div>
  );
}

function AppHeader({ title, left, right, onBack, subtitle, transparent }) {
  return (
    <div className="app-header" style={transparent ? { background: 'transparent' } : null}>
      <div className="row gap-2">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="back"><Icon name="back" size={20} /></button>
        ) : left}
        <div className="col" style={{ minWidth: 0 }}>
          <div className="title truncate">{title}</div>
          {subtitle && <div className="text-xs muted truncate">{subtitle}</div>}
        </div>
      </div>
      <div className="row gap-2">{right}</div>
    </div>
  );
}

const TAB_CONFIG = [
  { id: "study",      label: "学习", icon: "book" },
  { id: "university", label: "大学", icon: "graph" },
  { id: "forum",      label: "论坛", icon: "forum" },
  { id: "profile",    label: "我的", icon: "user" },
];

function BottomNav({ active, onSelect }) {
  return (
    <nav className="bottom-nav">
      {TAB_CONFIG.map(t => (
        <button
          key={t.id}
          className={"tab" + (active === t.id ? " active" : "")}
          onClick={() => onSelect(t.id)}
        >
          <Icon name={t.icon} size={22} strokeWidth={active === t.id ? 2.2 : 1.7} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// Segmented control
function Segmented({ items, value, onChange }) {
  return (
    <div className="segmented">
      {items.map(it => {
        const v = typeof it === "string" ? it : it.value;
        const lbl = typeof it === "string" ? it : it.label;
        return (
          <button key={v} className={value === v ? "active" : ""} onClick={() => onChange(v)}>{lbl}</button>
        );
      })}
    </div>
  );
}

// Chip — selectable
function Chip({ children, color = "slate", selected, onClick, outlined, size }) {
  const cls = ["chip"];
  if (color) cls.push(color);
  if (outlined) cls.push("outlined");
  if (size === "lg") cls.push("lg");
  if (onClick) cls.push("chip-btn");
  if (selected) cls.push("selected");
  return (
    <span className={cls.join(" ")} onClick={onClick}>{children}</span>
  );
}

function PlanBadge({ user }) {
  if (user.isPro) return <span className="badge pro"><Icon name="crown" size={10} /> PRO</span>;
  return <span className="badge free">FREE</span>;
}

function MatchTypeBadge({ type }) {
  const map = {
    exact_question: { cls: "exact",  label: "完全同题" },
    same_point:     { cls: "point",  label: "同考点" },
    similar_method: { cls: "method", label: "相似解法" },
  };
  const m = map[type] || map.same_point;
  return <span className={"badge " + m.cls}>{m.label}</span>;
}

// Locked content with blur overlay
function LockedContent({ children, message, ctaText = "解锁 Pro", onUnlock, height = 180 }) {
  return (
    <div className="locked-content" style={{ minHeight: height }}>
      <div className="blurred">{children}</div>
      <div className="lock-cover">
        <div style={{
          width: 38, height: 38, borderRadius: 999,
          background: "linear-gradient(135deg,#f59e0b,#f43f5e)",
          color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="lock" size={18} strokeWidth={2.2} />
        </div>
        <div className="text-sm fw-600 text-slate-800" style={{ marginTop: 4 }}>{message}</div>
        <button className="btn btn-amber btn-sm" style={{ background: "linear-gradient(135deg,#f59e0b,#f43f5e)", color: "#fff" }} onClick={onUnlock}>
          <Icon name="crown" size={12} /> {ctaText}
        </button>
      </div>
    </div>
  );
}

// Bottom sheet
function BottomSheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <>
      <div className="sheet-overlay" onClick={onClose}></div>
      <div className="sheet">
        <div className="grabber"></div>
        {title && (
          <div style={{ padding: "8px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="text-lg fw-600">{title}</div>
            <button className="icon-btn" style={{ width: 32, height: 32, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </div>
    </>
  );
}

// Math placeholder block — for question original-image preview
function MathBlock({ lines = [], label = "原题图（轻置 · 点击查看原版）" }) {
  return (
    <div className="math-placeholder">
      {lines.map((l, i) => <span key={i} className="mathline">{l}</span>)}
      <div className="label">{label}</div>
    </div>
  );
}

// Difficulty badge with color
function DifficultyBadge({ label, level }) {
  const lvlMap = { easy: "green", medium: "amber", hard: "amber", very_hard: "rose" };
  const cls = lvlMap[level] || "amber";
  return <span className={"chip " + cls}>{label}</span>;
}

// AuthorBadge
function AuthorBadge({ type }) {
  const map = {
    preparing: { cls: "preparing", label: "备考中" },
    passed:    { cls: "passed",    label: "已合格" },
    verified:  { cls: "verified",  label: "运营验证" },
  };
  const m = map[type] || map.preparing;
  return <span className={"badge " + m.cls}>{m.label}</span>;
}

// Mini bar chart for radar substitute
function DimensionBars({ dims, accent = "blue" }) {
  const colorMap = { blue: "var(--blue-500)", teal: "var(--teal-500)", indigo: "var(--indigo-500)", amber: "var(--amber-500)" };
  const c = colorMap[accent] || colorMap.blue;
  return (
    <div className="col gap-2" style={{ gap: 10 }}>
      {Object.entries(dims).map(([k, v]) => (
        <div key={k}>
          <div className="row-between" style={{ marginBottom: 4 }}>
            <span className="text-xs fw-500 text-slate-700">{k}</span>
            <span className="text-xs muted" style={{ fontFamily: "var(--font-num)" }}>{v}</span>
          </div>
          <div className="bar"><div className="bar-fill" style={{ width: v + "%", background: c }} /></div>
        </div>
      ))}
    </div>
  );
}

// Tabs (top)
function TopTabs({ tabs, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 18, padding: "0 16px", borderBottom: "1px solid var(--slate-200)", marginTop: 6 }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: "10px 0", fontSize: 14, fontWeight: 500,
            color: value === t ? "var(--slate-900)" : "var(--slate-500)",
            borderBottom: value === t ? "2px solid var(--blue-600)" : "2px solid transparent",
            marginBottom: -1,
            transition: "color .15s",
          }}
        >{t}</button>
      ))}
    </div>
  );
}

// Empty state mini
function EmptyHint({ icon = "alert", text }) {
  return (
    <div className="col" style={{ alignItems: "center", padding: "32px 16px", color: "var(--slate-400)", gap: 6 }}>
      <Icon name={icon} size={28} strokeWidth={1.5} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

Object.assign(window, {
  StatusBar, AppHeader, BottomNav, Segmented, Chip, PlanBadge, MatchTypeBadge,
  LockedContent, BottomSheet, MathBlock, DifficultyBadge, AuthorBadge,
  DimensionBars, TopTabs, EmptyHint, TAB_CONFIG,
});
