import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, DEMO_USER } from '@/mocks/data';
import { useAuthStore } from '@/store/authStore';

// ─── Types ──────────────────────────────────────────────────
interface AiSection { title: string; body: string }
interface UserMessage { role: 'user'; text: string }
interface AiMessage   { role: 'assistant'; sections: AiSection[]; chips: string[] }
type Message = UserMessage | AiMessage;

interface StreamingSection { title: string; body: string; revealed: string }
interface StreamingMessage { sections: StreamingSection[]; chips: string[] }

// ─── Mock content ────────────────────────────────────────────
const INITIAL_AI_ANSWER: AiMessage = {
  role: 'assistant',
  sections: [
    { title: '思路', body: '实对称矩阵的特征值都是实数，且不同特征值对应的特征向量天然正交。题中已给出 v₁, v₂, v₃ 正交单位化，所以可直接构造正交矩阵 P。' },
    { title: '关键考点', body: '① 谱定理（实对称矩阵正交对角化）；② Pᵀ = P⁻¹ 的运算性质；③ 用特征值代入多项式 f(λ) 判断 f(A) 的可逆性。' },
    { title: '常见误区', body: '把 P⁻¹ 当成一般矩阵的逆来计算。其实因为 P 正交，Pᵀ = P⁻¹，所以 Aⁿ = P·diag(λⁿ)·Pᵀ。' },
    { title: '推荐练习', body: '可对照《マセマ 线代》P.128 例题，与东工大 2021 数学第2问对比训练。' },
  ],
  chips: ['换种说法', '给我类似题', '只讲第2步', '推荐参考书页码'],
};

