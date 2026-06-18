import { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { AdGateModal, Icon } from '@/components/ui';
import { KAKOMON_QUESTIONS, KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, DEMO_USER } from '@/mocks/data';
import { useAuthStore } from '@/store/authStore';
import { useAdStore } from '@/store/adStore';
import { useBrowseSchoolsStore } from '@/store/browseSchoolsStore';
import { canAccessQuestion, schoolLimit } from '@/utils/accessPolicy';
import type { KakomonQuestion } from '@/types/question';

interface ExamPaper {
  universityId: string;
  gradSchool: string;
  uniShort: string;
  year: number;
  questions: KakomonQuestion[];
}

/** 左栏一项 = 一所学校（同校多研究科合并到一行）。 */
interface RailEntry {
  universityId: string;
  grads: string[];
  isTarget: boolean;
}

/** 把存储里的研究科归一到展示用值（缺省回退到该校首个研究科），保证左栏映射与增删改匹配一致。 */
const normGrad = (universityId: string, gradSchool?: string) =>
  gradSchool ?? (UNI_GRADS[universityId]?.[0] ?? '');

type PaperCardProps = {
  paper: ExamPaper;
  unlocked: boolean;
  freeByTarget: boolean;
  viaAd: boolean;
  styles: ReturnType<typeof makeStyles>;
  Colors: ThemeColors;
  onStart: (paper: ExamPaper) => void;
  onLockedPress: (paper: ExamPaper) => void;
};

function PaperCardImpl({ paper, unlocked, freeByTarget, viaAd, styles, Colors, onStart, onLockedPress }: PaperCardProps) {
  const examSubjects = useMemo(
    () => Array.from(new Set(paper.questions.map((q) => q.subject))),
    [paper],
  );
  return (
    <View style={styles.paperCard}>
      <View style={styles.paperTop}>
        <Text style={styles.paperYear}>{paper.year} 年度</Text>
        <Text style={styles.paperMeta}>{paper.questions.length} 道大题</Text>
      </View>
      <View style={styles.subjectRow}>
        {examSubjects.map((s) => (
          <View key={s} style={styles.subjChip}>
            <Text style={styles.subjChipText}>{s}</Text>
          </View>
        ))}
      </View>
      {freeByTarget && (
        <View style={styles.unlockedBadge}>
          <Icon name="check" size={9} color={Colors.green600} />
          <Text style={styles.unlockedText}>目标研究科 · 免费</Text>
        </View>
      )}
      {viaAd && (
        <View style={styles.unlockedBadge}>
          <Icon name="check" size={9} color={Colors.green600} />
          <Text style={styles.unlockedText}>已解锁 · 24h 内</Text>
        </View>
      )}
      {unlocked ? (
        <Pressable style={styles.startBtn} onPress={() => onStart(paper)}>
          <Icon name="clock" size={14} color="#fff" />
          <Text style={styles.startBtnText}>开始模考（{paper.questions.length} 题）</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.lockBtn} onPress={() => onLockedPress(paper)}>
          <Icon name="eye" size={14} color="#fff" />
          <Text style={styles.lockBtnText}>看广告解锁这套（24h）</Text>
        </Pressable>
      )}
    </View>
  );
}

