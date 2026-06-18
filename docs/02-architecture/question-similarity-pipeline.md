# 题干提取与相似题匹配方案

**版本：** v3.0  
**更新：** 2026-05-17  
**前提（已修订）：** 题目来源**同时包含电子书 PDF 和扫描版 PDF**，且以扫描版为主（特别是日本习題集）。OCR 数字化是 Ask AI 功能的前提条件，不可省略。

---

## 0. 核心前提修订：混合来源现实

### 0.1 两类来源的现实比例

| 来源类型 | 典型例子 | 占比估算 | 处理路径 |
|---------|---------|---------|---------|
| **电子书 PDF**（有文字层） | 大学官方公开入試问题、部分教科书 | ~30% | PyMuPDF 直接提取 |
| **扫描版 PDF**（纯图像，无文字层） | 日本市贩习題集（例：大学院への数学、院試突破シリーズ）、老旧试卷扫描 | ~70% | OCR 流水线 |

> **重要修正：** v2.0 假设所有来源为电子书，这是错误的。日本市面流通的习題集（参考书）本质上大多是扫描版，即使封面显示为 PDF 格式，内部仍是图像页面，PyMuPDF 提取的文字为空或乱码。

### 0.2 如何自动判断 PDF 类型

```python
import fitz  # PyMuPDF

def detect_pdf_type(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    total_chars = 0
    for page in doc:
        total_chars += len(page.get_text("text").strip())
    doc.close()

    # 若全文字符数 < 100，判定为扫描版
    if total_chars < 100:
        return "scanned"
    return "electronic"
```

自动检测后分叉进入不同处理流水线。

### 0.3 为什么 OCR 是 Ask AI 功能的前置条件

Ask AI 功能的核心是：用户指向某道题，AI 给出解题思路。这要求后端已经持有：
1. **题目原文**（OCR 后的文字）—— AI 读取题目内容
2. **参考解法**（人工录入或 OCR 后校对）—— AI 参考正确解法给出讲解
3. **页码 / 索引位置**（所在书的第几页，第几题）—— 用于引用来源

如果题目只有原始 PDF 页面截图（`original_image_url`），没有文字内容，则每次 Ask AI 都需要临时把图片发给视觉模型识别，成本高（~$0.01/次）且延迟大（3-5秒）。**预先 OCR 是一次性成本，换取所有后续 Ask AI 零识别延迟。**

---

## 1. 数据结构设计（v3.0）

### 1.1 题目表（questions）— 增加解法和来源字段

```sql
-- 原有字段（保留）
body_text          TEXT         -- 题干纯文本（OCR 或直接提取），用于全文检索 / embedding
original_image_url TEXT         -- 原版 PDF 页面截图（"查看原版" 用）
embedding          vector(1536) -- 向量，pgvector 存储
subject            TEXT
year               INTEGER
university_id      TEXT
difficulty_label   TEXT

-- v2.0 新增字段（保留）
body_markdown      TEXT         -- 题干 Markdown（含公式占位符）
content_blocks     JSONB        -- 结构化内容块（前端按块渲染）
formula_images     TEXT[]       -- 公式图片 URL 数组（S3）
diagram_urls       TEXT[]       -- 说明图 URL 数组（S3）
page_range         TEXT         -- 题目所在原书页码范围，如 "p.42-43"
source_pdf_key     TEXT         -- S3 原始 PDF key
embedding_text     TEXT         -- 实际 embedding 输入（调试用）

-- v3.0 新增字段
pdf_type           TEXT         -- 'electronic' | 'scanned'
ocr_confidence     FLOAT        -- OCR 平均置信度（0-1），低于 0.8 需人工校对
needs_review       BOOLEAN      -- 自动处理存疑，需人工确认
solution_text      TEXT         -- 解法纯文本（OCR 后校对，或人工录入）
solution_blocks    JSONB        -- 解法结构化内容块（同 content_blocks 格式）
source_type        TEXT         -- 'exam_paper' | 'textbook'（入試试卷 vs 习題集）
source_book_id     TEXT         -- 若来自习題集，对应 reference_books.id
source_page        INTEGER      -- 来源页码（精确到页）
source_question_index INTEGER   -- 该页第几道题（用于精确定位）
```

### 1.2 content_blocks / solution_blocks 格式（不变）

