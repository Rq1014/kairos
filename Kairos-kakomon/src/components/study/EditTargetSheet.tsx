import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { KAKOMON_UNIVERSITIES, UNI_GRADS, UNI_MAJORS, gradName } from '@/mocks/data';
import { FREE_TARGET_LIMIT, PRO_TARGET_LIMIT } from '@/utils/accessPolicy';
import type { EditTargetConfig, TargetEntry } from '@/types/user';

type SheetView = 'main' | 'picker';

// ─── makeStyles ─────────────────────────────────────────────
const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  sheetTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  sheetClose: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  sheetScroll: { paddingHorizontal: 16, paddingTop: 12 },

  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: 8 },
  sectionBlock: { marginBottom: 18 },
  row: { flexDirection: 'row', gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Exam type buttons
  typeBtn: { flex: 1, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: 12 },
  typeBtnActive: { borderColor: c.blue500, backgroundColor: c.blue500 + '12', borderWidth: 2 },
  typeBtnTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBtnLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  typeBtnLabelActive: { color: c.blue600 },
  typeBtnDesc: { fontSize: Typography.xs, color: c.textMuted, marginTop: 4 },

  // School entries
  schoolEntry: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 10, padding: '10 12' as any, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  schoolAvatar: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  schoolAvatarText: { fontSize: 13, fontWeight: Typography.weightBold, color: '#fff' },
  schoolInfo: { flex: 1, gap: 1 },
  schoolName: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  schoolSub: { fontSize: Typography.xs, color: c.textMuted },
  removeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt },

  // Empty school pickers
  pickerBtn: { flex: 1, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: 14, gap: 4 },
  pickerBtnIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerBtnIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  pickerBtnLabel: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  pickerBtnDesc: { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.4 },

  // Chip toggle
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: c.surfaceAlt },
  chipActive: { backgroundColor: c.blue500 },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: c.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: Typography.weightSemibold },
  chipNote: { fontSize: Typography.xs, color: c.textMuted, marginTop: 4, marginLeft: 2 },

  emptyInvite: { fontSize: Typography.sm, color: c.textMuted, marginBottom: 10, lineHeight: Typography.sm * 1.5 },

  saveBtn: { backgroundColor: c.blue600, borderRadius: Spacing.cardRadius, paddingVertical: 14, alignItems: 'center', marginBottom: 32, marginTop: 8 },
  saveBtnText: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: '#fff' },

  // Picker sub-view
  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  pickerHeaderInfo: { flex: 1, gap: 2 },
  pickerHeaderTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  pickerHeaderSub: { fontSize: Typography.xs, color: c.textMuted },
  pickerCount: { fontSize: Typography.sm, fontWeight: Typography.weightBold },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 12 },
  searchInput: { flex: 1, fontSize: Typography.sm, color: c.textPrimary },

  hotLabel: { fontSize: Typography.xs, color: c.textMuted, marginBottom: 6 },

  proHintBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.amber500 + '18', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  proHintText: { flex: 1, fontSize: Typography.xs, color: c.amber600, fontWeight: Typography.weightMedium },

  // 升级 Pro 弹窗
  proGateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 28 },
  proGateCard: { backgroundColor: c.background, borderRadius: 18, padding: 22, alignItems: 'center', gap: 8 },
  proGateIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.amber500 + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  proGateTitle: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary },
  proGateDesc: { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center', lineHeight: Typography.sm * 1.5 },
  proGateUpgrade: { alignSelf: 'stretch', backgroundColor: c.amber500, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  proGateUpgradeText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  proGateLater: { paddingVertical: 8 },
  proGateLaterText: { fontSize: Typography.sm, color: c.textMuted },

  // School list item
  uniItem: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, marginBottom: 8, overflow: 'hidden' },
  uniItemSelected: { borderWidth: 2 },
  uniItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  uniItemAvatar: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  uniItemAvatarText: { fontSize: 14, fontWeight: Typography.weightBold, color: '#fff' },
  uniItemInfo: { flex: 1, gap: 3 },
  uniItemTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uniItemName: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: c.textPrimary },
  uniItemJp: { fontSize: Typography.xs, color: c.textMuted, flex: 1 },
  uniItemBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  uniTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  uniTypeBadgeText: { fontSize: 10, fontWeight: Typography.weightSemibold },
  checkBubble: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Expanded 研究科 panel
  expandedPanel: { padding: 12, borderTopWidth: 1, borderTopColor: c.border },
  expandedLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textMuted, marginBottom: 8 },
  gradChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  gradChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  gradChipActive: { borderWidth: 2 },
  gradChipText: { fontSize: Typography.xs, fontWeight: Typography.weightMedium, color: c.textSecondary },
  majorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  majorCard: { width: '47%', backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.border, padding: 8 },
  majorCardSelected: { borderWidth: 2 },
  majorCardShort: { fontSize: Typography.xs, fontWeight: Typography.weightBold },
  majorCardLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginTop: 1 },
  majorCardDesc: { fontSize: 10, color: c.textMuted, marginTop: 1 },
  skipGradBtn: { fontSize: Typography.xs, color: c.blue500, fontWeight: Typography.weightMedium, marginTop: 8 },

  pickerContainer: { flexShrink: 1 },
  pickerScroll: { flexGrow: 0, flexShrink: 1 },
  pickerFooter: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background },
  pickerDoneBtn: { backgroundColor: c.blue600, borderRadius: Spacing.cardRadius, paddingVertical: 13, alignItems: 'center' },
  pickerDoneBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
});