const PaperCard = memo(PaperCardImpl);

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  body: { flex: 1, flexDirection: 'row' },

  // 左栏（按学校合并）
  rail: { width: 68, flexGrow: 0, flexShrink: 0, borderRightWidth: 1, borderRightColor: c.border, backgroundColor: c.surfaceAlt },
  railItem: { position: 'relative', paddingVertical: 10, paddingHorizontal: 2, alignItems: 'center', gap: 3, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  railMore: { position: 'absolute', right: 2, bottom: 6, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  railItemActive: { backgroundColor: c.background, borderLeftColor: c.indigo500 },
  railAvatar: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  railAvatarText: { fontSize: 12, fontWeight: Typography.weightBold, color: '#fff' },
  railName: { fontSize: 10, color: c.textSecondary, fontWeight: Typography.weightMedium, textAlign: 'center' },
  railNameActive: { color: c.textPrimary, fontWeight: Typography.weightBold },
  railGradCount: { fontSize: 8, color: c.textMuted, textAlign: 'center', lineHeight: 10 },
  railAdd: { paddingVertical: 12, alignItems: 'center', gap: 3 },
  railAddIcon: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: c.indigo500, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  railAddText: { fontSize: 9, color: c.indigo500, fontWeight: Typography.weightSemibold },
  railDivider: { height: 1, backgroundColor: c.border, marginVertical: 4, marginHorizontal: 8 },

  // 右侧
  right: { flex: 1 },
  rightScroll: { paddingHorizontal: Spacing.cardPadding, paddingTop: Spacing.cardPadding, paddingBottom: 8, gap: 10 },
  rightTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, marginBottom: 2 },
  rightGrad: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.indigo600, marginBottom: 2 },
  rightSub: { fontSize: Typography.xs, color: c.textMuted, marginBottom: 8 },

  // 面包屑
  crumbRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' },
  crumbLink: { fontSize: Typography.sm, color: c.indigo600, fontWeight: Typography.weightSemibold },
  crumbSep: { fontSize: Typography.sm, color: c.textMuted },
  crumbCur: { fontSize: Typography.sm, color: c.textPrimary, fontWeight: Typography.weightSemibold },

  // 列表通用卡（研究科 / 专业）
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 14 },
  listAccent: { width: 4, height: 20, borderRadius: 2 },
  listMain: { flex: 1, gap: 2 },
  listName: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  listSub: { fontSize: Typography.xs, color: c.textMuted },
  targetTag: { fontSize: 10, color: c.green600, fontWeight: Typography.weightBold, backgroundColor: c.green500 + '22', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, marginLeft: 6 },

  // 试卷卡
  paperCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 8 },
  paperTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paperYear: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  paperMeta: { fontSize: Typography.xs, color: c.textMuted },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subjChip: { backgroundColor: c.surfaceAlt, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  subjChipText: { fontSize: Typography.xs, color: c.textSecondary },

  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.indigo600, borderRadius: 10, paddingVertical: 11 },
  startBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  lockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.amber500, borderRadius: 10, paddingVertical: 11 },
  lockBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: c.green500 + '22', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  unlockedText: { fontSize: 10, color: c.green600, fontWeight: Typography.weightBold },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center' },

  // 「⋮」操作菜单
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  menuCard: { backgroundColor: c.background, borderRadius: 16, paddingVertical: 6, minWidth: 240, borderWidth: 1, borderColor: c.border },
  menuTitle: { fontSize: Typography.xs, color: c.textMuted, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText: { fontSize: Typography.sm, color: c.textPrimary, fontWeight: Typography.weightMedium },
  menuItemDanger: { color: c.rose600 },
  menuSep: { height: 1, backgroundColor: c.border, marginVertical: 2 },

  // Add-school modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: c.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 32 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  modalBack: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: 16, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: Typography.sm, color: c.textPrimary },
  uniRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 11 },
  uniRowAvatar: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  uniRowName: { flex: 1, fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },

  // 研究科选择
  gradRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border },
  gradName: { flex: 1, fontSize: Typography.sm, color: c.textPrimary },
  gradAdded: { fontSize: Typography.xs, color: c.green600, fontWeight: Typography.weightSemibold },
});

