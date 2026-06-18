import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';

type Notif = {
  id: string;
  icon: IconName;
  color: string;
  title: string;
  body: string;
  time: string;
  link: string | null;
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  scroll: { padding: Spacing.screenPadding, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: c.textPrimary },
  markAllText: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: c.teal500 },

  notifCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: c.surface, borderRadius: Spacing.cardRadius, borderWidth: 1, borderColor: c.border, padding: Spacing.cardPadding },
  notifCardUnread: { borderColor: c.indigo500 + '44', backgroundColor: c.indigo500 + '08' },
  iconWrap:    { position: 'relative', flexShrink: 0 },
  notifIcon:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  unreadDot:   { position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: 5, backgroundColor: c.indigo500, borderWidth: 1.5, borderColor: c.background },
  notifContent: { flex: 1, gap: 4 },
  notifHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifTitle:        { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: c.textSecondary, flex: 1 },
  notifTitleUnread:  { fontWeight: Typography.weightSemibold, color: c.textPrimary },
  notifTime:    { fontSize: Typography.xs, color: c.textMuted, marginLeft: 8 },
  notifBody:    { fontSize: Typography.xs, color: c.textSecondary, lineHeight: Typography.xs * 1.5 },
  notifAction:  { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  notifActionText: { fontSize: Typography.xs, color: c.textMuted },
});

export default function NotificationsScreen() {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const MOCK_NOTIFICATIONS: Notif[] = [
    { id: '1', icon: 'sparkles', color: Colors.teal500,   title: '新过去问上线',           body: '东大 2024 情报理工 · 共 5 题新增完整解析',                time: '1 小时前',  link: null },
    { id: '2', icon: 'flame',    color: Colors.rose500,   title: '弱点提醒',              body: '「固有值与对角化」最近 7 天未复习，建议今天练习',          time: '今天 09:00', link: '/questions/q1' },
    { id: '3', icon: 'message',  color: Colors.indigo500, title: '论坛有人回复了你的问题', body: '王学长回复了「为什么实对称矩阵一定可对角化？」',           time: '昨天 22:31', link: '/forum/t3' },
    { id: '4', icon: 'trophy',   color: Colors.amber500,  title: '贡献被采纳',            body: '你上传的「东工大 2021 数学解析」已通过审核，获得 30 贡献分', time: '2 天前',     link: null },
  ];

  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const unreadCount = MOCK_NOTIFICATIONS.length - readIds.size;

  function handlePress(n: Notif) {
    setReadIds((prev) => new Set([...prev, n.id]));
    if (n.link) router.push(n.link as any);
  }

  function markAllRead() {
    setReadIds(new Set(MOCK_NOTIFICATIONS.map((n) => n.id)));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <Icon name="chevronLeft" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {unreadCount > 0 ? `通知（${unreadCount} 条未读）` : '通知'}
        </Text>
        {unreadCount > 0 ? (
          <Pressable style={styles.headerBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>全读</Text>
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {MOCK_NOTIFICATIONS.map((n) => {
          const isRead = readIds.has(n.id);
          return (
            <Pressable
              key={n.id}
              style={[styles.notifCard, !isRead && styles.notifCardUnread]}
              onPress={() => handlePress(n)}
            >
              <View style={styles.iconWrap}>
                <View style={[styles.notifIcon, { backgroundColor: n.color + '22' }]}>
                  <Icon name={n.icon} size={16} color={n.color} />
                </View>
                {!isRead && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, !isRead && styles.notifTitleUnread]} numberOfLines={1}>
                    {n.title}
                  </Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
                <Text style={styles.notifBody}>{n.body}</Text>
                {n.link && (
                  <View style={styles.notifAction}>
                    <Text style={styles.notifActionText}>点击查看详情</Text>
                    <Icon name="chevronRight" size={10} color={Colors.textMuted} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
