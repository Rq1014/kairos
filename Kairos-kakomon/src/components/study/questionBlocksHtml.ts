import type { ContentBlock } from '@/types/question';

/** 转义用户/题目文本，避免注入到 HTML。 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 转义要放进 JS 字符串字面量的 LaTeX（KaTeX 在浏览器端 render）。 */
function toJsString(s: string): string {
  return JSON.stringify(s);
}

function renderBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return `<p class="blk-text">${escapeHtml(block.content).replace(/\n/g, '<br/>')}</p>`;
    case 'math':
      // 占位 span，页面加载后由 KaTeX 渲染 data-latex
      return `<div class="blk-math" data-latex=${toJsString(block.latex)}></div>`;
    case 'image': {
      const cap = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';
      return `<figure class="blk-image"><img src="${encodeURI(block.url)}" />${cap}</figure>`;
    }
    case 'table': {
      const body = block.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('');
      const cap = block.caption ? `<caption>${escapeHtml(block.caption)}</caption>` : '';
      return `<table class="blk-table">${cap}${body}</table>`;
    }
    default:
      return '';
  }
}

/**
 * 把内容块拼成一段完整 HTML 文档。KaTeX 资源占位为 __KATEX_CSS__ / __KATEX_JS__，
 * 由 QuestionBlocks 组件在运行时替换为内联资源字符串（见 Task 3）。
 */
export function buildBlocksHtml(
  blocks: ContentBlock[],
  theme: { fg: string; bg: string; muted: string },
): string {
  const body = blocks.map(renderBlock).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<style>__KATEX_CSS__</style>
<style>
  * { -webkit-tap-highlight-color: transparent; }
  html,body { margin:0; padding:0; background:${theme.bg}; color:${theme.fg};
    font-size:15px; line-height:1.7; font-family:-apple-system,'Helvetica Neue',sans-serif; }
  #root { padding:12px; }
  .blk-text { margin:0 0 10px; white-space:normal; }
  .blk-math { margin:8px 0; overflow-x:auto; }
  .blk-image { margin:10px 0; text-align:center; }
  .blk-image img { max-width:100%; height:auto; border-radius:6px; }
  figcaption { font-size:12px; color:${theme.muted}; margin-top:4px; }
  .blk-table { border-collapse:collapse; margin:10px 0; width:100%; }
  .blk-table td { border:1px solid ${theme.muted}; padding:4px 8px; font-size:14px; }
  caption { font-size:12px; color:${theme.muted}; margin-bottom:4px; }
</style>
</head><body><div id="root">${body}</div>
<script>__KATEX_JS__</script>
<script>
  (function () {
    function renderMath() {
      var nodes = document.querySelectorAll('.blk-math');
      for (var i = 0; i < nodes.length; i++) {
        try {
          window.katex.render(nodes[i].getAttribute('data-latex'), nodes[i],
            { displayMode: true, throwOnError: false });
        } catch (e) { nodes[i].textContent = nodes[i].getAttribute('data-latex'); }
      }
    }
    function postHeight() {
      var h = document.getElementById('root').scrollHeight;
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(String(h));
    }
    renderMath();
    postHeight();
    if (window.ResizeObserver) new ResizeObserver(postHeight).observe(document.getElementById('root'));
    window.addEventListener('load', postHeight);
  })();
</script>
</body></html>`;
}