```json
[
  { "type": "text",  "content": "次の行列 A について以下の問いに答えよ。" },
  { "type": "math",  "latex": "A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}", "image_url": "https://cdn.kakomon.app/formulas/q001_f1.png" },
  { "type": "text",  "content": "(1) A の固有値をすべて求めよ。" },
  { "type": "image", "url": "https://cdn.kakomon.app/diagrams/q001_d1.png", "caption": "図1" }
]
```

`type` 枚举：`text` / `math` / `image` / `table`

### 1.3 习題集参考书表（reference_books）— 新增

```sql
CREATE TABLE reference_books (
  id              TEXT PRIMARY KEY,   -- 例："daigakuin_suugaku_2024"
  title           TEXT NOT NULL,      -- 书名（日文）
  title_cn        TEXT,               -- 中文译名（可选）
  publisher       TEXT,               -- 出版社
  edition         INTEGER,            -- 版次
  year            INTEGER,            -- 出版年
  subject         TEXT,               -- 对应科目
  isbn            TEXT,               -- ISBN（可选）
  total_pages     INTEGER,
  source_pdf_key  TEXT,               -- S3 原始 PDF key
  pdf_type        TEXT,               -- 'electronic' | 'scanned'
  ocr_status      TEXT DEFAULT 'pending',  -- 'pending' | 'processing' | 'done' | 'failed'
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 参考书页面索引表
CREATE TABLE reference_book_pages (
  id              BIGSERIAL PRIMARY KEY,
  book_id         TEXT REFERENCES reference_books(id),
  page_number     INTEGER NOT NULL,
  page_image_url  TEXT,               -- 该页截图（S3）
  page_text       TEXT,               -- OCR 后的完整页面文本
  ocr_confidence  FLOAT,
  question_count  INTEGER,            -- 该页包含题目数量
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. PDF 处理流水线（v3.0 双路径）

### 2.1 整体流程

```
原始 PDF（来源不明）
    │
    ▼
[Step 0] 类型检测
    ├── detect_pdf_type() → 'electronic'
    │       └──────────────────────────────► 路径 A（电子书流水线）
    └── detect_pdf_type() → 'scanned'
            └──────────────────────────────► 路径 B（扫描版 OCR 流水线）
```

---

### 路径 A：电子书流水线（~30% 来源）

```
电子书 PDF
    │
    ▼
[A1] PyMuPDF 解析
    ├── 提取文本块（含坐标）
    ├── 提取内嵌图像（含坐标）
    └── 生成页面渲染图（原版预览用）
    │
    ▼
[A2] 题号切分
    └── 正则识别题号边界 → 按边界切分为独立题目
    │
    ▼
[A3] 内容块组装
    ├── 文本块 → text block
    └── 内嵌图像 → 判断公式图 / 说明图 → 上传 S3
    │
    ▼
[A4] 生成 body_text + body_markdown + content_blocks
    │
    ▼
[A5] 生成 embedding
    │
    ▼
[A6] 写入数据库（pdf_type='electronic'）
```

---

### 路径 B：扫描版 OCR 流水线（~70% 来源）

```
扫描版 PDF
    │
    ▼
[B1] 页面渲染（PDF → 高分辨率图像）
    └── PyMuPDF 每页渲染为 300 DPI PNG
    │
    ▼
[B2] OCR 文字识别（日文 + 数学公式混合）
    ├── 普通文字区域 → Google Vision API（支持日文，$1.5/1000页）
    ├── 数学公式区域 → MathPix API（返回 LaTeX，~$0.004/次）
    └── 备选：Tesseract + jpn 语言包（免费，精度约 85%，推荐开发调试用）
    │
    ▼
[B3] 置信度评估
    ├── confidence ≥ 0.85 → 自动通过
    └── confidence < 0.85 → 标记 needs_review=true → 人工校对队列
    │
    ▼
[B4] 题号切分（同路径 A2）
    │
    ▼
[B5] 内容块组装（同路径 A3）
    ├── OCR 文字 → text block
    ├── 识别出的 LaTeX → math block
    └── 说明图（整体扫描图中的插图区域）→ 裁切 → 上传 S3 → image block
    │
    ▼
[B6] 生成 body_text + solution_text（重点，见 §2.3）
    │
    ▼
[B7] 生成 embedding
    │
    ▼
[B8] 写入数据库（pdf_type='scanned', ocr_confidence=avg_confidence）
    └── 同时写入 reference_book_pages（逐页索引）
