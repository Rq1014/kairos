import { useMemo, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { getPapers } from '@/api/papers';
import { getUniversities } from '@/api/universities';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { DEMO_USER } from '@/mocks/data';
import { dictGradName, dictGrads, dictMajors, useDictStore } from '@/store/dictStore';
import { useAuthStore } from '@/store/authStore';
import { useBrowseSchoolsStore } from '@/store/browseSchoolsStore';
import { schoolLimit } from '@/utils/accessPolicy';
import type { ExamPaper } from '@/types/question';

/**
 * 左栏一项 = 学校 + 研究科 + 专业（平铺）。
 */
interface RailEntry {
  key: string;
  universityId: string;
  gradSchool: string;
  majorId: string | null;
  majorLabel: string | null;
  isTarget: boolean;
}

interface YearGroup {
  year: number;
  subjects: { code: string; name: string }[];
}

const normGrad = (universityId: string, gradSchool?: string) =>
  gradSchool ?? (dictGrads(universityId)[0] ?? '');

function gradShort(universityId: string, code: string): string {
  if (!code) return '—';
  const name = dictGradName(universityId, code);
  const core = name.replace(/(研究科|学府|学院|研究院)$/u, '');
  return core.length > 5 ? core.slice(0, 5) : core || name;
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  headerSub: { fontSize: Typography.xs, color: c.textMuted, marginTop: 1 },

  body: { flex: 1, flexDirection: 'row' },

  // 左栏
  rail: { width: 76, flexGrow: 0, flexShrink: 0, borderRightWidth: 1, borderRightColor: c.border, backgroundColor: c.surfaceAlt },
  railItem: { position: 'relative', paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', gap: 2, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  railItemActive: { backgroundColor: c.background, borderLeftColor: c.indigo500 },
  railAvatar: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  railAvatarText: { fontSize: 11, fontWeight: Typography.weightBold, color: '#fff' },
  railName: { fontSize: 9, color: c.textSecondary, fontWeight: Typography.weightMedium, textAlign: 'center' },
  railNameActive: { color: c.textPrimary, fontWeight: Typography.weightBold },
  railSub: { fontSize: 8, color: c.textMuted, textAlign: 'center', lineHeight: 10 },
  railMore: { position: 'absolute', right: 1, top: 4, width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  railAdd: { paddingVertical: 10, alignItems: 'center', gap: 3 },
  railAddIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: c.indigo500, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  railAddText: { fontSize: 9, color: c.indigo500, fontWeight: Typography.weightSemibold },
  railDivider: { height: 1, backgroundColor: c.border, marginVertical: 4, marginHorizontal: 8 },

  // 右侧
  right: { flex: 1 },
  rightScroll: { paddingHorizontal: Spacing.cardPadding, paddingTop: Spacing.cardPadding, paddingBottom: 8 },
  rightTitle: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, marginBottom: 2 },
  rightGrad: { fontSize: Typography.sm, color: c.indigo600, fontWeight: Typography.weightSemibold, marginBottom: 2 },
  rightSub: { fontSize: Typography.xs, color: c.textMuted, marginBottom: 12 },

  // 年度试卷卡
  paperCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, gap: 10, marginBottom: 10 },
  paperTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paperYear: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary },
  paperMeta: { fontSize: Typography.xs, color: c.textMuted },

  // 科目下拉
  subjectDropdown: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, alignSelf: 'flex-start' },
  subjectDropdownText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  subjectMenu: { backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.border, marginTop: 6, overflow: 'hidden' },
  subjectMenuItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  subjectMenuItemActive: { backgroundColor: c.indigo500 + '11' },
  subjectMenuItemLast: { borderBottomWidth: 0 },
  subjectMenuItemText: { fontSize: Typography.sm, color: c.textPrimary },
  subjectMenuItemTextActive: { color: c.indigo600, fontWeight: Typography.weightBold },
  questionCount: { fontSize: Typography.xs, color: c.textMuted, marginTop: 4 },

  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.indigo600, borderRadius: 10, paddingVertical: 11, marginTop: 4 },
  startBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  lockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.amber500, borderRadius: 10, paddingVertical: 11, marginTop: 4 },
  lockBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: c.green500 + '22', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  unlockedText: { fontSize: 10, color: c.green600, fontWeight: Typography.weightBold },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center' },

  // 菜单
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  menuCard: { backgroundColor: c.background, borderRadius: 16, paddingVertical: 6, minWidth: 240, borderWidth: 1, borderColor: c.border },
  menuTitle: { fontSize: Typography.xs, color: c.textMuted, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText: { fontSize: Typography.sm, color: c.textPrimary, fontWeight: Typography.weightMedium },
  menuItemDanger: { color: c.rose600 },
  menuSep: { height: 1, backgroundColor: c.border, marginVertical: 2 },

  // 添加 sheet
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
  gradRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border },
  gradName: { flex: 1, fontSize: Typography.sm, color: c.textPrimary },
  gradAdded: { fontSize: Typography.xs, color: c.green600, fontWeight: Typography.weightSemibold },
});

