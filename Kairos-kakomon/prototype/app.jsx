// ============================================================
// Main app — routing, screens, tweaks.
// ============================================================

const { useState: useS, useEffect: useE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "blue",
  "density": "default",
  "isPro": false,
  "showStudyTips": true,
  "showOnboarding": false
}/*EDITMODE-END*/;

function App() {
  // ------- Tweaks -------
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isPro = tweaks.isPro;
  const setIsPro = (v) => setTweak("isPro", v);

  const user = React.useMemo(() => ({ ...KAKOMON_USER, isPro }), [isPro]);

  // ------- Routing -------
  // Stack = [{type, ...}]; activeTab is the bottom-nav root
  const [activeTab, setActiveTab] = useS("study");
  // sub-stack per tab: { study: [...], university: [...], forum: [...], profile: [...] }
  const [stacks, setStacks] = useS({
    study: [{ kind: "dashboard" }],
    university: [{ kind: "list" }],
    forum: [{ kind: "list" }],
    profile: [{ kind: "main" }],
  });
  const [auth, setAuth] = useS(true); // mock logged-in by default

  const [aiSheet, setAiSheet] = useS({ open: false, questionId: null });

  const push = (tab, screen) => {
    setStacks(s => ({ ...s, [tab]: [...s[tab], screen] }));
  };
  const pop = (tab) => {
    setStacks(s => {
      if (s[tab].length <= 1) return s;
      return { ...s, [tab]: s[tab].slice(0, -1) };
    });
  };
  const reset = (tab, screen) => setStacks(s => ({ ...s, [tab]: [screen] }));

  const handleTabSelect = (tab) => {
    if (tab === activeTab) {
      reset(tab, stacks[tab][0]); // reset stack
    } else {
      setActiveTab(tab);
    }
  };

  // ------- Cross-screen actions -------
  const openQuestion = (qId) => push(activeTab, { kind: "question", id: qId });
  const openUniversity = (uId) => {
    setActiveTab("university");
    setStacks(s => ({ ...s, university: [{ kind: "list" }, { kind: "detail", id: uId }] }));
  };
  const openQuestionList = (uId) => push(activeTab, { kind: "questionList", id: uId });
  const openThread = (tId) => {
    setActiveTab("forum");
    setStacks(s => ({ ...s, forum: [{ kind: "list" }, { kind: "thread", id: tId }] }));
  };
  const openSettings = () => push("profile", { kind: "settings" });
  const openAiChat = (qId, prompt) => push(activeTab, { kind: "aichat", id: qId, prompt });
  const askAi = (qId) => setAiSheet({ open: true, questionId: qId });
  const closeAiSheet = () => setAiSheet({ open: false, questionId: null });
  const submitAiSheet = (payload) => {
    const qId = aiSheet.questionId;
    closeAiSheet();
    openAiChat(qId, payload.text);
  };
  const upgradePro = () => push(activeTab, { kind: "paywall" });
  const purchasePro = () => { setIsPro(true); pop(activeTab); };
  const openNotifications = () => push(activeTab, { kind: "notifications" });
  const openCompose = () => push("forum", { kind: "compose" });
  const openWriteReview = (uId) => push(activeTab, { kind: "writereview", id: uId });
  const openProfessor = (name, uId) => push(activeTab, { kind: "professor", name, universityId: uId });
  const openCompare = () => push("university", { kind: "compare" });
  const openGroupList = () => push("forum", { kind: "groupList" });
  const openGroup = (gId) => push("forum", { kind: "group", id: gId });
  const openThreadSmart = (tId) => {
    const t = KAKOMON_THREADS.find(x => x.id === tId);
    const kind = (t && t.type === "material_request") ? "materialRequest" : "thread";
    setActiveTab("forum");
    setStacks(s => ({ ...s, forum: [{ kind: "list" }, { kind, id: tId }] }));
  };

  // ------- Render current screen -------
  if (tweaks.showOnboarding) {
    return (
      <div className="app-shell">
        <OnboardingScreen onComplete={() => setTweak("showOnboarding", false)}/>
      </div>
    );
  }
  if (!auth) {
    return <LoginScreen onLogin={() => setAuth(true)} />;
  }

  const currentStack = stacks[activeTab];
  const top = currentStack[currentStack.length - 1];
  const goBack = () => pop(activeTab);

  const renderScreen = () => {
    if (activeTab === "study") {
      if (top.kind === "dashboard") return (
        <StudyDashboard
          user={user}
          onOpenQuestion={openQuestion}
          onOpenUniversity={openUniversity}
          onAskAi={() => askAi("q-todai-2024-math-3")}
          onOpenWrongBook={() => push("study", { kind: "wrongbook" })}
          onSearchQuestions={() => push("study", { kind: "search" })}
          onOpenReferences={() => push("study", { kind: "references" })}
          onOpenNotifications={openNotifications}
        />
      );
      if (top.kind === "question") return (
        <QuestionDetailScreen
          questionId={top.id} user={user} onBack={goBack}
          onAskAi={() => askAi(top.id)}
          onOpenQuestion={openQuestion}
          onUpgradePro={upgradePro}
        />
      );
      if (top.kind === "questionList") return (
        <QuestionListScreen universityId={top.id} onBack={goBack} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "aichat") return (
        <AiChatScreen contextQuestionId={top.id} initialPrompt={top.prompt} user={user} onBack={goBack}/>
      );
      if (top.kind === "wrongbook") return (
        <WrongBookScreen onBack={goBack} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "references") return (
        <ReferenceIndexScreen onBack={goBack} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "search") return (
        <SearchScreen onBack={goBack} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "paywall") return (
        <PaywallScreen user={user} onBack={goBack} onPurchase={purchasePro}/>
      );
      if (top.kind === "notifications") return (
        <NotificationsScreen onBack={goBack} onOpenQuestion={openQuestion} onOpenThread={openThread} onUpgradePro={upgradePro}/>
      );
      if (top.kind === "writereview") return (
        <WriteReviewScreen universityId={top.id} onBack={goBack} onSubmit={goBack}/>
      );
    }
    if (activeTab === "university") {
      if (top.kind === "list") return (
        <UniversityListScreen onOpenUniversity={openUniversity} onOpenCompare={openCompare}/>
      );
      if (top.kind === "compare") return (
        <UniversityCompareScreen onBack={goBack} onOpenUniversity={openUniversity}/>
      );
      if (top.kind === "detail") return (
        <UniversityDetailScreen
          universityId={top.id} onBack={goBack}
          onOpenQuestionList={openQuestionList}
          onOpenQuestion={openQuestion}
          onOpenForum={openThreadSmart}
          onWriteReview={() => openWriteReview(top.id)}
          onOpenProfessor={openProfessor}
        />
      );
      if (top.kind === "professor") return (
        <ProfessorDetailScreen professorName={top.name} universityId={top.universityId} isPro={isPro}
          onBack={goBack} onUpgradePro={upgradePro} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "questionList") return (
        <QuestionListScreen universityId={top.id} onBack={goBack} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "question") return (
        <QuestionDetailScreen questionId={top.id} user={user} onBack={goBack}
          onAskAi={() => askAi(top.id)} onOpenQuestion={openQuestion} onUpgradePro={upgradePro} />
      );
      if (top.kind === "aichat") return (
        <AiChatScreen contextQuestionId={top.id} initialPrompt={top.prompt} user={user} onBack={goBack}/>
      );
      if (top.kind === "writereview") return (
        <WriteReviewScreen universityId={top.id} onBack={goBack} onSubmit={goBack}/>
      );
      if (top.kind === "paywall") return (
        <PaywallScreen user={user} onBack={goBack} onPurchase={purchasePro}/>
      );
    }
    if (activeTab === "forum") {
      if (top.kind === "list") return (
        <ForumHomeScreen onOpenThread={(tid) => {
          const t = KAKOMON_THREADS.find(x => x.id === tid);
          push("forum", { kind: (t && t.type === "material_request") ? "materialRequest" : "thread", id: tid });
        }} onCompose={openCompose}
          onOpenGroupList={openGroupList} onOpenGroup={openGroup}/>
      );
      if (top.kind === "compose") return (
        <ComposeThreadScreen onBack={goBack} onSubmit={goBack}/>
      );
      if (top.kind === "thread") return (
        <ThreadDetailScreen threadId={top.id} user={user} onBack={goBack}
          onOpenQuestion={openQuestion} onUpgradePro={upgradePro}/>
      );
      if (top.kind === "materialRequest") return (
        <MaterialRequestScreen threadId={top.id} onBack={goBack} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "groupList") return (
        <GroupListScreen onBack={goBack} onOpenGroup={openGroup} onCreateGroup={() => {}}/>
      );
      if (top.kind === "group") return (
        <GroupDetailScreen groupId={top.id} onBack={goBack} onOpenQuestion={openQuestion}/>
      );
      if (top.kind === "question") return (
        <QuestionDetailScreen questionId={top.id} user={user} onBack={goBack}
          onAskAi={() => askAi(top.id)} onOpenQuestion={openQuestion} onUpgradePro={upgradePro} />
      );
      if (top.kind === "paywall") return (
        <PaywallScreen user={user} onBack={goBack} onPurchase={purchasePro}/>
      );
    }
    if (activeTab === "profile") {
      if (top.kind === "main") return (
        <ProfileScreen
          user={user}
          isPro={isPro}
          setIsPro={setIsPro}
          onOpenSettings={openSettings}
          onUpgradePro={upgradePro}
          onOpenSubScreen={() => push("profile", { kind: "settings" })}
        />
      );
      if (top.kind === "settings") return (
        <SettingsScreen user={user} onBack={goBack} isPro={isPro} setIsPro={setIsPro} onLogout={() => setAuth(false)}/>
      );
      if (top.kind === "paywall") return (
        <PaywallScreen user={user} onBack={goBack} onPurchase={purchasePro}/>
      );
    }
    return null;
  };

  return (
    <div className={"app-shell density-" + tweaks.density}>
      {renderScreen()}
      <BottomNav active={activeTab} onSelect={handleTabSelect}/>
      <AiContextSheet
        open={aiSheet.open}
        onClose={closeAiSheet}
        onSubmit={submitAiSheet}
        contextQuestionId={aiSheet.questionId}
        user={user}
      />

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection title="主题">
          <TweakRadio
            label="主色"
            value={tweaks.accent}
            options={[
              { value: "blue",   label: "蓝" },
              { value: "teal",   label: "青" },
              { value: "indigo", label: "靛" },
            ]}
            onChange={v => setTweak("accent", v)}
          />
          <TweakRadio
            label="卡片密度"
            value={tweaks.density}
            options={[
              { value: "compact", label: "紧凑" },
              { value: "default", label: "默认" },
              { value: "cozy",    label: "宽松" },
            ]}
            onChange={v => setTweak("density", v)}
          />
        </TweakSection>
        <TweakSection title="账户状态">
          <TweakToggle label="Pro 用户" value={isPro} onChange={setIsPro} />
          <div className="text-xs muted" style={{ padding: "0 2px" }}>切换后，详情页 / 论坛 / 个人页的 Pro 锁会一起变化。</div>
        </TweakSection>
        <TweakSection title="登录态">
          <TweakButton label={auth ? "退出登录（看登录页）" : "登录"} onClick={() => setAuth(!auth)} />
          <TweakButton label="查看 Onboarding（首次引导）" onClick={() => setTweak("showOnboarding", true)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