```

### 2.2 OCR 工具选型

| 工具 | 日文支持 | 数学公式 | 成本 | 推荐用途 |
|------|---------|---------|------|---------|
| **Google Vision API** | 优秀 | 一般（识别为图像区域） | $1.5/1000页 | 普通文字 OCR，主力 |
| **MathPix API** | 良好 | 最强（LaTeX 输出） | ~$0.004/公式 | 数学公式区域，按需调用 |
| **Tesseract (jpn)** | 良好（85%） | 差 | 免费，自部署 | 开发调试、低成本预处理 |
| **Claude Vision** | 优秀 | 良好（描述性） | 按 token 计费 | 复杂排版理解、人工校对辅助 |

**推荐组合策略：**
1. 先用 Tesseract 粗识别（免费），判断页面是否有复杂公式
2. 普通文字页 → Google Vision API
3. 含公式密集的页 → MathPix（整页模式）
4. 置信度低的页 → 发给 Claude Vision 二次识别 + 写出人工校对任务

### 2.3 解法内容的存储

习題集的每道题通常包含两部分：**题目**和**解答**，它们在 PDF 中的位置：
- 同页（题目在上，解答在下）
- 不同页（题目在前半册，解答在后半册）

```python
# ingest_questions.py 中的切分逻辑示例
def split_question_and_solution(page_text: str) -> tuple[str, str]:
    """
    常见分隔词：解答、解、【解】、Solution、【解説】
    """
    import re
    patterns = [
        r'【解答】', r'【解】', r'解答[:：]', r'【解説】',
        r'\[解\]', r'Solution\s*[:：]',
    ]
    for pattern in patterns:
        m = re.search(pattern, page_text)
        if m:
            return page_text[:m.start()].strip(), page_text[m.start():].strip()
    return page_text.strip(), ""  # 没有找到解答分隔词
```

`solution_text` 和 `solution_blocks` 的用途：
- **Ask AI 功能**：系统提示中包含 `solution_text`，让 AI 参考正确解法讲解，而不是凭空生成
- **不暴露给用户**：前端默认不展示 `solution_text`，仅作为 AI 上下文
- **Pro 功能**：未来可解锁"查看解答"功能，直接展示 `solution_blocks`

### 2.4 页码与索引位置追踪

每道题入库时必须记录精确的来源位置，用于：
1. Ask AI 时告知 AI 参考哪本书的哪一页
2. 未来"查看原版"功能定位到具体页
3. 用户上传贡献时去重检测

```sql
-- questions 表中的来源字段组合
source_type            = 'textbook'
source_book_id         = 'daigakuin_suugaku_vol1_2023'
source_page            = 42            -- PDF 页码（从1开始）
source_question_index  = 2             -- 该页第2道题
page_range             = 'p.42'        -- 展示给用户的友好格式

-- 入試试卷（source_type='exam_paper'）无需 source_book_id
-- university_id + year + subject 已能唯一定位
```

### 2.5 题号切分（核心难点）

```python
import re

# 常见题号模式（按优先级）
QUESTION_PATTERNS = [
    r'^問\s*\d+',              # 問1, 問2
    r'^第\s*\d+\s*問',         # 第1問
    r'^\d+\s*[．\.]\s*',       # 1. 2.
    r'^\(\s*\d+\s*\)',         # (1) (2)
    r'^[①②③④⑤⑥⑦⑧⑨⑩]',      # ① ②
    r'^例題\s*\d+',            # 例題1（习題集常见）
    r'^練習\s*\d+',            # 練習1
    r'^基本問題\s*\d+',        # 基本問題1
]

