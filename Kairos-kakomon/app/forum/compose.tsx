import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
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
import type { ThreadType } from '@/types/forum';

type ThreadTypeOption = { type: ThreadType; label: string; icon: string; color: string; bgColor: string; desc: string };

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  cancelBtn:   { paddingHorizontal: 8, paddingVertical: 6 },
  cancelText:  { fontSize: Typography.sm, color: c.textSecondary },
  headerTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  submitBtn:         { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: c.indigo600, borderRadius: 20 },
  submitBtnDisabled: { backgroundColor: c.surfaceAlt },
  submitText:        { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: '#fff' },
  submitTextDisabled: { color: c.textMuted },

  scroll:   { paddingHorizontal: Spacing.screenPadding, paddingTop: 16 },
  section:  { marginBottom: Spacing.md },
  label:    { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary, marginBottom: 8 },
  required: { color: c.rose500 },

  typeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard:      { width: '47%', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: Spacing.cardRadius, padding: 12, gap: 6 },
  typeCardActive: { backgroundColor: c.surface },
  typeIcon:      { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  typeLabel:     { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  typeDesc:      { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.5 },

  pickerBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  pickerPlaceholder: { fontSize: Typography.sm, color: c.textMuted },
  pickerValue:       { fontSize: Typography.sm, color: c.textPrimary },
  uniDropdown:       { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  uniOption:         { paddingHorizontal: 14, paddingVertical: 10 },
  uniOptionActive:   { backgroundColor: c.blue500 + '22' },
  uniOptionText:     { fontSize: Typography.sm, color: c.textSecondary },
  uniOptionTextActive: { color: c.blue500, fontWeight: Typography.weightSemibold },

  titleInput: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: Typography.sm, color: c.textPrimary },
  charCount:  { fontSize: Typography.xs, color: c.textMuted, textAlign: 'right', marginTop: 4 },

  bodyInput: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontSize: Typography.sm, color: c.textPrimary, minHeight: 160 },

  tipsCard:  { backgroundColor: c.blue50, borderWidth: 1, borderColor: c.blue500 + '44', borderRadius: Spacing.cardRadius, padding: Spacing.cardPadding },
  tipsRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipsTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.blue500 },
  tipsText:  { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.7 },

  anonRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: Spacing.cardRadius, paddingHorizontal: Spacing.cardPadding, paddingVertical: 12, marginBottom: Spacing.md },
  anonLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  anonText:  { flex: 1, gap: 2 },
  anonLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  anonDesc:  { fontSize: Typography.xs, color: c.textMuted, lineHeight: Typography.xs * 1.5 },
});

export default function ComposeThreadScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const THREAD_TYPES: ThreadTypeOption[] = [
    { type: 'question_discussion', label: '题目讨论', icon: 'book',     color: Colors.blue500,   bgColor: Colors.blue50,   desc: '讨论某道过去问的解题思路' },
    { type: 'material_request',    label: '资料互助', icon: 'download', color: Colors.amber500,  bgColor: Colors.amber50,  desc: '寻求或分享学习资料' },
    { type: 'experience',          label: '合格经验', icon: 'trophy',   color: Colors.green600,  bgColor: Colors.green50,  desc: '分享修考通过经验' },
    { type: 'study_circle',        label: '同校备考', icon: 'user',     color: Colors.indigo500, bgColor: Colors.indigo50, desc: '招募目标校备考搭档' },
  ];

  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ThreadType | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedUni, setSelectedUni] = useState<string | null>(null);
  const [showUniPicker, setShowUniPicker] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const canSubmit = selectedType && title.trim().length > 0 && body.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Text style={styles.headerTitle}>发帖</Text>
          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={() => {
              if (!canSubmit) return;
              Alert.alert('发布成功', '你的帖子已发出，稍后会出现在列表中。', [
                { text: '好的', onPress: () => router.back() },
              ]);
            }}
          >
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>发布</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Type selector */}
          <View style={styles.section}>
            <Text style={styles.label}>帖子类型 <Text style={styles.required}>*</Text></Text>
            <View style={styles.typeGrid}>
              {THREAD_TYPES.map((t) => (
                <Pressable
                  key={t.type}
                  style={[styles.typeCard, selectedType === t.type && styles.typeCardActive, selectedType === t.type && { borderColor: t.color }]}
                  onPress={() => setSelectedType(t.type)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: t.bgColor }]}>
                    <Icon name={t.icon as any} size={16} color={t.color} />
                  </View>
                  <Text style={[styles.typeLabel, selectedType === t.type && { color: t.color }]}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* University */}
          <View style={styles.section}>
            <Text style={styles.label}>关联学校（选填）</Text>
            <Pressable style={styles.pickerBtn} onPress={() => setShowUniPicker(!showUniPicker)}>
              <Text style={selectedUni ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedUni ? KAKOMON_UNIVERSITIES.find((u) => u.id === selectedUni)?.nameCn : '选择学校…'}
              </Text>
              <Icon name="chevronRight" size={16} color={Colors.textMuted} />
            </Pressable>
            {showUniPicker && (
              <View style={styles.uniDropdown}>
                <Pressable style={styles.uniOption} onPress={() => { setSelectedUni(null); setShowUniPicker(false); }}>
                  <Text style={styles.uniOptionText}>不关联学校</Text>
                </Pressable>
                {KAKOMON_UNIVERSITIES.slice(0, 8).map((u) => (
                  <Pressable
                    key={u.id}
                    style={[styles.uniOption, selectedUni === u.id && styles.uniOptionActive]}
                    onPress={() => { setSelectedUni(u.id); setShowUniPicker(false); }}
                  >
                    <Text style={[styles.uniOptionText, selectedUni === u.id && styles.uniOptionTextActive]}>
                      {u.nameCn}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>标题 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="简明描述你的问题或话题"
              placeholderTextColor={Colors.textMuted}
              maxLength={80}
              returnKeyType="next"
            />
            <Text style={styles.charCount}>{title.length} / 80</Text>
          </View>

          {/* Body */}
          <View style={styles.section}>
            <Text style={styles.label}>正文 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="详细描述你的问题、解题思路或经验…"
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Anonymous toggle */}
          <View style={styles.anonRow}>
            <View style={styles.anonLeft}>
              <Icon name="user" size={15} color={isAnonymous ? Colors.indigo500 : Colors.textMuted} />
              <View style={styles.anonText}>
                <Text style={styles.anonLabel}>匿名发帖</Text>
                <Text style={styles.anonDesc}>其他用户看不到你的名字，显示为「匿名用户」</Text>
              </View>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: Colors.surfaceAlt, true: Colors.indigo500 + 'AA' }}
              thumbColor={isAnonymous ? Colors.indigo500 : Colors.textMuted}
            />
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsRow}>
              <Icon name="info" size={13} color={Colors.blue500} />
              <Text style={styles.tipsTitle}>发帖建议</Text>
            </View>
            <Text style={styles.tipsText}>• 题目讨论请注明年份 · 科目 · 题号{'\n'}• 资料互助请说明所需资料的具体范围{'\n'}• 合格经验帖尽量包含备考时间轴和弱点攻克方法</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
