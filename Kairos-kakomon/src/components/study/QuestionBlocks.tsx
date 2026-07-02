import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useColors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import type { ContentBlock } from '@/types/question';
import { buildBlocksHtml } from './questionBlocksHtml';

// KaTeX 内联资源：MVP 阶段用最小 CSS + CDN 兜底。
// 完整离线内联在 Phase 1 收尾时替换为打包进 assets 的字符串（见计划末尾「后续」）。
const KATEX_CSS = '';
const KATEX_JS =
  'document.write(\'<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\\/script>\');' +
  'document.write(\'<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"/>\');';

interface Props {
  blocks?: ContentBlock[];
  fallbackText?: string;
}

export default function QuestionBlocks({ blocks, fallbackText }: Props) {
  const Colors = useColors();
  const [height, setHeight] = useState(80);

  const html = useMemo(() => {
    if (!blocks || blocks.length === 0) return null;
    return buildBlocksHtml(blocks, {
      fg: Colors.textSecondary,
      bg: Colors.surface,
      muted: Colors.textMuted,
    })
      .replace('__KATEX_CSS__', KATEX_CSS)
      .replace('__KATEX_JS__', KATEX_JS);
  }, [blocks, Colors]);

  if (!html) {
    if (!fallbackText) return null;
    return <Text style={[styles.fallback, { color: Colors.textSecondary }]}>{fallbackText}</Text>;
  }

  return (
    <View style={[styles.webWrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: 'transparent' }}
        onMessage={(e) => {
          const h = Number(e.nativeEvent.data);
          if (!Number.isNaN(h) && h > 0) setHeight(Math.ceil(h));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webWrap: { width: '100%', overflow: 'hidden' },
  fallback: { fontSize: Typography.sm, lineHeight: Typography.sm * 1.7 },
});