# 说明图识别（需要跳过，不当作题目切分点）
FIGURE_PATTERNS = [
    r'^図\s*\d+',              # 図1
    r'^\[図\]',
]
```

边界检测策略：
1. OCR 输出中用行坐标（y 轴）判断段落间距
2. 正则匹配题号
3. 无法自动切分 → 标记 `needs_review=true`，进入人工校对队列

---

## 3. 前端渲染方案（不变，保留 v2.0）

### 3.1 按块渲染

```tsx
// src/components/question/QuestionBody.tsx
function QuestionBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <View style={{ gap: 8 }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <Text key={i} style={styles.bodyText}>{block.content}</Text>;
          case 'math':
            return block.latex
              ? <MathView key={i} math={block.latex} />
              : <Image key={i} source={{ uri: block.image_url }} style={styles.formula} />;
          case 'image':
            return (
              <View key={i}>
                <Image source={{ uri: block.url }} style={styles.diagram} resizeMode="contain" />
                {block.caption && <Text style={styles.caption}>{block.caption}</Text>}
              </View>
            );
        }
      })}
    </View>
  );
}
```

### 3.2 数学公式渲染库

| 库 | 渲染方式 | 推荐 |
|----|---------|------|
| `react-native-math-view` | 原生 MathJax/KaTeX | V2 推荐 |
| 服务端预渲染 SVG/PNG | 静态图片 | **V1 推荐**（最稳定） |

### 3.3 原版扫描图

`original_image_url` → 题目详情页的"查看原版"Modal（已在 `questions/[id].tsx` 实现）。

---

## 4. 相似题匹配策略（不变，保留 v2.0）

### 4.1 三层漏斗架构

```
全题库
    │
    ▼ Layer 1：元数据过滤（毫秒级）
    ├── subject = 目标题 subject
    └── knowledge_points ∩ 目标题 knowledge_points ≠ ∅
    │
    ▼ Layer 2：关键词匹配（毫秒级，GIN 索引）
    └── body_text 全文相似（pg_bigm，适合日文）
    │
    ▼ Layer 3：向量相似排序（~10ms，pgvector ANN）
    └── cosine_distance(embedding, 目标题 embedding) ORDER BY ASC LIMIT 10
    │
    ▼ 输出：按相似度分级
    ├── L1（cosine < 0.12）：同题 / 完全相同考点
    ├── L2（0.12-0.35）：相似考点 / 同父概念
    └── L3（0.35-0.55）：跨校相似题（Pro 功能）
```

### 4.2 Embedding 文本组合

```python
def build_embedding_text(question: dict) -> str:
    kp = " ".join(question["knowledge_points"])
    subject = question["subject"]
    body = question["body_text"][:800]
    formula_desc = question.get("formula_description", "")
    return f"[{subject}] [{kp}] {body} {formula_desc}"
```

### 4.3 Embedding 模型选择

| 模型 | 日语支持 | 成本 | 推荐 |
|------|---------|------|------|
| `text-embedding-3-large`（OpenAI）| 优秀 | $0.13/M tokens | ✅ V1 推荐 |
| `multilingual-e5-large`（开源）| 良好 | 自部署 | 成本敏感时 |

### 4.4 pgvector 配置

```sql
CREATE INDEX ON questions USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

WITH target AS (
  SELECT embedding FROM questions WHERE id = $1
)
SELECT
  q.id, q.title, q.university_id, q.subject, q.year,
  1 - (q.embedding <=> t.embedding) AS similarity
FROM questions q, target t
WHERE q.id != $1
  AND q.subject = $2
ORDER BY q.embedding <=> t.embedding
LIMIT 20;
```

### 4.5 相似度阈值

```python
def classify_similarity(cosine_distance: float) -> int | None:
    if cosine_distance < 0.12:  return 1   # L1 同题
    if cosine_distance < 0.35:  return 2   # L2 相似
    if cosine_distance < 0.55:  return 3   # L3 跨校
    return None
```

---

## 5. 摄入工具（Admin Pipeline v3.0）

```
backend/scripts/ingest_questions.py

用法（电子书）：
  python ingest_questions.py \
    --pdf path/to/todai_2024_math.pdf \
    --university_id todai \
    --year 2024 \
    --subject 数学 \
    --source_type exam_paper

用法（习題集扫描版）：
  python ingest_questions.py \
    --pdf path/to/daigakuin_suugaku_vol1.pdf \
    --book_id daigakuin_suugaku_vol1_2023 \
    --subject 数学 \
    --source_type textbook \
    --ocr                         # 强制走 OCR 路径

功能（通用）：
  1. detect_pdf_type() → 自动选路径 A 或 B
  2. 若扫描版：逐页渲染 PNG → OCR（Google Vision + MathPix）
  3. 自动切分题号 + 解答区域（输出预览供人工确认）
  4. 提取图像 → 上传 S3
  5. 生成 content_blocks + solution_blocks + body_text + solution_text
  6. 调用 embedding API
  7. 写入 Postgres（questions + reference_book_pages）
  8. 输出 needs_review 列表