export default function MockExamScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const router = useRouter();
  // 订阅字典版本：dictStore 联网刷新后触发本页重渲，dictGrads/dictGradName/dictMajors 取到新值。
  useDictStore((s) => s.version);
  const user = useAuthStore((s) => s.user) ?? DEMO_USER;
  const setUser = useAuthStore((s) => s.setUser);
  const authToken = useAuthStore((s) => s.token) ?? '';
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const TARGET_LIMIT = schoolLimit(user);
  const accent500: Record<string, string> = {
    blue: Colors.blue500, teal: Colors.teal500, indigo: Colors.indigo500, amber: Colors.amber500, rose: Colors.rose500,
  };

  const browseRaw = useBrowseSchoolsStore((s) => s.entries);
  const addBrowse = useBrowseSchoolsStore((s) => s.add);
  const removeBrowse = useBrowseSchoolsStore((s) => s.remove);
  const reorderBrowse = useBrowseSchoolsStore((s) => s.reorder);

  // 构建左栏：每个条目 = 学校+研究科+专业
  // 构建左栏：每个条目 = 学校+研究科+专业。轻量列表，无需 memo；
  // 顶层 version 订阅已保证字典刷新时重渲，targetSchools/browseRaw 变化随重渲反映。
  const railEntries: RailEntry[] = (() => {
    const out: RailEntry[] = [];
    (user.targetSchools ?? []).forEach((s) => {
      const grad = normGrad(s.universityId, s.gradSchool);
      const majors = dictMajors(s.universityId, grad);
      const mj = s.majorId ? majors.find((m) => m.id === s.majorId) : null;
      out.push({
        key: `${s.universityId}::${grad}::${s.majorId ?? ''}`,
        universityId: s.universityId,
        gradSchool: grad,
        majorId: s.majorId ?? null,
        majorLabel: mj?.label ?? null,
        isTarget: true,
      });
    });
    browseRaw.forEach((e) => {
      const grad = e.gradSchool ?? (dictGrads(e.universityId)[0] ?? '');
      const key = `${e.universityId}::${grad}::`;
      if (out.some((r) => r.key === key)) return;
      out.push({
        key,
        universityId: e.universityId,
        gradSchool: grad,
        majorId: null,
        majorLabel: null,
        isTarget: false,
      });
    });
    return out;
  })();

  const targetEntries = railEntries.filter((e) => e.isTarget);
  const browseEntries = railEntries.filter((e) => !e.isTarget);

  const [activeKey, setActiveKey] = useState<string>(railEntries[0]?.key ?? '');
  const [yearDropdownOpen, setYearDropdownOpen] = useState<number | null>(null);

  const activeEntry = railEntries.find((e) => e.key === activeKey);

  const universitiesQuery = useQuery({
    queryKey: ['universities', 'all'],
    queryFn: () => getUniversities({ page: 1, pageSize: 100 }),
  });
  const universities = universitiesQuery.data?.items ?? [];

  const activeUni = activeEntry ? universities.find((u) => u.id === activeEntry.universityId) : undefined;

  function selectEntry(key: string) {
    setActiveKey(key);
    setYearDropdownOpen(null);
  }

  const papersQuery = useQuery({
    queryKey: ['papers', activeEntry?.universityId ?? '', activeEntry?.gradSchool ?? '', activeEntry?.majorId ?? ''],
    queryFn: () => getPapers({ universityId: activeEntry!.universityId, graduateSchool: activeEntry!.gradSchool, majorId: activeEntry!.majorId ?? undefined }),
    enabled: !!activeEntry,
  });
  const papersForEntry: ExamPaper[] = papersQuery.data ?? [];

  const yearGroups: YearGroup[] = useMemo(() => {
    const byYear = new Map<number, Map<string, string>>();
    papersForEntry.forEach((p) => {
      if (!byYear.has(p.year)) byYear.set(p.year, new Map());
      const sm = byYear.get(p.year)!;
      if (!sm.has(p.subjectCode)) sm.set(p.subjectCode, p.subject);
    });
    return [...byYear.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, sm]) => ({ year, subjects: [...sm.entries()].map(([code, name]) => ({ code, name })) }));
  }, [papersForEntry]);

  // 添加流程
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'target' | 'browse'>('browse');
  const [addStep, setAddStep] = useState<'school' | 'grad'>('school');
  const [pendingUni, setPendingUni] = useState<string | null>(null);
  const [addQuery, setAddQuery] = useState('');
  const [menuFor, setMenuFor] = useState<RailEntry | null>(null);

  function openAdd(mode: 'target' | 'browse') {
    setAddMode(mode); setAddStep('school'); setPendingUni(null); setAddQuery(''); setAddOpen(true);
  }

  function pickGrad(grad: string) {
    if (!pendingUni) return;
    if (addMode === 'target') {
      const schools = user.targetSchools ?? [];
      if (!schools.some((s) => s.universityId === pendingUni && normGrad(s.universityId, s.gradSchool) === grad)) {
        const firstType = schools[0]?.type ?? 'daigakuin';
        setUser({ ...user, targetSchools: [...schools, { universityId: pendingUni, type: firstType, gradSchool: grad, subjects: [], priority: schools.length + 1 }] }, authToken, refreshToken);
      }
    } else {
      addBrowse({ universityId: pendingUni, gradSchool: grad });
    }
    const newKey = `${pendingUni}::${grad}::`;
    setActiveKey(newKey);
    setYearDropdownOpen(null);
    setAddOpen(false);
  }

  function deleteEntry(entry: RailEntry) {
    const u = universities.find((x) => x.id === entry.universityId);
    const clearActive = () => {
      if (entry.key === activeKey) { setActiveKey(''); setYearDropdownOpen(null); }
      setMenuFor(null);
    };
    if (entry.isTarget) {
      Alert.alert('移除', `确定移除 ${u?.short ?? ''} ${gradShort(entry.universityId, entry.gradSchool)}${entry.majorLabel ? ' · ' + entry.majorLabel : ''}？`, [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => {
          const next = (user.targetSchools ?? []).filter((s) => {
            const g = normGrad(s.universityId, s.gradSchool);
            return !(s.universityId === entry.universityId && g === entry.gradSchool && (s.majorId ?? '') === (entry.majorId ?? ''));
          });
          setUser({ ...user, targetSchools: next.map((s, i) => ({ ...s, priority: i + 1 })) }, authToken, refreshToken);
          clearActive();
        }},
      ]);
    } else {
      browseRaw.filter((e) => e.universityId === entry.universityId && (e.gradSchool ?? '') === entry.gradSchool).forEach((e) => removeBrowse(e));
      clearActive();
    }
  }

  function moveEntry(entry: RailEntry, action: 'up' | 'down') {
    if (entry.isTarget) {
      const arr = [...(user.targetSchools ?? [])];
      const idx = arr.findIndex((s) => {
        const g = normGrad(s.universityId, s.gradSchool);
        return s.universityId === entry.universityId && g === entry.gradSchool && (s.majorId ?? '') === (entry.majorId ?? '');
      });
      if (idx < 0) return;
      const to = action === 'up' ? Math.max(0, idx - 1) : Math.min(arr.length - 1, idx + 1);
      const [item] = arr.splice(idx, 1);
      arr.splice(to, 0, item);
      setUser({ ...user, targetSchools: arr.map((s, i) => ({ ...s, priority: i + 1 })) }, authToken, refreshToken);
    } else {
      const arr = [...browseRaw];
      const idx = arr.findIndex((e) => e.universityId === entry.universityId && (e.gradSchool ?? '') === entry.gradSchool);
      if (idx < 0) return;
      const to = action === 'up' ? Math.max(0, idx - 1) : Math.min(arr.length - 1, idx + 1);
      const [item] = arr.splice(idx, 1);
      arr.splice(to, 0, item);
      reorderBrowse(arr);
    }
    setMenuFor(null);
  }

  const addCandidates = universities.filter((u) => {
    const kw = addQuery.trim().toLowerCase();
    if (!kw) return true;
    return u.short.toLowerCase().includes(kw) || u.nameCn.includes(addQuery) || u.nameJp.includes(addQuery) || u.nameEn.toLowerCase().includes(kw);
  });
  const pendingUniObj = pendingUni ? universities.find((u) => u.id === pendingUni) : null;
  const pendingGrads = pendingUni ? dictGrads(pendingUni) : [];

  function renderRailItem(e: RailEntry) {
    const u = universities.find((x) => x.id === e.universityId);
    if (!u) return null;
    const active = activeKey === e.key;
    const bg = accent500[u.accent] ?? Colors.indigo500;
    return (
      <Pressable key={e.key} style={[styles.railItem, active && styles.railItemActive]} onPress={() => selectEntry(e.key)}>
        <View style={[styles.railAvatar, { backgroundColor: bg }]}>
          <Text style={styles.railAvatarText}>{u.short.slice(0, 1)}</Text>
        </View>
        <Text style={[styles.railName, active && styles.railNameActive]} numberOfLines={1}>{u.short}</Text>
        <Text style={styles.railSub} numberOfLines={1}>{gradShort(e.universityId, e.gradSchool)}</Text>
        {e.majorLabel && <Text style={styles.railSub} numberOfLines={1}>{e.majorLabel}</Text>}
        <Pressable style={styles.railMore} hitSlop={6} onPress={() => setMenuFor(e)}>
          <Icon name="more" size={11} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>模拟考试</Text>
          <Text style={styles.headerSub}>选择目标 → 年份 → 科目 → 开始</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* 左栏 */}
        <ScrollView style={styles.rail} showsVerticalScrollIndicator={false}>
          {targetEntries.map((e) => renderRailItem(e))}
          {targetEntries.length < TARGET_LIMIT && (
            <Pressable style={styles.railAdd} onPress={() => openAdd('target')}>
              <View style={styles.railAddIcon}><Icon name="plus" size={14} color={Colors.indigo500} /></View>
              <Text style={styles.railAddText}>目标</Text>
            </Pressable>
          )}
          {browseEntries.length > 0 && <View style={styles.railDivider} />}
          {browseEntries.map((e) => renderRailItem(e))}
          <Pressable style={styles.railAdd} onPress={() => openAdd('browse')}>
            <View style={[styles.railAddIcon, { borderColor: Colors.textMuted }]}><Icon name="plus" size={14} color={Colors.textMuted} /></View>
            <Text style={[styles.railAddText, { color: Colors.textMuted }]}>浏览</Text>
          </Pressable>
        </ScrollView>

        {/* 右侧 */}
        <View style={styles.right}>
          {!activeEntry ? (
            <View style={styles.empty}>
              <Icon name="clock" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyText}>点击左侧选择目标开始模考</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.rightScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.rightTitle}>{activeUni?.nameCn}</Text>
              <Text style={styles.rightGrad}>
                {dictGradName(activeEntry.universityId, activeEntry.gradSchool)}{activeEntry.majorLabel ? ` · ${activeEntry.majorLabel}` : ''}
              </Text>
              <Text style={styles.rightSub}>{yearGroups.length} 个年度</Text>

              {papersQuery.isLoading ? (
                <View style={styles.empty}><Text style={styles.emptyText}>加载中…</Text></View>
              ) : papersQuery.isError ? (
                <View style={styles.empty}>
                  <Icon name="clock" size={28} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>试卷加载失败，请重试</Text>
                </View>
              ) : yearGroups.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="clock" size={28} color={Colors.textMuted} />
                  <Text style={styles.emptyText}>该范围暂无试卷</Text>
                </View>
              ) : (
                yearGroups.map((yg) => {
                  const isOpen = yearDropdownOpen === yg.year;
                  return (
                    <View key={yg.year} style={styles.paperCard}>
                      <View style={styles.paperTop}>
                        <Text style={styles.paperYear}>{yg.year} 年度</Text>
                        <Text style={styles.paperMeta}>{yg.subjects.length} 个科目</Text>
                      </View>
                      <Pressable style={styles.subjectDropdown} onPress={() => setYearDropdownOpen(isOpen ? null : yg.year)}>
                        <Text style={styles.subjectDropdownText}>选择科目</Text>
                        <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={13} color={Colors.textPrimary} />
                      </Pressable>
                      {isOpen && (
                        <View style={styles.subjectMenu}>
                          {yg.subjects.map((subj, i) => (
                            <Pressable
                              key={subj.code}
                              style={[styles.subjectMenuItem, i === yg.subjects.length - 1 && styles.subjectMenuItemLast]}
                              onPress={() => {
                                if (!activeEntry) return;
                                router.push(`/exam-papers?universityId=${activeEntry.universityId}&graduateSchool=${encodeURIComponent(activeEntry.gradSchool)}&majorId=${activeEntry.majorId ?? ''}&year=${yg.year}&subjectCode=${encodeURIComponent(subj.code)}&subjectName=${encodeURIComponent(subj.name)}` as any);
                              }}
                            >
                              <Text style={styles.subjectMenuItemText}>{subj.name}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </View>

      {/* 「⋮」菜单 */}
      <Modal visible={!!menuFor} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuFor(null)}>
          <Pressable style={styles.menuCard} onPress={() => {}}>
            {menuFor && (() => {
              const group = menuFor.isTarget ? targetEntries : browseEntries;
              const idx = group.findIndex((e) => e.key === menuFor.key);
              const u = universities.find((x) => x.id === menuFor.universityId);
              return (
                <>
                  <Text style={styles.menuTitle}>
                    {u?.short} · {gradShort(menuFor.universityId, menuFor.gradSchool)}{menuFor.majorLabel ? ` · ${menuFor.majorLabel}` : ''}
                  </Text>
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
                    <Text style={[styles.menuItemText, styles.menuItemDanger]}>删除</Text>
                  </Pressable>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

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
                  ? (addMode === 'target' ? '添加目标 · 选择学校' : '浏览 · 选择学校')
                  : `${pendingUniObj?.short} · 选择研究科`}
              </Text>
              <Pressable onPress={() => setAddOpen(false)}><Icon name="close" size={18} color={Colors.textMuted} /></Pressable>
            </View>
            {addStep === 'school' ? (
              <>
                <View style={styles.searchBar}>
                  <Icon name="search" size={15} color={Colors.textMuted} />
                  <TextInput style={styles.searchInput} value={addQuery} onChangeText={setAddQuery} placeholder="搜索学校名" placeholderTextColor={Colors.textMuted} autoCorrect={false} />
                </View>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {addCandidates.map((u) => (
                    <Pressable key={u.id} style={styles.uniRow} onPress={() => { setPendingUni(u.id); setAddStep('grad'); }}>
                      <View style={[styles.uniRowAvatar, { backgroundColor: accent500[u.accent] ?? Colors.indigo500 }]}>
                        <Text style={styles.railAvatarText}>{u.short.slice(0, 1)}</Text>
                      </View>
                      <Text style={styles.uniRowName}>{u.short} · {u.nameJp}</Text>
                      <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                    </Pressable>
                  ))}
                  <View style={{ height: 32 }} />
                </ScrollView>
              </>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {pendingGrads.length === 0 ? (
                  <View style={styles.empty}><Text style={styles.emptyText}>该校研究科信息整理中</Text></View>
                ) : (
                  pendingGrads.map((g) => {
                    const added = !!pendingUni && (
                      (user.targetSchools ?? []).some((s) => s.universityId === pendingUni && normGrad(pendingUni, s.gradSchool) === g) ||
                      browseRaw.some((e) => e.universityId === pendingUni && e.gradSchool === g)
                    );
                    return (
                      <Pressable key={g} style={styles.gradRow} onPress={() => pickGrad(g)}>
                        <Text style={styles.gradName}>{g}</Text>
                        {added ? <Text style={styles.gradAdded}>已添加</Text> : <Icon name="plus" size={16} color={Colors.indigo500} />}
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
    </SafeAreaView>
  );
}
