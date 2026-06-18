import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { Icon } from './Icon';

interface AdGateModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired when the (mock) ad finishes — caller performs the actual unlock. */
  onUnlock: () => void;
  /** Headline e.g. 「解锁 京大 2021」 */
  title: string;
  /** What gets unlocked, e.g. 「该校 2021 年全部题目 · 24 小时」 */
  desc: string;
  /** Optional upsell → navigate to paywall. */
  onUpgrade?: () => void;
  /** When true, hide the watch-ad path (only Pro can unlock this). */
  proOnly?: boolean;
}

const AD_SECONDS = 5;

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: c.background, borderRadius: 18, padding: 22, gap: 14, alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: c.amber500 + '22', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: c.textPrimary, textAlign: 'center' },
  desc: { fontSize: Typography.sm, color: c.textSecondary, textAlign: 'center', lineHeight: Typography.sm * 1.5 },

  // Mock ad surface
  adSurface: { width: '100%', height: 120, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 6 },
  adLabel: { fontSize: Typography.xs, color: c.textMuted, letterSpacing: 1 },
  adCounter: { fontSize: Typography['2xl'], fontWeight: Typography.weightBold, color: c.textPrimary },

  watchBtn: { width: '100%', backgroundColor: c.amber500, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  watchBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: '#fff' },
  watchBtnDisabled: { opacity: 0.6 },

  upgradeBtn: { width: '100%', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: c.blue500 },
  upgradeBtnText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: c.blue600 },

  closeBtn: { paddingVertical: 6 },
  closeBtnText: { fontSize: Typography.xs, color: c.textMuted },
});

export function AdGateModal({ open, onClose, onUnlock, title, desc, onUpgrade, proOnly = false }: AdGateModalProps) {
  const Colors = useColors();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);

  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(AD_SECONDS);

  // Reset when (re)opened.
  useEffect(() => {
    if (open) {
      setPlaying(false);
      setRemaining(AD_SECONDS);
    }
  }, [open]);

  // Mock countdown; on finish trigger unlock.
  useEffect(() => {
    if (!playing) return;
    if (remaining <= 0) {
      onUnlock();
      onClose();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [playing, remaining, onUnlock, onClose]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={playing ? undefined : onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconWrap}>
            <Icon name="eye" size={26} color={Colors.amber500} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{desc}</Text>

          {playing ? (
            <View style={styles.adSurface}>
              <Text style={styles.adLabel}>广 告 播 放 中</Text>
              <Text style={styles.adCounter}>{remaining}s</Text>
            </View>
          ) : proOnly ? null : (
            <Pressable style={styles.watchBtn} onPress={() => { setRemaining(AD_SECONDS); setPlaying(true); }}>
              <Icon name="eye" size={15} color="#fff" />
              <Text style={styles.watchBtnText}>观看广告解锁</Text>
            </Pressable>
          )}

          {!playing && onUpgrade && (
            <Pressable style={styles.upgradeBtn} onPress={() => { onClose(); onUpgrade(); }}>
              <Text style={styles.upgradeBtnText}>升级 Pro · 免广告解锁全部</Text>
            </Pressable>
          )}

          {!playing && (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>暂不解锁</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
