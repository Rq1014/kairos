import { useMemo, useState } from 'react';
import {
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
import { Icon } from '@/components/ui';
import { KAKOMON_UNIVERSITIES } from '@/mocks/data';

type SubmitState = 'idle' | 'submitting' | 'success';

const SUBJECTS = ['数学', '情报', '物理', '统计', '英语', '其他'];
const YEARS = Array.from({ length: 10 }, (_, i) => String(2024 - i));

const CONTENT_TYPES = [
  { id: 'exam',     label: '过去问原题', icon: 'book'     as const },
  { id: 'solution', label: '标准解析',   icon: 'pageRef'  as const },
  { id: 'notes',    label: '笔记整理',   icon: 'edit'     as const },
  { id: 'other',    label: '其他资料',   icon: 'layers'   as const },
] as const;

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  successBg: { alignItems: 'center', justifyContent: 'center' },
  successCard: { alignItems: 'center', gap: 14, padding: 32 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.green50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: Typography['2xl'], fontWeight: Typography.weightBold, color: c.textPrimary },
  successSub:    { fontSize: Typography.sm, color: c.textMuted, textAlign: 'center', lineHeight: Typography.sm * 1.7 },
  successPoints: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.teal500, backgroundColor: c.teal50, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  successBtn:    { backgroundColor: c.teal500, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 40, marginTop: 8 },
  successBtnText: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: '#fff' },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  headerBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  scroll:      { padding: Spacing.screenPadding },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: c.teal500 + '11', borderRadius: 10,
    borderWidth: 1, borderColor: c.teal500 + '33',
    padding: 12, marginBottom: Spacing.lg,
  },
  infoText: { flex: 1, fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.6 },

  section:     { marginBottom: Spacing.md },
  rowSection:  { flexDirection: 'row', gap: 12, marginBottom: Spacing.md },
  halfSection: { flex: 1 },
  label:       { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: 6 },
  required:    { color: c.rose500 },

  typeGrid: { flexDirection: 'row', gap: 8 },
  typeCard: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12,
    backgroundColor: c.surface, borderRadius: Spacing.cardRadius,
    borderWidth: 1.5, borderColor: c.border,
  },
  typeCardActive: { borderColor: c.teal500, backgroundColor: c.teal500 + '11' },
  typeLabel:      { fontSize: Typography.xs, color: c.textSecondary, fontWeight: Typography.weightMedium, textAlign: 'center' },
  typeLabelActive: { color: c.teal500, fontWeight: Typography.weightSemibold },

  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  selectorText:        { fontSize: Typography.sm, color: c.textPrimary },
  selectorPlaceholder: { color: c.textMuted },
  pickerDropdown:     { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  pickerItem:         { paddingHorizontal: 12, paddingVertical: 10 },
  pickerItemActive:   { backgroundColor: c.teal500 + '22' },
  pickerItemText:     { fontSize: Typography.sm, color: c.textSecondary },
  pickerItemTextActive: { color: c.teal500, fontWeight: Typography.weightSemibold },

  textInput: {
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: Typography.sm, color: c.textPrimary,
  },
  textArea:   { minHeight: 80 },
  charCount:  { fontSize: Typography.xs, color: c.textMuted, textAlign: 'right', marginTop: 4 },

  filePicker: {
    backgroundColor: c.surface, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: c.border, borderRadius: 12, padding: 20, minHeight: 100,
    alignItems: 'center', justifyContent: 'center',
  },
  filePickerSelected: { borderStyle: 'solid', borderColor: c.green600 },
  filePickerInner:    { alignItems: 'center', gap: 8 },
  filePickerText:     { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: c.textSecondary },
  filePickerSub:      { fontSize: Typography.xs, color: c.textMuted },
  fileSelectedRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  fileSelectedMeta:   { flex: 1, gap: 2 },
  fileSelectedName:   { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: c.green600 },
  fileSelectedSize:   { fontSize: Typography.xs, color: c.textMuted },

  submitBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.teal500, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  submitBtnDisabled: { opacity: 0.35 },
  submitBtnText:     { fontSize: Typography.base, fontWeight: Typography.weightBold, color: '#fff' },
  legalText:         { fontSize: Typography.xs, color: c.textMuted, textAlign: 'center', lineHeight: Typography.xs * 1.6 },
});