export default function MockExamScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const setUser = useAuthStore((s) => s.setUser);
  const authToken = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const unlockSchoolYear = useAdStore((s) => s.unlockSchoolYear);
  useAdStore((s) => s.unlockedSchoolYears); // 订阅，解锁后刷新

  const TARGET_LIMIT = schoolLimit(user);

  const accent500: Record<string, string> = {
    blue: Colors.blue500, teal: Colors.teal500, indigo: Colors.indigo500, amber: Colors.amber500, rose: Colors.rose500,
  };
  const isVip = !!user.isPro;

  const browseRaw = useBrowseSchoolsStore((s) => s.entries);
  const addBrowse = useBrowseSchoolsStore((s) => s.add);
  const removeBrowse = useBrowseSchoolsStore((s) => s.remove);
  const reorderBrowse = useBrowseSchoolsStore((s) => s.reorder);

  /** 左栏按 universityId 合并：一所学校一行，研究科作为该校挂的子集合传入右栏。 */
  const targetUniIds = useMemo(
    () => Array.from(new Set((user.targetSchools ?? [])
      .filter((s) => KAKOMON_UNIVERSITIES.some((u) => u.id === s.universityId))
      .map((s) => s.universityId))),
    [user.targetSchools],
  );
  const browseUniIds = useMemo(
    () => Array.from(new Set(browseRaw.map((e) => e.universityId))),
    [browseRaw],
  );

  const collectGrads = useCallback((universityId: string): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    (user.targetSchools ?? []).forEach((s) => {
      if (s.universityId !== universityId) return;
      const g = normGrad(universityId, s.gradSchool);
      if (g && !seen.has(g)) { seen.add(g); out.push(g); }
    });
    browseRaw.forEach((e) => {
      if (e.universityId !== universityId) return;
      if (e.gradSchool && !seen.has(e.gradSchool)) { seen.add(e.gradSchool); out.push(e.gradSchool); }
    });
    return out;
  }, [user.targetSchools, browseRaw]);

  const railEntries: RailEntry[] = useMemo(() => {
    const seen = new Set<string>();
    const out: RailEntry[] = [];
    targetUniIds.forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ universityId: id, grads: collectGrads(id), isTarget: true });
    });
    browseUniIds.forEach((id) => {
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ universityId: id, grads: collectGrads(id), isTarget: false });
    });
    return out;
  }, [targetUniIds, browseUniIds, collectGrads]);

  const targetEntries = railEntries.filter((e) => e.isTarget);
  const browseEntries = railEntries.filter((e) => !e.isTarget);

  // 学校 → 研究科 → 专业 → 年度模考
  const [activeUniId, setActiveUniId] = useState<string>(targetUniIds[0] ?? '');
  const [activeGrad, setActiveGrad] = useState<string | null>(null);
  const [activeMajor, setActiveMajor] = useState<string | null>(null);

  const activeEntry = railEntries.find((e) => e.universityId === activeUniId);
  const activeUni = activeUniId ? KAKOMON_UNIVERSITIES.find((u) => u.id === activeUniId) : undefined;

  function selectUni(universityId: string) {
    setActiveUniId(universityId);
    setActiveGrad(null);
    setActiveMajor(null);
  }

  /** 当前研究科可选专业：只展示用户在 user.targetSchools 中显式勾过的 majorId（与专题学习一致） */
  const majorOptions = useMemo(() => {
    if (!activeEntry || !activeGrad) return [];
    const all = UNI_MAJORS[`${activeEntry.universityId}::${activeGrad}`] ?? [];
    if (all.length === 0) return [];
    const picked = new Set(
      (user.targetSchools ?? [])
        .filter((s) =>
          s.universityId === activeEntry.universityId &&
          normGrad(activeEntry.universityId, s.gradSchool) === activeGrad &&
          s.majorId,
        )
        .map((s) => s.majorId as string),
    );
    return all.filter((m) => picked.has(m.id));
  }, [activeEntry, activeGrad, user.targetSchools]);

  /** 当前研究科下的题池（不限专业） */
  const gradPool = useMemo(
    () => (activeEntry && activeGrad
      ? KAKOMON_QUESTIONS.filter((q) => q.universityId === activeEntry.universityId && q.graduateSchool === activeGrad)
      : []),
    [activeEntry, activeGrad],
  );

  /** 各专业题量（majorIds 命中即计数；缺省 majorIds 视为该研究科全部专业通用） */
  const majorCounts = useMemo(() => {
    const m = new Map<string, number>();
    majorOptions.forEach((mj) => m.set(mj.id, 0));
    gradPool.forEach((q) => {
      if (!q.majorIds || q.majorIds.length === 0) {
        majorOptions.forEach((mj) => m.set(mj.id, (m.get(mj.id) ?? 0) + 1));
      } else {
        q.majorIds.forEach((id) => {
          if (m.has(id)) m.set(id, (m.get(id) ?? 0) + 1);
        });
      }
    });
    return m;
  }, [majorOptions, gradPool]);

  /** 专业过滤后的题池 */
  const majorPool = useMemo(() => {
    if (!activeMajor) return gradPool;
    return gradPool.filter((q) => !q.majorIds || q.majorIds.length === 0 || q.majorIds.includes(activeMajor));
  }, [gradPool, activeMajor]);

  /** 年度试卷：按 year 聚合（专业过滤后） */
  const papers = useMemo(() => {
    if (!activeEntry || !activeGrad) return [];
    const map = new Map<number, ExamPaper>();
    majorPool.forEach((q) => {
      if (!map.has(q.year)) {
        map.set(q.year, { universityId: q.universityId, gradSchool: q.graduateSchool, uniShort: activeUni?.short ?? '—', year: q.year, questions: [] });
      }
      map.get(q.year)!.questions.push(q);
    });
    return [...map.values()].sort((a, b) => b.year - a.year);
  }, [activeEntry, activeGrad, majorPool, activeUni]);

  function startExam(p: ExamPaper) {
    const ids = p.questions.map((q) => q.id).join(',');
    router.push(`/exam-session?title=${encodeURIComponent(`${p.uniShort} ${p.year} 模考`)}&universityId=${p.universityId}&mode=mock&ids=${ids}` as any);
  }

  const handleStart = useCallback((p: ExamPaper) => startExam(p), []);

  function onPaperPress(p: ExamPaper) {
    if (canAccessQuestion(user, { universityId: p.universityId, gradSchool: p.gradSchool, year: p.year }).allowed) {
      startExam(p);
    } else {
      setGate(p);
    }
  }

  const handleLockedPress = useCallback((p: ExamPaper) => onPaperPress(p), [user]);

  // 添加流程
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'target' | 'browse'>('browse');
  const [addStep, setAddStep] = useState<'school' | 'grad'>('school');
  const [pendingUni, setPendingUni] = useState<string | null>(null);
  const [addQuery, setAddQuery] = useState('');
  const [gate, setGate] = useState<ExamPaper | null>(null);
  const [menuFor, setMenuFor] = useState<RailEntry | null>(null);

  function openAdd(mode: 'target' | 'browse') {
    setAddMode(mode); setAddStep('school'); setPendingUni(null); setAddQuery(''); setAddOpen(true);
  }

  function pickGrad(grad: string) {
    if (!pendingUni) return;
    if (addMode === 'target') addTargetSchool(pendingUni, grad);
    else addBrowse({ universityId: pendingUni, gradSchool: grad });
    setActiveUniId(pendingUni);
    setActiveGrad(grad);
    setActiveMajor(null);
    setAddOpen(false);
  }

  function addTargetSchool(universityId: string, grad: string) {
    const schools = user.targetSchools ?? [];
    if (schools.some((s) => s.universityId === universityId && normGrad(s.universityId, s.gradSchool) === grad)) return;
    const firstType = schools[0]?.type ?? 'daigakuin';
    const next = [
      ...schools,
      { universityId, type: firstType, gradSchool: grad, subjects: [], priority: schools.length + 1 },
    ];
    setUser({ ...user, targetSchools: next }, authToken, refreshToken);
  }

  function persistTargets(next: typeof user.targetSchools) {
    setUser({ ...user, targetSchools: next.map((s, i) => ({ ...s, priority: i + 1 })) }, authToken, refreshToken);
  }

  /** 学校级移动：把同 universityId 的所有 target 条目作为一组移动 */
  function moveEntry(entry: RailEntry, action: 'top' | 'up' | 'down') {
    if (entry.isTarget) {
      const arr = [...(user.targetSchools ?? [])];
      const groups: { uniId: string; items: typeof arr }[] = [];
      arr.forEach((s) => {
        const g = groups.find((x) => x.uniId === s.universityId);
        if (g) g.items.push(s); else groups.push({ uniId: s.universityId, items: [s] });
      });
      const idx = groups.findIndex((g) => g.uniId === entry.universityId);
      if (idx >= 0) {
        const [item] = groups.splice(idx, 1);
        const to = action === 'top' ? 0 : action === 'up' ? Math.max(0, idx - 1) : Math.min(groups.length, idx + 1);
        groups.splice(to, 0, item);
        persistTargets(groups.flatMap((g) => g.items));
      }
    } else {
      const arr = [...browseRaw];
      const groups: { uniId: string; items: typeof arr }[] = [];
      arr.forEach((e) => {
        const g = groups.find((x) => x.uniId === e.universityId);
        if (g) g.items.push(e); else groups.push({ uniId: e.universityId, items: [e] });
      });
      const idx = groups.findIndex((g) => g.uniId === entry.universityId);
      if (idx >= 0) {
        const [item] = groups.splice(idx, 1);
        const to = action === 'top' ? 0 : action === 'up' ? Math.max(0, idx - 1) : Math.min(groups.length, idx + 1);
        groups.splice(to, 0, item);
        reorderBrowse(groups.flatMap((g) => g.items));
      }
    }
    setMenuFor(null);
  }

  /** 学校级删除：把该校所有研究科条目都删掉 */
  function deleteEntry(entry: RailEntry) {
    const u = KAKOMON_UNIVERSITIES.find((x) => x.id === entry.universityId);
    const clearActive = () => {
      if (entry.universityId === activeUniId) {
        setActiveUniId('');
        setActiveGrad(null); setActiveMajor(null);
      }
      setMenuFor(null);
    };
    if (entry.isTarget) {
      Alert.alert(
        `移除 ${u?.short ?? '该校'}`,
        '该校是备考目标校，删除后将同步从「目标校」中移除（含其下全部研究科）。确定吗？',
        [
          { text: '取消', style: 'cancel' },
          { text: '删除并同步', style: 'destructive', onPress: () => {
            persistTargets((user.targetSchools ?? []).filter((s) => s.universityId !== entry.universityId));
            browseRaw.filter((e) => e.universityId === entry.universityId).forEach((e) => removeBrowse(e));
            clearActive();
          } },
        ],
      );
    } else {
      browseRaw.filter((e) => e.universityId === entry.universityId).forEach((e) => removeBrowse(e));
      clearActive();
    }
  }

  const addCandidates = KAKOMON_UNIVERSITIES.filter((u) => {
    const kw = addQuery.trim().toLowerCase();
    if (!kw) return true;
    return u.short.toLowerCase().includes(kw) || u.nameCn.includes(addQuery) || u.nameJp.includes(addQuery) || u.nameEn.toLowerCase().includes(kw);
  });

  const pendingUniObj = pendingUni ? KAKOMON_UNIVERSITIES.find((u) => u.id === pendingUni) : null;
  const pendingGrads = pendingUni ? (UNI_GRADS[pendingUni] ?? []) : [];

  function renderRailItem(e: RailEntry) {
    const u = KAKOMON_UNIVERSITIES.find((x) => x.id === e.universityId);
    if (!u) return null;
    const active = activeUniId === e.universityId;
    const bg = accent500[u.accent] ?? Colors.indigo500;
    return (
      <Pressable key={e.universityId} style={[styles.railItem, active && styles.railItemActive]} onPress={() => selectUni(e.universityId)}>
        <View style={[styles.railAvatar, { backgroundColor: bg }]}>
          <Text style={styles.railAvatarText}>{u.short.slice(0, 1)}</Text>
        </View>
        <Text style={[styles.railName, active && styles.railNameActive]} numberOfLines={1}>{u.short}</Text>
        <Text style={styles.railGradCount} numberOfLines={1}>{e.grads.length} 研究科</Text>
        <Pressable style={styles.railMore} hitSlop={6} onPress={() => setMenuFor(e)}>
          <Icon name="more" size={13} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
    );
  }

  const activeGradIsTarget = !!(activeGrad && (user.targetSchools ?? []).some((s) =>
    s.universityId === activeUniId && normGrad(activeUniId, s.gradSchool) === activeGrad,
  ));

  // 当前展示层：paper（年度模考） | major | grad | empty
  const layer: 'paper' | 'major' | 'grad' | 'empty' =
    !activeEntry ? 'empty'
      : !activeGrad ? 'grad'
        : majorOptions.length > 0 && !activeMajor ? 'major'
          : 'paper';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>模拟考试</Text>
          <Text style={styles.headerSub}>学校 → 研究科 → 专业 → 年度整卷模考</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* 左栏 */}
        <ScrollView style={styles.rail} showsVerticalScrollIndicator={false}>
          {targetEntries.map((e) => renderRailItem(e))}
          {targetUniIds.length < TARGET_LIMIT && (
            <Pressable style={styles.railAdd} onPress={() => openAdd('target')}>
              <View style={styles.railAddIcon}><Icon name="plus" size={16} color={Colors.indigo500} /></View>
              <Text style={styles.railAddText}>目标校</Text>
            </Pressable>
          )}
          <View style={styles.railDivider} />
          {browseEntries.map((e) => renderRailItem(e))}
          <Pressable style={styles.railAdd} onPress={() => openAdd('browse')}>
            <View style={[styles.railAddIcon, { borderColor: Colors.textMuted }]}><Icon name="plus" size={16} color={Colors.textMuted} /></View>
            <Text style={[styles.railAddText, { color: Colors.textMuted }]}>浏览</Text>
          </Pressable>
        </ScrollView>

        {/* 右侧 */}
        <View style={styles.right}>
          {layer === 'empty' ? (
            <View style={styles.empty}>
              <Icon name="plus" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyText}>点击左侧「添加」选择学校与研究科</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.rightScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.rightTitle}>{activeUni?.nameCn}</Text>
              {activeGrad && (
                <Text style={styles.rightGrad} numberOfLines={2}>
                  {activeGrad}
                  {activeMajor && majorOptions.find((m) => m.id === activeMajor)
                    ? ` · ${majorOptions.find((m) => m.id === activeMajor)!.label}`
                    : ''}
                </Text>
              )}
              <Text style={styles.rightSub}>
                {activeUni?.nameJp}
                {layer === 'grad'
                  ? ` · 共 ${activeEntry?.grads.length ?? 0} 个研究科`
                  : ' · ' + (activeGradIsTarget ? '目标研究科' : '浏览研究科') + (isVip ? ' · Pro 已解锁全部' : activeGradIsTarget ? ' · 近 3 年免费' : ' · 每套看广告解锁 24h')}
              </Text>

              {/* 面包屑 */}
              {layer !== 'grad' && (
                <View style={styles.crumbRow}>
                  <Pressable onPress={() => { setActiveGrad(null); setActiveMajor(null); }}>
                    <Text style={styles.crumbLink}>研究科</Text>
                  </Pressable>
                  <Text style={styles.crumbSep}>/</Text>
                  {layer === 'paper' && majorOptions.length > 0 ? (
                    <>
                      <Pressable onPress={() => setActiveMajor(null)}>
                        <Text style={styles.crumbLink}>专业</Text>
                      </Pressable>
                      <Text style={styles.crumbSep}>/</Text>
                      <Text style={styles.crumbCur}>年度卷</Text>
                    </>
                  ) : (
                    <Text style={styles.crumbCur}>{layer === 'major' ? '专业' : '年度卷'}</Text>
                  )}
                </View>
              )}

              {layer === 'grad' && (
                (activeEntry?.grads.length ?? 0) === 0 ? (
                  <View style={styles.empty}>
                    <Icon name="layers" size={28} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>该校暂无添加研究科</Text>
                  </View>
                ) : (
                  (activeEntry!.grads).map((g, i) => {
                    const yearCount = new Set(KAKOMON_QUESTIONS
                      .filter((q) => q.universityId === activeEntry!.universityId && q.graduateSchool === g)
                      .map((q) => q.year)).size;
                    const isTargetGrad = (user.targetSchools ?? []).some((s) =>
                      s.universityId === activeEntry!.universityId && normGrad(activeEntry!.universityId, s.gradSchool) === g);
                    const pickedMajors = (user.targetSchools ?? []).filter((s) =>
                      s.universityId === activeEntry!.universityId &&
                      normGrad(activeEntry!.universityId, s.gradSchool) === g &&
                      s.majorId,
                    ).length;
                    return (
                      <Pressable key={g} style={styles.listRow} onPress={() => { setActiveGrad(g); setActiveMajor(null); }}>
                        <View style={[styles.listAccent, { backgroundColor: [Colors.indigo500, Colors.blue500, Colors.teal500, Colors.amber500, Colors.rose500][i % 5] }]} />
                        <View style={styles.listMain}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.listName}>{g}</Text>
                            {isTargetGrad && <Text style={styles.targetTag}>目标</Text>}
                          </View>
                          <Text style={styles.listSub}>{pickedMajors > 0 ? `${pickedMajors} 个目标专业 · ` : ''}{yearCount} 套年度卷</Text>
                        </View>
                        <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                      </Pressable>
                    );
                  })
                )
              )}

              {layer === 'major' && (
                majorOptions.map((mj, i) => {
                  const count = majorCounts.get(mj.id) ?? 0;
                  const yearCount = new Set(
                    gradPool
                      .filter((q) => !q.majorIds || q.majorIds.length === 0 || q.majorIds.includes(mj.id))
                      .map((q) => q.year),
                  ).size;
                  return (
                    <Pressable
                      key={mj.id}
                      style={styles.listRow}
                      onPress={() => setActiveMajor(mj.id)}
                    >
                      <View style={[styles.listAccent, { backgroundColor: [Colors.indigo500, Colors.blue500, Colors.teal500, Colors.amber500, Colors.rose500][i % 5] }]} />
                      <View style={styles.listMain}>
                        <Text style={styles.listName}>{mj.label} <Text style={{ color: Colors.textMuted, fontWeight: Typography.weightMedium }}>· {mj.short}</Text></Text>
                        <Text style={styles.listSub}>{mj.desc || '—'} · {yearCount} 套年度卷 · {count} 题</Text>
                      </View>
                      <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                    </Pressable>
                  );
                })
              )}

              {layer === 'paper' && (
                papers.length === 0 ? (
                  <View style={styles.empty}>
                    <Icon name="clock" size={28} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>该范围暂无整套真题</Text>
                  </View>
                ) : (
                  papers.map((p) => {
                    const access = canAccessQuestion(user, { universityId: p.universityId, gradSchool: p.gradSchool, year: p.year });
                    const unlocked = access.allowed;
                    const freeByTarget = unlocked && !access.viaVip && !access.viaAd;
                    return (
                      <PaperCard
                        key={p.year}
                        paper={p}
                        unlocked={unlocked}
                        freeByTarget={freeByTarget}
                        viaAd={!!access.viaAd}
                        styles={styles}
                        Colors={Colors}
                        onStart={handleStart}
                        onLockedPress={handleLockedPress}
                      />
                    );
                  })
                )
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </View>

      {/* 添加：选学校 → 选研究科 */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              {addStep === 'grad' && (
                <Pressable style={styles.modalBack} onPress={() => setAddStep('school')}>
                  <Icon name="chevronLeft" size={18} color={Colors.textPrimary} />
                </Pressable>
              )}
              <Text style={styles.modalTitle}>
                {addStep === 'school'
                  ? (addMode === 'target' ? '添加目标校 · 选择学校' : '浏览学校 · 选择学校')
                  : `${pendingUniObj?.short} · 选择研究科`}
              </Text>
              <Pressable onPress={() => setAddOpen(false)}>
                <Icon name="close" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            {addStep === 'school' ? (
              <>
                <View style={styles.searchBar}>
                  <Icon name="search" size={15} color={Colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    value={addQuery}
                    onChangeText={setAddQuery}
                    placeholder="搜索学校名"
                    placeholderTextColor={Colors.textMuted}
                    autoCorrect={false}
                  />
                </View>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {addCandidates.map((u) => {
                    const bg = accent500[u.accent] ?? Colors.indigo500;
                    return (
                      <Pressable
                        key={u.id}
                        style={styles.uniRow}
                        onPress={() => { setPendingUni(u.id); setAddStep('grad'); }}
                      >
                        <View style={[styles.uniRowAvatar, { backgroundColor: bg }]}>
                          <Text style={styles.railAvatarText}>{u.short.slice(0, 1)}</Text>
                        </View>
                        <Text style={styles.uniRowName}>{u.short} · {u.nameJp}</Text>
                        <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                      </Pressable>
                    );
                  })}
                  <View style={{ height: 32 }} />
                </ScrollView>
              </>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {pendingGrads.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>该校研究科信息整理中</Text>
                  </View>
                ) : (
                  pendingGrads.map((g) => {
                    const added = !!pendingUni && (
                      (user.targetSchools ?? []).some((s) => s.universityId === pendingUni && normGrad(pendingUni, s.gradSchool) === g) ||
                      browseRaw.some((e) => e.universityId === pendingUni && e.gradSchool === g)
                    );
                    return (
                      <Pressable key={g} style={styles.gradRow} onPress={() => pickGrad(g)}>
                        <Text style={styles.gradName}>{g}</Text>
                        {added ? (
                          <Text style={styles.gradAdded}>已添加</Text>
                        ) : (
                          <Icon name="plus" size={16} color={Colors.indigo500} />
                        )}
                      </Pressable>
                    );
                  })
                )}
                <View style={{ height: 32 }} />
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 「⋮」操作菜单：学校级 */}
      <Modal visible={!!menuFor} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuFor(null)}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            {menuFor && (() => {
              const group = menuFor.isTarget ? targetEntries : browseEntries;
              const idx = group.findIndex((e) => e.universityId === menuFor.universityId);
              const u = KAKOMON_UNIVERSITIES.find((x) => x.id === menuFor.universityId);
              return (
                <>
                  <Text style={styles.menuTitle}>
                    {u?.short} · {menuFor.grads.length} 个研究科（{menuFor.isTarget ? '目标校' : '浏览校'}）
                  </Text>
                  <Pressable style={styles.menuItem} disabled={idx <= 0} onPress={() => moveEntry(menuFor, 'top')}>
                    <Icon name="chevronUp" size={15} color={idx <= 0 ? Colors.textMuted : Colors.textPrimary} />
                    <Text style={[styles.menuItemText, idx <= 0 && { color: Colors.textMuted }]}>置顶</Text>
                  </Pressable>
                  <Pressable style={styles.menuItem} disabled={idx <= 0} onPress={() => moveEntry(menuFor, 'up')}>
                    <Icon name="chevronUp" size={15} color={idx <= 0 ? Colors.textMuted : Colors.textPrimary} />
                    <Text style={[styles.menuItemText, idx <= 0 && { color: Colors.textMuted }]}>上移</Text>
                  </Pressable>
                  <Pressable style={styles.menuItem} disabled={idx >= group.length - 1} onPress={() => moveEntry(menuFor, 'down')}>
                    <Icon name="chevronDown" size={15} color={idx >= group.length - 1 ? Colors.textMuted : Colors.textPrimary} />
                    <Text style={[styles.menuItemText, idx >= group.length - 1 && { color: Colors.textMuted }]}>下移</Text>
                  </Pressable>
                  <View style={styles.menuSep} />
                  <Pressable style={styles.menuItem} onPress={() => deleteEntry(menuFor)}>
                    <Icon name="close" size={15} color={Colors.rose600} />
                    <Text style={[styles.menuItemText, styles.menuItemDanger]}>删除该校全部研究科</Text>
                  </Pressable>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 广告解锁（校×年 24h） */}
      {gate && (
        <AdGateModal
          open={!!gate}
          onClose={() => setGate(null)}
          title={`解锁 ${gate.uniShort} ${gate.year} 模考`}
          desc={`看广告解锁 ${gate.uniShort} ${gate.year} 年整套真题 · 24 小时内可反复模考`}
          onUnlock={() => {
            unlockSchoolYear(gate.universityId, gate.year);
            startExam(gate);
          }}
          onUpgrade={() => router.push('/paywall' as any)}
        />
      )}
    </SafeAreaView>
  );
}