```

人工校对界面（V2）：简单 Web UI 展示 OCR 结果与原图对比，支持手动修正文字和题目边界。

---

## 6. 成本估算（OCR 规模化）

假设初期入库 **5000 道题**（含 3500 道来自扫描版）：

| 成本项 | 单价 | 数量估算 | 小计 |
|-------|------|---------|------|
| Google Vision API（页面 OCR） | $1.5/1000页 | 3500 题 × 平均 1.5 页 ≈ 5250 页 | ~$8 |
| MathPix API（公式识别） | $0.004/次 | 3500 题 × 平均 5 个公式 ≈ 17500 次 | ~$70 |
| OpenAI Embedding | $0.13/M tokens | 5000 题 × 300 tokens ≈ 1.5M tokens | ~$0.2 |
| S3 存储（图像） | $0.023/GB/月 | 估算 50GB | ~$1.15/月 |
| **一次性 OCR 合计** | | | **~$78** |

**结论：** 初期 OCR 成本极低（不足 $100），是完全可以接受的一次性投入。相比每次 Ask AI 临时发图识别（$0.01/次 × 每天 N 次），提前 OCR 在几千次调用后即可回本，且响应速度提升 5-10 倍。

---

## 7. 可行性评估（v3.0 更新）

| 模块 | 技术难度 | 开发工时估算 | 风险点 |
|------|---------|-------------|-------|
| PDF 类型自动检测 | 低 | 0.5天 | - |
| 电子书文字提取（PyMuPDF）| 低 | 1-2天 | 电子书加密保护 |
| 扫描版页面渲染 | 低 | 0.5天 | - |
| Google Vision OCR 集成 | 低 | 1天 | API 密钥、日文识别调优 |
| MathPix 公式识别集成 | 低 | 1天 | 成本控制、公式区域裁切 |
| OCR 置信度评估 + 人工校对队列 | 中 | 1天 | - |
| 题号自动切分 | 中 | 3-5天 | 各校/各书格式不统一，正则维护量大 |
| 解答区域分离（solution_text） | 中 | 2天 | 部分书答案在独立附录，需单独处理 |
| reference_books 表 + 页码索引 | 低 | 1天 | - |
| content_blocks + solution_blocks 入库 | 低 | 1天 | - |
| pgvector + embedding | 中 | 2天 | - |
| 相似题查询 API | 低 | 1天 | 阈值调参 |
| 前端 content_blocks 渲染 | 中 | 2天 | 数学公式渲染库兼容性 |
| **合计** | | **~17-20天** | |

**主要风险：**
1. 各习題集的题目/解答分隔方式不统一（有的在同页，有的在附录），需对主要书目分别适配切分逻辑
2. 扫描版图像质量参差不齐（旧书扫描质量低），置信度低的题目需人工校对投入
3. 数学公式密集的页面（如线性代数），MathPix 费用会高于预估

**建议先用 1-2 本代表性习題集验证完整流程，再批量处理。**

---

## 8. 分阶段落地计划（v3.0 更新）

### Phase A（2周）：最小可用版
1. PDF 类型检测 → 分路径
2. 电子书：PyMuPDF 提取 `body_text` + 内嵌图像
3. 扫描版：Google Vision OCR → `body_text`（暂不处理公式）
4. 手动辅助切分（先不全自动）
5. 图像上传 S3，页码字段填写
6. 基于知识点 + body_text 关键词匹配（Layer 1 + 2）
7. 前端用 `body_text` + 图片展示

### Phase B（+2周）：向量搜索 + Ask AI 基础
1. 生成 embedding，写入 pgvector
2. 相似题 3 级分类上线
3. OCR `solution_text` 入库（人工校对主要书目）
4. Ask AI 功能接入 `solution_text` 作为系统提示上下文

### Phase C（+2周）：公式渲染 + 自动化
1. MathPix 转 LaTeX → `content_blocks.math.latex`
2. 服务端 LaTeX → PNG，前端 `Image` 展示
3. 自动切分脚本正则覆盖主要学校 + 主要习題集格式
4. OCR 人工校对 Web UI 上线

---

## 9. 待确认事项（v3.0 更新）

- [ ] 主要习題集书目清单是否已确定？（直接影响切分规则的适配优先级）
- [ ] 解答部分在各书中的位置规律？（同页、附录、独立答案册？）
- [ ] 电子书 PDF 是否有版权加密？（需实测 PyMuPDF 能否读取）
- [ ] 扫描版图像分辨率是否足够？（低于 150 DPI 的 OCR 准确率会显著下降）
- [ ] 数学公式在电子书中是文字编码还是嵌入图像？（取一份样本用 PyMuPDF 检查）
- [ ] OCR 预算上限？（按 §6 估算 5000 题约 $78，是否可接受）
- [ ] Ask AI 功能的 `solution_text` 需要人工校对到什么程度？（85% 准确率够用还是要 99%？）
- [ ] 是否需要支持中文题目（部分中国大学资料）？