export default function UploadContributionScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const router = useRouter();
  const [contentType, setContentType] = useState<string>('exam');
  const [universityId, setUniversityId] = useState('');
  const [year, setYear] = useState('2024');
  const [subject, setSubject] = useState('数学');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [fileSelected, setFileSelected] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [uniPickerOpen, setUniPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);

  const selectedUni = KAKOMON_UNIVERSITIES.find((u) => u.id === universityId);
  const canSubmit = universityId.length > 0 && title.trim().length > 0 && fileSelected;

  function handleSubmit() {
    if (!canSubmit || submitState === 'submitting') return;
    setSubmitState('submitting');
    setTimeout(() => setSubmitState('success'), 1500);
  }

  if (submitState === 'success') {
    return (
      <SafeAreaView style={[styles.container, styles.successBg]}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Icon name="checkCircle" size={40} color={Colors.green600} />
          </View>
          <Text style={styles.successTitle}>提交成功！</Text>
          <Text style={styles.successSub}>贡献内容将在审核通过后上线{'\n'}感谢你对社区的贡献 🎉</Text>
          <Text style={styles.successPoints}>+ 30 贡献分（审核通过后到账）</Text>
          <Pressable style={styles.successBtn} onPress={() => router.back()}>
            <Text style={styles.successBtnText}>返回</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>上传贡献</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Icon name="info" size={14} color={Colors.teal500} />
          <Text style={styles.infoText}>
            上传过去问原图、解析文档或笔记，审核通过后获得贡献分。内容将在社区内共享。
          </Text>
        </View>

        {/* Content type */}
        <View style={styles.section}>
          <Text style={styles.label}>内容类型</Text>
          <View style={styles.typeGrid}>
            {CONTENT_TYPES.map((t) => {
              const active = contentType === t.id;
              return (
                <Pressable
                  key={t.id}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => setContentType(t.id)}
                >
                  <Icon name={t.icon} size={18} color={active ? Colors.teal500 : Colors.textSecondary} />
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* University */}
        <View style={styles.section}>
          <Text style={styles.label}>目标学校 <Text style={styles.required}>*</Text></Text>
          <Pressable style={styles.selector} onPress={() => setUniPickerOpen((o) => !o)}>
            <Text style={[styles.selectorText, !selectedUni && styles.selectorPlaceholder]}>
              {selectedUni ? `${selectedUni.short} · ${selectedUni.nameCn}` : '选择学校'}
            </Text>
            <Icon name={uniPickerOpen ? 'chevronUp' : 'chevronDown'} size={14} color={Colors.textMuted} />
          </Pressable>
          {uniPickerOpen && (
            <View style={styles.pickerDropdown}>
              {KAKOMON_UNIVERSITIES.slice(0, 8).map((u) => (
                <Pressable
                  key={u.id}
                  style={[styles.pickerItem, universityId === u.id && styles.pickerItemActive]}
                  onPress={() => { setUniversityId(u.id); setUniPickerOpen(false); }}
                >
                  <Text style={[styles.pickerItemText, universityId === u.id && styles.pickerItemTextActive]}>
                    {u.short} · {u.nameCn}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Year + Subject */}
        <View style={styles.rowSection}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>年份</Text>
            <Pressable style={styles.selector} onPress={() => setYearPickerOpen((o) => !o)}>
              <Text style={styles.selectorText}>{year}</Text>
              <Icon name={yearPickerOpen ? 'chevronUp' : 'chevronDown'} size={14} color={Colors.textMuted} />
            </Pressable>
            {yearPickerOpen && (
              <View style={styles.pickerDropdown}>
                {YEARS.map((y) => (
                  <Pressable
                    key={y}
                    style={[styles.pickerItem, year === y && styles.pickerItemActive]}
                    onPress={() => { setYear(y); setYearPickerOpen(false); }}
                  >
                    <Text style={[styles.pickerItemText, year === y && styles.pickerItemTextActive]}>{y}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.halfSection}>
            <Text style={styles.label}>科目</Text>
            <Pressable style={styles.selector} onPress={() => setSubjectPickerOpen((o) => !o)}>
              <Text style={styles.selectorText}>{subject}</Text>
              <Icon name={subjectPickerOpen ? 'chevronUp' : 'chevronDown'} size={14} color={Colors.textMuted} />
            </Pressable>
            {subjectPickerOpen && (
              <View style={styles.pickerDropdown}>
                {SUBJECTS.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.pickerItem, subject === s && styles.pickerItemActive]}
                    onPress={() => { setSubject(s); setSubjectPickerOpen(false); }}
                  >
                    <Text style={[styles.pickerItemText, subject === s && styles.pickerItemTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>标题 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="例：东大 2023 情报理工 数学 全套（含答案）"
            placeholderTextColor={Colors.textMuted}
            maxLength={60}
          />
          <Text style={styles.charCount}>{title.length} / 60</Text>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>备注（可选）</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="题目来源说明、扫描质量、解析完整度等"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="top"
          />
        </View>

        {/* File picker */}
        <View style={styles.section}>
          <Text style={styles.label}>上传文件 <Text style={styles.required}>*</Text></Text>
          <Pressable
            style={[styles.filePicker, fileSelected && styles.filePickerSelected]}
            onPress={() => setFileSelected(true)}
          >
            {fileSelected ? (
              <View style={styles.fileSelectedRow}>
                <Icon name="checkCircle" size={20} color={Colors.green600} />
                <View style={styles.fileSelectedMeta}>
                  <Text style={styles.fileSelectedName}>exam_2023_math.pdf</Text>
                  <Text style={styles.fileSelectedSize}>PDF · 3.2 MB</Text>
                </View>
                <Pressable onPress={(e) => { e.stopPropagation(); setFileSelected(false); }}>
                  <Icon name="close" size={16} color={Colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.filePickerInner}>
                <Icon name="upload" size={24} color={Colors.textMuted} />
                <Text style={styles.filePickerText}>点击选择文件</Text>
                <Text style={styles.filePickerSub}>支持 PDF / JPG / PNG，最大 50 MB</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Icon name="upload" size={16} color="#fff" />
          <Text style={styles.submitBtnText}>
            {submitState === 'submitting' ? '提交中…' : '提交贡献'}
          </Text>
        </Pressable>

        <Text style={styles.legalText}>
          提交即表示你同意内容归社区共享，并确认内容不含侵权材料
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