// ─── Main component ──────────────────────────────────────────
interface EditTargetSheetProps {
  open: boolean;
  onClose: () => void;
  initialConfig: EditTargetConfig;
  onSave: (cfg: EditTargetConfig) => void;
  /** 非 VIP 最多选 3 个研究科；VIP 至多 6 个研究科。 */
  isPro?: boolean;
  /** 超出免费额度时，跳转升级。 */
  onUpgrade?: () => void;
}

// 目标研究科上限统一从 accessPolicy 取，避免多处维护。
const FREE_LIMIT = FREE_TARGET_LIMIT;
const PRO_LIMIT = PRO_TARGET_LIMIT;

export function EditTargetSheet({ open, onClose, initialConfig, onSave, isPro = false, onUpgrade }: EditTargetSheetProps) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const maxTargets = isPro ? PRO_LIMIT : FREE_LIMIT;

  const [draft, setDraft] = useState<EditTargetConfig>(initialConfig);
  const [view, setView] = useState<SheetView>('main');
  const [showProGate, setShowProGate] = useState(false);

  // Reset when opened
  const handleOpen = () => { setDraft(initialConfig); setView('main'); setShowProGate(false); };

  // 上限按「条目」计（VIP 6 / 免费 3）；同校不同研究科、同学院不同专业各占一个名额。
  const targetCount = (entries: TargetEntry[]) => entries.length;

  const sameEntry = (a: { universityId: string; gradSchool: string; majorId?: string }, b: { universityId: string; gradSchool: string; majorId?: string }) =>
    a.universityId === b.universityId && a.gradSchool === b.gradSchool && (a.majorId ?? '') === (b.majorId ?? '');

  /** 移除某条目标（按 大学+研究科+专攻 唯一键）。 */
  const removeEntry = (universityId: string, gradSchool: string, majorId?: string) => {
    setDraft((d) => ({
      ...d,
      entries: d.entries.filter((e) => !sameEntry(e, { universityId, gradSchool, majorId })),
    }));
  };

  /**
   * 添加一条目标（大学 + 研究科 + 专攻）。三元组完全相同才视为重复；同校同学院不同专攻是不同条目。
   * 留空 grad 或 majorId（仅添加学校 / 仅添加学院）也走同一规则。
   */
  const addEntry = (universityId: string, grad: string | null, majorId: string | null) => {
    const gradSchool = grad ?? '';
    const candidate = { universityId, gradSchool, majorId: majorId ?? undefined };
    const exists = draft.entries.some((e) => sameEntry(e, candidate));
    if (exists) return; // 完全一致，不重复添加。
    if (targetCount(draft.entries) >= maxTargets) {
      if (!isPro) setShowProGate(true);
      return;
    }
    setDraft((d) => ({
      ...d,
      entries: [...d.entries, { universityId, gradSchool, majorId: majorId ?? undefined }],
    }));
  };

  // 允许 0 个目标研究科保存（清空目标也是合法状态）。
  const schoolCount = targetCount(draft.entries);

  const ACCENT_500: Record<string, string> = {
    blue: Colors.blue500, teal: Colors.teal500, indigo: Colors.indigo500,
    amber: Colors.amber500, rose: Colors.rose500,
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />

          {/* Picker sub-view */}
          {view === 'picker' && (
            <>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setView('main')}>
                  <Icon name="chevronLeft" size={20} color={Colors.textPrimary} />
                </Pressable>
                <Text style={styles.sheetTitle}>选择目标校</Text>
                <View style={{ width: 20 }} />
              </View>
              <ThreeStepSchoolPicker
                entries={draft.entries}
                schoolCount={schoolCount}
                max={maxTargets}
                isPro={isPro}
                onAtLimit={() => { if (!isPro) setShowProGate(true); }}
                onAdd={addEntry}
                onDone={() => setView('main')}
                styles={styles}
                Colors={Colors}
              />
            </>
          )}

          {/* Main view */}
          {view === 'main' && (
            <>
              <View style={styles.sheetHeader}>
                <View style={{ width: 20 }} />
                <Text style={styles.sheetTitle}>修改目标</Text>
                <Pressable style={styles.sheetClose} onPress={onClose}>
                  <Icon name="close" size={14} color={Colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* 目标校 */}
                <View style={styles.sectionBlock}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionLabel}>目标校</Text>
                    <Text style={{ fontSize: Typography.xs, color: Colors.textMuted }}>
	                      已选 <Text style={{ color: Colors.blue500, fontWeight: Typography.weightBold }}>{schoolCount}</Text> 个研究科
	                      {isPro ? ` · 至多 ${PRO_LIMIT} 个` : ` · 免费 ${FREE_LIMIT} 个`}
                    </Text>
                  </View>

                  {draft.entries.length === 0 ? (
                    <>
                      <Text style={styles.emptyInvite}>还没有目标校 —— 添加一个，开启专属备考吧</Text>
                      <View style={styles.row}>
                        <Pressable style={styles.pickerBtn} onPress={() => setView('picker')}>
                          <View style={styles.pickerBtnIconRow}>
                            <View style={[styles.pickerBtnIcon, { backgroundColor: Colors.blue50 }]}>
                              <Icon name="search" size={14} color={Colors.blue600} />
                            </View>
                            <Text style={styles.pickerBtnLabel}>手动选择</Text>
                          </View>
                          <Text style={styles.pickerBtnDesc}>搜索学校名 · 选择研究科和専攻</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <>
                      {draft.entries.map((e) => {
                        const u = KAKOMON_UNIVERSITIES.find((x) => x.id === e.universityId);
                        if (!u) return null;
                        const major = e.majorId ? (UNI_MAJORS[`${e.universityId}::${e.gradSchool}`]?.find((m) => m.id === e.majorId)?.label ?? null) : null;
                        const subline = [gradName(e.universityId, e.gradSchool) || '未指定研究科', major].filter(Boolean).join(' · ');
                        const bg = ACCENT_500[u.accent] ?? Colors.blue500;
                        return (
                          <View key={`${e.universityId}::${e.gradSchool}::${e.majorId ?? ''}`} style={styles.schoolEntry}>
                            <View style={[styles.schoolAvatar, { backgroundColor: bg }]}>
                              <Text style={styles.schoolAvatarText}>{u.short.slice(0, 1)}</Text>
                            </View>
                            <View style={styles.schoolInfo}>
                              <Text style={styles.schoolName}>{u.short} · {u.nameJp}</Text>
                              <Text style={styles.schoolSub}>{subline}</Text>
                            </View>
                            <Pressable style={styles.removeBtn} onPress={() => removeEntry(e.universityId, e.gradSchool, e.majorId)}>
                              <Icon name="close" size={13} color={Colors.textMuted} />
                            </Pressable>
                          </View>
                        );
                      })}
                      <View style={[styles.row, { marginTop: 6 }]}>
                        <Pressable
                          style={[styles.pickerBtn, { flex: 1, padding: 10 }]}
                          onPress={() => setView('picker')}
                        >
                          <View style={styles.pickerBtnIconRow}>
                            <Icon name="search" size={14} color={Colors.blue500} />
                            <Text style={[styles.pickerBtnLabel, { color: Colors.blue500 }]}>手动添加</Text>
                          </View>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>

                {/* Save —— 允许 0 所目标校保存 */}
                <Pressable
                  style={styles.saveBtn}
                  onPress={() => { onSave(draft); onClose(); }}
                >
                  <Text style={styles.saveBtnText}>
                    <Icon name="check" size={14} color="#fff" /> {draft.entries.length === 0 ? '暂不设置目标，先保存' : '保存目标'}
                  </Text>
                </Pressable>
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>

      {/* 超出免费额度 → 升级 Pro */}
      <Modal visible={showProGate} transparent animationType="fade" onRequestClose={() => setShowProGate(false)}>
        <Pressable style={styles.proGateOverlay} onPress={() => setShowProGate(false)}>
          <Pressable style={styles.proGateCard} onPress={() => {}}>
            <View style={styles.proGateIcon}>
              <Icon name="crown" size={22} color={Colors.amber500} />
            </View>
	            <Text style={styles.proGateTitle}>免费最多 {FREE_LIMIT} 个目标研究科</Text>
	            <Text style={styles.proGateDesc}>
	              升级 Pro 可添加至多 {PRO_LIMIT} 个目标研究科，并解锁全部过去问与模考。
	            </Text>
            <Pressable
              style={styles.proGateUpgrade}
              onPress={() => { setShowProGate(false); onUpgrade?.(); }}
            >
              <Text style={styles.proGateUpgradeText}>升级 Pro 解锁更多</Text>
            </Pressable>
            <Pressable style={styles.proGateLater} onPress={() => setShowProGate(false)}>
	              <Text style={styles.proGateLaterText}>暂不，保留 {FREE_LIMIT} 个</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

// ─── 学校 → 学院 → 专业 三步选择器 ────────────────────────────
type PickerStep = 'uni' | 'grad' | 'major';

function ThreeStepSchoolPicker({
  entries, schoolCount, max, isPro, onAtLimit, onAdd, onDone,
  styles, Colors,
}: {
  entries: TargetEntry[];
  schoolCount: number;
  max: number;
  isPro: boolean;
  onAtLimit: () => void;
  onAdd: (id: string, grad: string | null, majorId: string | null) => void;
  onDone: () => void;
  styles: ReturnType<typeof makeStyles>;
  Colors: ThemeColors;
}) {
  const [step, setStep] = useState<PickerStep>('uni');
  const [pickedUniId, setPickedUniId] = useState<string | null>(null);
  const [pickedGrad, setPickedGrad] = useState<string | null>(null);

  const pickedUni = useMemo(
    () => (pickedUniId ? KAKOMON_UNIVERSITIES.find((u) => u.id === pickedUniId) ?? null : null),
    [pickedUniId],
  );
  const grads = useMemo<string[]>(
    () => (pickedUniId ? (UNI_GRADS[pickedUniId] ?? []) : []),
    [pickedUniId],
  );
  const majors = useMemo(
    () => (pickedUniId && pickedGrad ? (UNI_MAJORS[`${pickedUniId}::${pickedGrad}`] ?? []) : []),
    [pickedUniId, pickedGrad],
  );

  const atLimit = schoolCount >= max;

  function handleBack() {
    if (step === 'major') setStep('grad');
    else if (step === 'grad') {
      setStep('uni');
      setPickedGrad(null);
    }
  }

  function handlePickUni(id: string) {
    if (atLimit && !entries.some((e) => e.universityId === id)) {
      onAtLimit();
      return;
    }
    setPickedUniId(id);
    setPickedGrad(null);
    setStep('grad');
  }

  function handlePickGrad(grad: string) {
    setPickedGrad(grad);
    setStep('major');
  }

  function commitAndExit(uniId: string, grad: string | null, majorId: string | null) {
    onAdd(uniId, grad, majorId);
    onDone();
  }

  return (
    <View style={styles.pickerContainer}>
      {/* 面包屑 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, flexWrap: 'wrap' }}>
        <Text style={[styles.hotLabel, step === 'uni' && { color: Colors.blue500, fontWeight: Typography.weightSemibold }]}>
          {pickedUni ? pickedUni.short : '学校'}
        </Text>
        <Text style={styles.hotLabel}>›</Text>
        <Text style={[styles.hotLabel, step === 'grad' && { color: Colors.blue500, fontWeight: Typography.weightSemibold }]}>
          {pickedGrad ? gradName(pickedUniId!, pickedGrad) : '学院'}
        </Text>
        <Text style={styles.hotLabel}>›</Text>
        <Text style={[styles.hotLabel, step === 'major' && { color: Colors.blue500, fontWeight: Typography.weightSemibold }]}>
          专业
        </Text>
        {step !== 'uni' && (
          <Pressable onPress={handleBack} hitSlop={6} style={{ marginLeft: 'auto' }}>
            <Text style={[styles.hotLabel, { color: Colors.blue500, fontWeight: Typography.weightSemibold }]}>返回上一步</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.pickerScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 免费额度提示 */}
        {!isPro && (
          <Pressable style={styles.proHintBar} onPress={atLimit ? onAtLimit : undefined}>
            <Icon name="crown" size={13} color={Colors.amber600} />
            <Text style={styles.proHintText}>
              免费最多选 {max} 个目标研究科
              {atLimit ? ' · 已达上限，升级 Pro' : ''}
            </Text>
          </Pressable>
        )}

        {/* Step 1: 学校 */}
        {step === 'uni' && KAKOMON_UNIVERSITIES.map((u) => {
          const gs = UNI_GRADS[u.id] ?? [];
          if (gs.length === 0) return null;
          const isPicked = entries.some((e) => e.universityId === u.id);
          const blocked = atLimit && !isPicked;
          return (
            <Pressable
              key={u.id}
              style={[styles.uniItem, isPicked && styles.uniItemSelected]}
              onPress={() => handlePickUni(u.id)}
            >
              <View style={[styles.uniItemBtn, { opacity: blocked ? 0.55 : 1 }]}>
                <View style={styles.uniItemInfo}>
                  <View style={styles.uniItemTop}>
                    <Text style={styles.uniItemName}>{u.short}</Text>
                    <Text style={styles.uniItemJp} numberOfLines={1}>{u.nameJp}</Text>
                  </View>
                  <View style={styles.uniItemBadgeRow}>
                    <Text style={{ fontSize: Typography.xs, color: Colors.textMuted }}>{gs.length} 个学院</Text>
                  </View>
                </View>
                <Icon name="chevronRight" size={16} color={Colors.textMuted} />
              </View>
            </Pressable>
          );
        })}

        {/* Step 2: 学院 */}
        {step === 'grad' && pickedUniId && (
          grads.length === 0 ? (
            <View>
              <Text style={[styles.hotLabel, { textAlign: 'center', paddingVertical: 16 }]}>该学校暂无可选学院</Text>
              <Pressable
                style={styles.pickerDoneBtn}
                onPress={() => commitAndExit(pickedUniId, null, null)}
              >
                <Text style={styles.pickerDoneBtnText}>直接添加此学校</Text>
              </Pressable>
            </View>
          ) : (
            grads.map((grad) => {
              const ms = UNI_MAJORS[`${pickedUniId}::${grad}`] ?? [];
              return (
                <Pressable
                  key={grad}
                  style={styles.uniItem}
                  onPress={() => handlePickGrad(grad)}
                >
                  <View style={styles.uniItemBtn}>
                    <View style={styles.uniItemInfo}>
                      <Text style={styles.uniItemName}>{gradName(pickedUniId!, grad)}</Text>
                      <Text style={{ fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 }}>{ms.length} 个专业</Text>
                    </View>
                    <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                  </View>
                </Pressable>
              );
            })
          )
        )}

        {/* Step 3: 专业 */}
        {step === 'major' && pickedUniId && pickedGrad && (
          majors.length === 0 ? (
            <View>
              <Text style={[styles.hotLabel, { textAlign: 'center', paddingVertical: 16 }]}>该学院暂无可选专业</Text>
              <Pressable
                style={styles.pickerDoneBtn}
                onPress={() => commitAndExit(pickedUniId, pickedGrad, null)}
              >
                <Text style={styles.pickerDoneBtnText}>仅添加该学院</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {majors.map((m) => (
                <Pressable
                  key={m.id}
                  style={styles.uniItem}
                  onPress={() => commitAndExit(pickedUniId, pickedGrad, m.id)}
                >
                  <View style={styles.uniItemBtn}>
                    <View style={styles.uniItemInfo}>
                      <Text style={styles.uniItemName}>{m.label}</Text>
                      {m.desc ? <Text style={{ fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 }}>{m.desc}</Text> : null}
                    </View>
                    <Icon name="chevronRight" size={16} color={Colors.textMuted} />
                  </View>
                </Pressable>
              ))}
              <Pressable onPress={() => commitAndExit(pickedUniId, pickedGrad, null)} style={{ marginTop: 4 }}>
                <Text style={[styles.skipGradBtn, { textAlign: 'center', paddingVertical: 10 }]}>暂不指定専攻 · 仅添加该研究科</Text>
              </Pressable>
            </>
          )
        )}
      </ScrollView>

      <View style={styles.pickerFooter}>
        <Pressable style={styles.pickerDoneBtn} onPress={onDone}>
          <Text style={styles.pickerDoneBtnText}>完成（已选 {entries.length} 个研究科）</Text>
        </Pressable>
      </View>
    </View>
  );
}
