import { useMemo, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import { KAKOMON_THREADS, KAKOMON_UNIVERSITIES, KAKOMON_QUESTIONS, KAKOMON_THREAD_REPLIES } from '@/mocks/data';
import type { ThreadType } from '@/types/forum';

type LocalReply = {
  id: string;
  author: string;
  badge: string;
  time: string;
  body: string;
  upvotes: number;
  isAccepted: boolean;
  isAnonymous: boolean;
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  iconBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },

  scroll: { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },

  postCard: { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 12 },
  postMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  typeBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  typeBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  tagBadge:     { borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  tagBadgeText: { fontSize: Typography.xs, color: c.textSecondary },
  postTitle:    { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: c.textPrimary, lineHeight: Typography.lg * 1.35, marginBottom: 12 },

  postAuthorRow:  { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  authorAvatar:     { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  authorAvatarAnon: { backgroundColor: c.border },
  authorAvatarText: { fontSize: 13, fontWeight: Typography.weightBold, color: c.textSecondary },
  authorNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName:     { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  authorBadge:    { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  authorBadgeText: { fontSize: Typography.xs, fontWeight: Typography.weightMedium },
  authorTime:     { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },

  postBody: { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.7 },

  linkedQ:      { backgroundColor: c.blue50, borderWidth: 1, borderColor: c.blue500 + '44', borderRadius: 8, padding: 10, marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  linkedQLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.blue500, marginBottom: 2 },
  linkedQTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  linkedQMeta:  { fontSize: Typography.xs, color: c.textMuted, marginTop: 2 },

  postActions:  { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: c.border, marginTop: 14, paddingTop: 12 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 6, paddingVertical: 4 },
  actionText:   { fontSize: Typography.xs, color: c.textMuted },

  aiCard:    { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.amber500 + '44', borderRadius: Spacing.cardRadius, padding: Spacing.cardPadding, marginBottom: 12 },
  aiCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiIcon:    { width: 32, height: 32, borderRadius: 8, backgroundColor: c.amber500, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  aiCardTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  aiCardSub:   { fontSize: Typography.xs, color: c.textMuted },
  aiProBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.amber500, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  aiProBtnText: { fontSize: Typography.xs, fontWeight: Typography.weightBold, color: '#fff' },

  repliesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  repliesCount:  { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  repliesSort:   { fontSize: Typography.xs, color: c.blue500, fontWeight: Typography.weightSemibold },

  replyCard:         { backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding, marginBottom: 8 },
  replyCardAccepted: { backgroundColor: c.green50, borderColor: c.green500 + '44' },
  acceptedBanner:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  acceptedText:      { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.green600 },
  replyAuthorRow:    { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  replyBody:         { fontSize: Typography.sm, color: c.textSecondary, lineHeight: Typography.sm * 1.7 },
  replyActions:      { flexDirection: 'row', alignItems: 'center', marginTop: 10 },

  composerBar:       { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface, gap: 6 },
  composerAnonRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  composerAnonLabel: { fontSize: Typography.xs, color: c.textMuted, fontWeight: Typography.weightMedium },
  composerInputRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composerInput:     { flex: 1, maxHeight: 80, borderRadius: 20, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 8, fontSize: Typography.sm, color: c.textPrimary },
  sendBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: c.indigo600, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: c.surfaceAlt },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText:  { fontSize: Typography.sm, color: c.textMuted },

  solvedBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: c.green500 },
  solvedBtnActive:    { backgroundColor: c.green600, borderColor: c.green600 },
  solvedBtnText:      { fontSize: Typography.xs, color: c.green600, fontWeight: Typography.weightSemibold },
  solvedBtnTextActive:{ color: '#fff' },
});

export default function ThreadDetailScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const TYPE_LABELS: Record<ThreadType, { label: string; color: string; bgColor: string }> = {
    question_discussion: { label: '题目讨论', color: Colors.blue500,   bgColor: Colors.blue50 },
    material_request:    { label: '资料互助', color: Colors.amber500,  bgColor: Colors.amber50 },
    experience:          { label: '合格经验', color: Colors.green600,  bgColor: Colors.green50 },
    study_circle:        { label: '同校备考', color: Colors.indigo500, bgColor: Colors.indigo50 },
  };

  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [composer, setComposer] = useState('');
  const [localUpvotes, setLocalUpvotes] = useState<Record<string, boolean>>({});
  const [postLiked, setPostLiked] = useState(false);
  const [postBookmarked, setPostBookmarked] = useState(false);
  const [sort, setSort] = useState<'最热' | '最新'>('最热');
  const [localReplies, setLocalReplies] = useState<LocalReply[]>([]);
  const [solved, setSolved] = useState(false);
  const [replyAnonymous, setReplyAnonymous] = useState(false);

  const thread  = KAKOMON_THREADS.find((x) => x.id === id);
  const replies = KAKOMON_THREAD_REPLIES[id ?? ''] ?? [];

  if (!thread) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>帖子</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>帖子未找到</Text>
        </View>
      </SafeAreaView>
    );
  }

  const u = thread.universityId ? KAKOMON_UNIVERSITIES.find((x) => x.id === thread.universityId) : null;
  const q = thread.questionId   ? KAKOMON_QUESTIONS.find((x) => x.id === thread.questionId)     : null;
  const typeInfo = TYPE_LABELS[thread.type];

  const toggleUpvote = (replyId: string) => {
    setLocalUpvotes((prev) => ({ ...prev, [replyId]: !prev[replyId] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>帖子</Text>
          <Pressable
            style={styles.iconBtn}
            onPress={() => Alert.alert('更多', '', [
              { text: '举报帖子', style: 'destructive', onPress: () => {} },
              { text: '取消', style: 'cancel' },
            ])}
          >
            <Icon name="more" size={18} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Original post */}
          <View style={styles.postCard}>
            <View style={styles.postMeta}>
              {u && (
                <View style={[styles.typeBadge, { backgroundColor: Colors.indigo50 }]}>
                  <Text style={[styles.typeBadgeText, { color: Colors.indigo500 }]}>{u.short}</Text>
                </View>
              )}
              <View style={[styles.typeBadge, { backgroundColor: typeInfo.bgColor }]}>
                <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
              </View>
              {thread.tags.map((tag) => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>#{tag}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.postTitle}>{thread.title}</Text>

            <View style={styles.postAuthorRow}>
              <View style={[styles.authorAvatar, thread.isAnonymous && styles.authorAvatarAnon]}>
                <Text style={styles.authorAvatarText}>
                  {thread.isAnonymous ? '?' : (thread.authorName.split(' · ')[1] ?? thread.authorName).slice(0, 1)}
                </Text>
              </View>
              <View>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>
                    {thread.isAnonymous ? '匿名用户' : (thread.authorName.split(' · ')[1] ?? thread.authorName)}
                  </Text>
                  {!thread.isAnonymous && (
                    <View style={[styles.authorBadge, { backgroundColor: thread.authorBadge === 'passed' ? Colors.green50 : thread.authorBadge === 'verified' ? Colors.blue50 : Colors.amber50 }]}>
                      <Text style={[styles.authorBadgeText, { color: thread.authorBadge === 'passed' ? Colors.green600 : thread.authorBadge === 'verified' ? Colors.blue600 : Colors.amber600 }]}>
                        {thread.authorBadge === 'passed' ? '已合格' : thread.authorBadge === 'verified' ? '认证' : '备考中'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.authorTime}>{thread.lastActivity} · {thread.viewCount} 浏览</Text>
              </View>
            </View>

            <Text style={styles.postBody}>{thread.excerpt}</Text>

            {q && (
              <Pressable
                style={styles.linkedQ}
                onPress={() => router.push(`/questions/${q.id}` as any)}
              >
                <Icon name="link" size={12} color={Colors.blue500} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkedQLabel}>关联题目</Text>
                  <Text style={styles.linkedQTitle}>{q.title}</Text>
                  <Text style={styles.linkedQMeta}>{u?.short} · {q.subject} {q.questionNo}</Text>
                </View>
              </Pressable>
            )}

            <View style={styles.postActions}>
              <Pressable style={styles.actionBtn} onPress={() => setPostLiked((v) => !v)}>
                <Icon name="thumbsUp" size={13} color={postLiked ? Colors.blue500 : Colors.textMuted} />
                <Text style={[styles.actionText, postLiked && { color: Colors.blue500 }]}>
                  顶 {12 + (postLiked ? 1 : 0)}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                <Icon name="message" size={13} color={Colors.textMuted} />
                <Text style={styles.actionText}>{thread.replyCount + localReplies.length}</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { marginLeft: 'auto' }]} onPress={() => setPostBookmarked((v) => !v)}>
                <Icon name="bookmark" size={13} color={postBookmarked ? Colors.amber500 : Colors.textMuted} />
                <Text style={[styles.actionText, postBookmarked && { color: Colors.amber500 }]}>
                  {postBookmarked ? '已收藏' : '收藏'}
                </Text>
              </Pressable>
              {thread.type === 'material_request' && (
                <Pressable
                  style={[styles.actionBtn, styles.solvedBtn, solved && styles.solvedBtnActive]}
                  onPress={() => setSolved((v) => !v)}
                >
                  <Icon name="check" size={13} color={solved ? '#fff' : Colors.green600} />
                  <Text style={[styles.solvedBtnText, solved && styles.solvedBtnTextActive]}>
                    {solved ? '已解决' : '标记已解决'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* AI Summary — locked for non-Pro */}
          <View style={styles.aiCard}>
            <View style={styles.aiCardRow}>
              <View style={styles.aiIcon}>
                <Icon name="sparkles" size={14} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiCardTitle}>AI 总结本帖</Text>
                <Text style={styles.aiCardSub}>提取核心观点 + 答案要点</Text>
              </View>
              <Pressable style={styles.aiProBtn} onPress={() => router.push('/paywall' as any)}>
                <Icon name="lock" size={11} color="#fff" />
                <Text style={styles.aiProBtnText}>Pro</Text>
              </Pressable>
            </View>
          </View>

          {/* Replies */}
          <View style={styles.repliesHeader}>
            <Text style={styles.repliesCount}>{replies.length + localReplies.length} 条回复</Text>
            <Pressable onPress={() => setSort((s) => (s === '最热' ? '最新' : '最热'))}>
              <Text style={styles.repliesSort}>{sort} ↕</Text>
            </Pressable>
          </View>

          {replies.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="message" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyText}>暂无回复，来第一个发言吧</Text>
            </View>
          ) : (
            replies.map((r) => {
              const upvoted = localUpvotes[r.id];
              return (
                <View
                  key={r.id}
                  style={[styles.replyCard, r.isAccepted && styles.replyCardAccepted]}
                >
                  {r.isAccepted && (
                    <View style={styles.acceptedBanner}>
                      <Icon name="check" size={11} color={Colors.green600} />
                      <Text style={styles.acceptedText}>楼主已采纳</Text>
                    </View>
                  )}
                  <View style={styles.replyAuthorRow}>
                    <View style={[styles.authorAvatar, r.isAnonymous && styles.authorAvatarAnon]}>
                      <Text style={styles.authorAvatarText}>{r.isAnonymous ? '?' : r.author.slice(0, 1)}</Text>
                    </View>
                    <View>
                      <View style={styles.authorNameRow}>
                        <Text style={styles.authorName}>{r.isAnonymous ? '匿名用户' : r.author}</Text>
                        {!r.isAnonymous && (
                          <View style={[styles.authorBadge, { backgroundColor: r.badge === 'passed' ? Colors.green50 : r.badge === 'verified' ? Colors.blue50 : Colors.amber50 }]}>
                            <Text style={[styles.authorBadgeText, { color: r.badge === 'passed' ? Colors.green600 : r.badge === 'verified' ? Colors.blue600 : Colors.amber600 }]}>
                              {r.badge === 'passed' ? '已合格' : r.badge === 'verified' ? '认证' : '备考中'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.authorTime}>{r.time}</Text>
                    </View>
                  </View>
                  <Text style={styles.replyBody}>{r.body}</Text>
                  <View style={styles.replyActions}>
                    <Pressable style={styles.actionBtn} onPress={() => toggleUpvote(r.id)}>
                      <Icon name="thumbsUp" size={12} color={upvoted ? Colors.blue500 : Colors.textMuted} />
                      <Text style={[styles.actionText, upvoted && { color: Colors.blue500 }]}>
                        {r.upvotes + (upvoted ? 1 : 0)}
                      </Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => setComposer(`@${r.author} `)}>
                      <Text style={styles.actionText}>回复</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}

          {localReplies.map((r) => (
            <View key={r.id} style={styles.replyCard}>
              <View style={styles.replyAuthorRow}>
                <View style={[styles.authorAvatar, r.isAnonymous && styles.authorAvatarAnon]}>
                  <Text style={styles.authorAvatarText}>{r.isAnonymous ? '?' : r.author.slice(0, 1)}</Text>
                </View>
                <View>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.authorName}>{r.isAnonymous ? '匿名用户' : r.author}</Text>
                    {!r.isAnonymous && (
                      <View style={[styles.authorBadge, { backgroundColor: Colors.amber50 }]}>
                        <Text style={[styles.authorBadgeText, { color: Colors.amber600 }]}>备考中</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.authorTime}>{r.time}</Text>
                </View>
              </View>
              <Text style={styles.replyBody}>{r.body}</Text>
            </View>
          ))}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Reply composer */}
        <View style={styles.composerBar}>
          <View style={styles.composerAnonRow}>
            <Icon name="user" size={12} color={replyAnonymous ? Colors.indigo500 : Colors.textMuted} />
            <Text style={[styles.composerAnonLabel, replyAnonymous && { color: Colors.indigo500 }]}>匿名评论</Text>
            <Switch
              value={replyAnonymous}
              onValueChange={setReplyAnonymous}
              trackColor={{ false: Colors.surfaceAlt, true: Colors.indigo500 + 'AA' }}
              thumbColor={replyAnonymous ? Colors.indigo500 : Colors.textMuted}
              style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
            />
          </View>
          <View style={styles.composerInputRow}>
            <TextInput
              style={styles.composerInput}
              value={composer}
              onChangeText={setComposer}
              placeholder="说说你的看法…"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <Pressable
              style={[styles.sendBtn, !composer.trim() && styles.sendBtnDisabled]}
              onPress={() => {
                if (!composer.trim()) return;
                setLocalReplies((prev) => [
                  ...prev,
                  {
                    id: `local-${Date.now()}`,
                    author: '我',
                    badge: 'studying',
                    time: '刚刚',
                    body: composer.trim(),
                    upvotes: 0,
                    isAccepted: false,
                    isAnonymous: replyAnonymous,
                  },
                ]);
                setComposer('');
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
              }}
            >
              <Icon name="send" size={16} color={composer.trim() ? '#fff' : Colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