function buildFakeReply(chip: string): AiMessage {
  if (chip === '换种说法') return {
    role: 'assistant',
    sections: [
      { title: '用更直白的话', body: '你可以把这题想成：A 已经把空间分解成 3 条互相垂直的轴，每条轴对应一个伸缩倍数（2, -1, 5）。对角化就是把视角换到这 3 条轴上看 A。' },
      { title: '为什么 Aⁿ 简单', body: '在轴上做 n 次伸缩 = 倍数变成 n 次方。所以 Aⁿ 就是把 diag 里每个数变成 n 次方，再换回原坐标系。' },
    ],
    chips: ['再举个例子', '和 PCA 有什么关系', '推荐参考书页码'],
  };
  if (chip === '给我类似题') return {
    role: 'assistant',
    sections: [
      { title: '推荐 3 道', body: '① 东工大 2021 数学第2问（同套路）；② 京大 2022 数学第1问（多项式可逆性判定）；③ 阪大 2023 数学第2问（行列式表达可逆性）。' },
      { title: '训练顺序建议', body: '先做①巩固对角化求幂；再做②练习特征值代入；最后做③综合可逆性判断。' },
    ],
    chips: ['先看第①题', '推荐参考书页码'],
  };
  if (chip === '只讲第2步') return {
    role: 'assistant',
    sections: [
      { title: 'Step 2 核心', body: 'Aⁿ = (P D Pᵀ)ⁿ = P D Pᵀ P D Pᵀ … = P Dⁿ Pᵀ。中间所有 Pᵀ P 都消成 I，因为 P 正交。' },
      { title: '结果', body: 'Aⁿ = P · diag(2ⁿ, (-1)ⁿ, 5ⁿ) · Pᵀ。要算具体矩阵就把 v₁, v₂, v₃ 代入即可。' },
    ],
    chips: ['验算一下 n=2', '推荐参考书页码', '给我类似题'],
  };
  return {
    role: 'assistant',
    sections: [
      { title: '最匹配', body: '《マセマ 线性代数》P.128-131：实对称矩阵正交对角化定理，例题与本题结构一致。' },
      { title: '补充扩展', body: '《青本 数学》P.204：用正交矩阵简化求幂，解法套路相同；《演习 大学院入试 数学》P.56 例题 12：特征值多项式判断可逆。' },
    ],
    chips: ['先翻第一本', '给我类似题'],
  };
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  headerBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub:    { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  contextCard:  { backgroundColor: c.teal500 + '11', borderBottomWidth: 1, borderBottomColor: c.teal500 + '44', padding: 12, gap: 4 },
  contextTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contextLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contextLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.teal500 },
  proBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.amber500, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  proBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightBold, color: '#fff' },
  quotaMeter:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quotaText:    { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  quotaTotal:   { fontWeight: Typography.weightRegular, color: c.textMuted },
  contextTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, lineHeight: Typography.sm * 1.4 },
  contextKPs:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  kpChip:       { borderWidth: 1, borderColor: c.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  kpChipText:   { fontSize: Typography.xs, color: c.textSecondary },

  sseBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: c.teal500 + '18' },
  sseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.teal500 },
  sseText: { fontSize: Typography.xs, color: c.teal500, fontWeight: Typography.weightMedium },

  messages: { padding: Spacing.screenPadding, gap: 12 },

  userBubbleWrap: { alignItems: 'flex-end' },
  userBubble:     { maxWidth: '85%', backgroundColor: c.blue600, borderRadius: 14, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  userBubbleText: { fontSize: Typography.sm, color: '#fff', lineHeight: Typography.sm * 1.5 },

  aiRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, maxWidth: '92%' },
  aiAvatar:  { width: 28, height: 28, borderRadius: 8, backgroundColor: c.teal500, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiContent: { flex: 1, gap: 8 },
  aiCard:    { backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 12 },
  aiSection:    { gap: 4 },
  aiSectionGap: { paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
  aiSectionTitle: { fontSize: Typography.xs, fontWeight: Typography.weightBold, color: c.teal500, letterSpacing: 0.3 },
  aiSectionBody:  { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.65 },
  aiActions:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border, marginTop: 4 },
  aiActionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: c.border },
  aiActionText:  { fontSize: Typography.xs, color: c.textSecondary },

  cursor: { color: c.teal500, fontWeight: Typography.weightBold },

  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.teal500 + '22', borderWidth: 1, borderColor: c.teal500 + '66', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  suggestionChipText: { fontSize: Typography.xs, color: c.teal500, fontWeight: Typography.weightMedium },

  thinkingCard: { backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 12 },
  thinkingDots: { flexDirection: 'row', gap: 6, alignItems: 'center', height: 20 },
  thinkingDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: c.teal500 },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.rose50, borderWidth: 1, borderColor: c.rose500 + '44', borderRadius: 10, padding: 10, marginTop: 4 },
  errorText: { flex: 1, fontSize: Typography.xs, color: c.rose600 },
  retryBtn:  { backgroundColor: c.rose500, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  retryText: { fontSize: Typography.xs, color: '#fff', fontWeight: Typography.weightSemibold },

  toast:     { position: 'absolute', alignSelf: 'center', bottom: 90, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(15,23,42,0.92)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  toastText: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: '#fff' },

  composer:        { borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, gap: 6 },
  quotaExhaustedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.amber50, borderWidth: 1, borderColor: c.amber500 + '66', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  quotaExhaustedText:   { flex: 1, fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.amber600 },
  composerRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composerInput:   { flex: 1, height: 38, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, fontSize: Typography.sm, color: c.textPrimary },
  composerInputDisabled: { opacity: 0.5 },
  sendBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: c.teal500, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: c.surfaceAlt },
  composerHint:    { fontSize: Typography.xs, color: c.textMuted, textAlign: 'center' },

  // Share bottom sheet
  sheetOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetPanel:      { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: Spacing.screenPadding, paddingBottom: 36, paddingTop: 12 },
  sheetHandle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, marginBottom: 16 },
  sheetLinkBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.background, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 20 },
  sheetLinkText:   { flex: 1, fontSize: Typography.xs, color: c.teal500, fontFamily: 'monospace' },
  sheetActions:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  sheetActionBtn:  { alignItems: 'center', gap: 8 },
  sheetActionIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: c.background, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  sheetActionLabel:{ fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium },
  sheetCancelBtn:  { backgroundColor: c.background, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: c.border },
  sheetCancelText: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textSecondary },
});

// ─── Animated thinking dots ──────────────────────────────────
function ThinkingDots() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const anims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(a, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(a, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(540 - i * 180),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [anims]);

  return (
    <View style={styles.thinkingDots}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[
            styles.thinkingDot,
            {
              transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
              opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Streaming AI bubble ─────────────────────────────────────
function StreamingBubble({ msg }: { msg: StreamingMessage }) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <Icon name="sparkles" size={14} color="#fff" />
      </View>
      <View style={styles.aiContent}>
        <View style={styles.aiCard}>
          {msg.sections.map((s, si) => (
            <View key={si} style={[styles.aiSection, si > 0 && styles.aiSectionGap]}>
              <Text style={styles.aiSectionTitle}>{s.title}</Text>
              <Text style={styles.aiSectionBody}>
                {s.revealed}
                {s.revealed.length < s.body.length && (
                  <Text style={styles.cursor}>▋</Text>
                )}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────
export default function AiChatScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const { questionId } = useLocalSearchParams<{ questionId?: string }>();
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;

  const question   = questionId ? KAKOMON_QUESTIONS.find((q) => q.id === questionId) : null;
  const university = question   ? KAKOMON_UNIVERSITIES.find((u) => u.id === question.universityId) : null;

  const [messages, setMessages]   = useState<Message[]>([
    { role: 'user', text: '为什么这里一定可以对角化？Aⁿ 怎么算？' },
    INITIAL_AI_ANSWER,
  ]);
  const [composer, setComposer]       = useState('');
  const [thinking, setThinking]       = useState(false);
  const [streamingMsg, setStreamingMsg] = useState<StreamingMessage | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [tokensUsed, setTokensUsed]   = useState(1);
  const [toast, setToast]             = useState<string | null>(null);
  const [shareSheet, setShareSheet]   = useState<{ sections: AiSection[] } | null>(null);

  const scrollRef   = useRef<ScrollView>(null);
  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isStreaming = streamingMsg !== null;
  const isBusy     = thinking || isStreaming;

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, thinking, streamingMsg]);

  // Cleanup on unmount
  useEffect(() => () => { if (streamTimer.current) clearInterval(streamTimer.current); }, []);

  // Shareable deep-link URL — swap domain for production CDN once web viewer is live.
  const webUrl = question
    ? `https://kakomon.app/questions/${question.id}`
    : 'https://kakomon.app';

  const flashToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 1800);
  };

  const send = (text: string) => {
    if (isBusy) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setThinking(true);
    setConnectionError(false);
    setTokensUsed((n) => n + 1);

    // Phase 1: thinking animation (700 ms)
    setTimeout(() => {
      setThinking(false);

      const reply = buildFakeReply(text);
      const initSections: StreamingSection[] = reply.sections.map((s) => ({
        title: s.title, body: s.body, revealed: '',
      }));
      setStreamingMsg({ sections: initSections, chips: reply.chips });

      // Phase 2: SSE streaming simulation
      let sIdx = 0;
      let cIdx = 0;
      const CHARS_PER_TICK = 4;

      streamTimer.current = setInterval(() => {
        setStreamingMsg((prev) => {
          if (!prev) return null;
          const newSections = prev.sections.map((s) => ({ ...s }));
          const section = newSections[sIdx];
          if (!section) return prev;

          cIdx = Math.min(cIdx + CHARS_PER_TICK, section.body.length);
          newSections[sIdx] = { ...section, revealed: section.body.slice(0, cIdx) };

          if (cIdx >= section.body.length) {
            sIdx++;
            cIdx = 0;
            if (sIdx >= newSections.length) {
              // All done — finalise
              clearInterval(streamTimer.current!);
              setTimeout(() => {
                setMessages((m) => [...m, { role: 'assistant', sections: reply.sections, chips: reply.chips }]);
                setStreamingMsg(null);
              }, 150);
            }
          }
          return { ...prev, sections: newSections };
        });
      }, 22);
    }, 700);
  };

  const retryConnection = () => {
    setConnectionError(false);
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'user') send(last.text);
    }
  };

  const submitComposer = () => {
    if (!composer.trim() || isBusy) return;
    if (quotaExhausted) {
      router.push('/paywall' as any);
      return;
    }
    send(composer.trim());
    setComposer('');
  };

  const totalQuota      = (user.freeAiRemaining ?? 0) + (user.tokenBalance ?? 0);
  const remaining       = Math.max(0, totalQuota - tokensUsed);
  const quotaExhausted  = !user.isPro && remaining <= 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI · 这道题</Text>
          {university && question && (
            <Text style={styles.headerSub}>
              {university.short} · {question.year} {question.subject} {question.questionNo}
            </Text>
          )}
        </View>
        <Pressable
          style={styles.headerBtn}
          onPress={() => Alert.alert('更多', '', [
            { text: '清除对话记录', style: 'destructive', onPress: () => { setMessages([]); setTokensUsed(0); setStreamingMsg(null); setThinking(false); } },
            { text: '取消', style: 'cancel' },
          ])}
        >
          <Icon name="more" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Pinned context + quota */}
      {question && (
        <View style={styles.contextCard}>
          <View style={styles.contextTop}>
            <View style={styles.contextLeft}>
              <Icon name="link" size={14} color={Colors.teal500} />
              <Text style={styles.contextLabel}>已锁定上下文</Text>
            </View>
            {user.isPro ? (
              <View style={styles.proBadge}>
                <Icon name="crown" size={10} color="#fff" />
                <Text style={styles.proBadgeText}>无限</Text>
              </View>
            ) : (
              <View style={styles.quotaMeter}>
                <Icon name="sparkles" size={11} color={Colors.amber500} />
                <Text style={styles.quotaText}>
                  {remaining}<Text style={styles.quotaTotal}>/{totalQuota}</Text>
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.contextTitle} numberOfLines={2}>{question.title}</Text>
          <View style={styles.contextKPs}>
            {question.knowledgePoints.slice(0, 3).map((k) => (
              <View key={k} style={styles.kpChip}>
                <Text style={styles.kpChipText}>#{k}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* SSE 连接状态条 */}
      {isStreaming && (
        <View style={styles.sseBar}>
          <View style={styles.sseDot} />
          <Text style={styles.sseText}>AI 正在输出…</Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <View key={i} style={styles.userBubbleWrap}>
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleText}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={i} style={styles.aiRow}>
              <View style={styles.aiAvatar}>
                <Icon name="sparkles" size={14} color="#fff" />
              </View>
              <View style={styles.aiContent}>
                <View style={styles.aiCard}>
                  {m.sections.map((s, si) => (
                    <View key={si} style={[styles.aiSection, si > 0 && styles.aiSectionGap]}>
                      <Text style={styles.aiSectionTitle}>{s.title}</Text>
                      <Text style={styles.aiSectionBody}>{s.body}</Text>
                    </View>
                  ))}
                  <View style={styles.aiActions}>
                    <Pressable style={styles.aiActionBtn} onPress={() => flashToast('已加入错题本')}>
                      <Icon name="flame" size={11} color={Colors.rose500} />
                      <Text style={styles.aiActionText}>加入错题本</Text>
                    </Pressable>
                    <Pressable style={styles.aiActionBtn} onPress={() => flashToast('已保存到笔记')}>
                      <Icon name="bookmark" size={11} color={Colors.blue500} />
                      <Text style={styles.aiActionText}>保存为笔记</Text>
                    </Pressable>
                    <Pressable
                      style={styles.aiActionBtn}
                      onPress={() => setShareSheet({ sections: m.sections })}
                    >
                      <Icon name="share" size={11} color={Colors.textMuted} />
                      <Text style={styles.aiActionText}>分享</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.chipRow}>
                  {/* MVP 阶段隐藏参考书相关 chip，未来升级时恢复 */}
                  {m.chips.filter((c) => !c.includes('参考书')).map((c) => (
                    <Pressable key={c} style={styles.suggestionChip} onPress={() => send(c)} disabled={isBusy}>
                      <Icon name="zap" size={10} color={Colors.teal500} />
                      <Text style={styles.suggestionChipText}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ),
        )}

        {/* Thinking dots */}
        {thinking && (
          <View style={styles.aiRow}>
            <View style={styles.aiAvatar}>
              <Icon name="sparkles" size={14} color="#fff" />
            </View>
            <View style={styles.thinkingCard}>
              <ThinkingDots />
            </View>
          </View>
        )}

        {/* Streaming bubble */}
        {streamingMsg && <StreamingBubble msg={streamingMsg} />}

        {/* Connection error */}
        {connectionError && (
          <View style={styles.errorCard}>
            <Icon name="info" size={14} color={Colors.rose500} />
            <Text style={styles.errorText}>连接中断，请重试</Text>
            <Pressable style={styles.retryBtn} onPress={retryConnection}>
              <Text style={styles.retryText}>重试</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Icon name="check" size={13} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Composer */}
      <View style={styles.composer}>
        {quotaExhausted ? (
          <Pressable style={styles.quotaExhaustedBanner} onPress={() => router.push('/paywall' as any)}>
            <Icon name="crown" size={14} color={Colors.amber500} />
            <Text style={styles.quotaExhaustedText}>今日免费次数已用完 · 升级 Pro 无限追问</Text>
            <Icon name="chevronRight" size={14} color={Colors.amber500} />
          </Pressable>
        ) : (
          <View style={styles.composerRow}>
            <TextInput
              style={[styles.composerInput, isBusy && styles.composerInputDisabled]}
              value={composer}
              onChangeText={setComposer}
              placeholder={isBusy ? 'AI 正在回复中…' : '继续追问…'}
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={submitComposer}
              returnKeyType="send"
              editable={!isBusy}
              multiline={false}
            />
            <Pressable
              style={[styles.sendBtn, isBusy && styles.sendBtnDisabled]}
              onPress={submitComposer}
              disabled={isBusy}
            >
              <Icon name="send" size={16} color={isBusy ? Colors.textMuted : '#fff'} />
            </Pressable>
          </View>
        )}
        {!quotaExhausted && (
          <Text style={styles.composerHint}>
            {user.isPro
              ? 'Pro · 无限追问'
              : remaining > 0
                ? `今日剩 ${remaining} 次免费追问`
                : '每次追问消耗 1 Token · 升级 Pro 无限追问'}
          </Text>
        )}
      </View>
      {/* Share bottom sheet */}
      {shareSheet && (
        <Modal
          visible
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShareSheet(null)}
        >
          <Pressable style={styles.sheetOverlay} onPress={() => setShareSheet(null)}>
            <Pressable style={styles.sheetPanel} onPress={() => {}}>
              {/* Handle bar */}
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>分享 AI 解析</Text>

              {/* Web link row */}
              <View style={styles.sheetLinkBox}>
                <Icon name="globe" size={14} color={Colors.teal500} />
                <Text style={styles.sheetLinkText} numberOfLines={1}>{webUrl}</Text>
              </View>

              {/* Actions */}
              <View style={styles.sheetActions}>
                <Pressable
                  style={styles.sheetActionBtn}
                  onPress={() => {
                    Share.share({ message: webUrl, title: 'Kakomon 题目链接' }).catch(() => {});
                  }}
                >
                  <View style={styles.sheetActionIcon}>
                    <Icon name="copy" size={18} color={Colors.teal500} />
                  </View>
                  <Text style={styles.sheetActionLabel}>复制链接</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetActionBtn}
                  onPress={() => {
                    setShareSheet(null);
                    router.push('/forum/compose' as any);
                  }}
                >
                  <View style={styles.sheetActionIcon}>
                    <Icon name="forum" size={18} color={Colors.indigo500} />
                  </View>
                  <Text style={styles.sheetActionLabel}>发布到论坛</Text>
                </Pressable>

                <Pressable
                  style={styles.sheetActionBtn}
                  onPress={() => {
                    const text = shareSheet.sections.map((s) => `【${s.title}】\n${s.body}`).join('\n\n');
                    Share.share({ message: `${text}\n\n${webUrl}`, title: 'Kakomon AI 解析' }).catch(() => {});
                  }}
                >
                  <View style={styles.sheetActionIcon}>
                    <Icon name="share" size={18} color={Colors.blue500} />
                  </View>
                  <Text style={styles.sheetActionLabel}>其他应用</Text>
                </Pressable>
              </View>

              <Pressable style={styles.sheetCancelBtn} onPress={() => setShareSheet(null)}>
                <Text style={styles.sheetCancelText}>取消</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
