'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  FolderOpen,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { CATEGORIES } from '@/lib/data';
import { parseMarkdownArticles, type ParsedArticle } from '@/lib/parse-markdown';
import { hrefFor, navigate } from '@/lib/router';
import { cn, relativeTime } from '@/lib/utils';

const SAMPLE = `# 健康与医学

Passage 1

Sleep is necessary for good health. During this time, the body recovers from the activities of the previous day.

1. A good title for this text might be ______.
A. Sleep
B. Dreams
C. Good Health
D. Work and Rest
答案：A
解析：全文围绕睡眠的作用展开，其他选项只是细节。

2. The underlined word "drowsy" probably means ______.
A. lazy
B. sleepy
C. relaxed
D. pleased
答案：B
解析：根据最后一段“drinking warm milk will help make you drowsy”可知是“困倦的”。`;

export default function ImportPage() {
  const { imported, addImported, removeImported, toast } = useApp();
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [categoryId, setCategoryId] = useState('auto');
  const [customName, setCustomName] = useState('');
  const [parsed, setParsed] = useState<ParsedArticle[]>([]);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const warnings = useMemo(() => {
    const set = new Set<string>();
    for (const a of parsed) for (const w of a.warnings || []) set.add(w);
    return [...set];
  }, [parsed]);

  useEffect(() => {
    if (!text.trim()) {
      setParsed([]);
      return;
    }
    setParsing(true);
    const t = window.setTimeout(() => {
      try {
        const cat = categoryId === 'auto' ? undefined : categoryId;
        const catName =
          categoryId === 'auto'
            ? undefined
            : categoryId === 'custom'
              ? customName || '自定义'
              : CATEGORIES.find((c) => c.id === categoryId)?.name;
        const arr = parseMarkdownArticles(text, {
          fileName,
          categoryId: cat,
          categoryName: catName,
        });
        setParsed(arr);
      } catch (e) {
        console.error(e);
        setParsed([]);
      }
      setParsing(false);
    }, 320);
    return () => window.clearTimeout(t);
  }, [text, fileName, categoryId, customName]);

  const readFile = (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      toast('请选择 .md 或 .txt 文件', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || ''));
      setFileName(file.name);
      toast('文件已读取，正在解析', 'success');
    };
    reader.readAsText(file, 'utf-8');
  };

  const doImport = () => {
    if (!parsed.length) return;
    addImported(parsed);
    toast(`已导入 ${parsed.length} 篇文章`, 'success');
    const first = parsed[0];
    setText('');
    setParsed([]);
    setFileName('');
    navigate(`/read/${first.id}`);
  };

  const totalWords = parsed.reduce((s, a) => s + a.wordCount, 0);
  const totalQuestions = parsed.reduce((s, a) => s + a.questions.length, 0);

  return (
    <div className="page import-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Bring your own passages</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            导入文章
          </h1>
          <p className="section-sub">
            把你的专项训练、真题或自己找的文章粘进来。支持 Markdown / 纯文本，答案与解析会一起识别。
          </p>
        </div>
        <div className="chip">
          <FileText size={12} /> 已导入 {imported.length} 篇
        </div>
      </div>

      <div className="import-grid">
        <section className="import-left">
          <div
            className={cn('import-drop', dragging && 'dragging')}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) readFile(f);
            }}
          >
            <div className="import-drop-head">
              <div>
                <div className="import-drop-title">
                  <Upload size={16} /> 粘贴内容或拖入文件
                </div>
                <div className="import-drop-sub">
                  支持一次导入多篇（用 Passage 1 / Passage 2 分隔）
                </div>
              </div>
              <button className="btn small" onClick={() => fileRef.current?.click()}>
                <FolderOpen size={14} /> 选择文件
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt,text/markdown,text/plain"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readFile(f);
                  e.target.value = '';
                }}
              />
            </div>

            <textarea
              className="import-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`把文章粘贴到这里…\n\n示例：\nPassage 1\n\nEnglish passage...\n\n1. Question...\nA. ...\nB. ...\n答案：A\n解析：...`}
              spellCheck={false}
            />

            <div className="import-controls">
              <label>
                分类
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="auto">自动识别</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="custom">自定义分类</option>
                </select>
              </label>
              {categoryId === 'custom' && (
                <label>
                  分类名称
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="例如：考研英语"
                  />
                </label>
              )}
              <div className="import-controls-actions">
                <button className="btn small ghost" onClick={() => setText(SAMPLE)}>
                  <Sparkles size={14} /> 填入示例
                </button>
                {text && (
                  <button className="btn small ghost" onClick={() => { setText(''); setParsed([]); }}>
                    <X size={14} /> 清空
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="import-preview">
            <div className="import-preview-head">
              <div>
                <b>解析预览</b>
                <span>
                  {parsing
                    ? '正在解析…'
                    : parsed.length
                      ? `${parsed.length} 篇 · ${totalWords} 词 · ${totalQuestions} 题`
                      : '还没有可预览的内容'}
                </span>
              </div>
              <button className="btn primary small" onClick={doImport} disabled={!parsed.length || parsing}>
                {parsing ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                导入 {parsed.length ? `(${parsed.length})` : ''}
              </button>
            </div>

            {warnings.length > 0 && (
              <div className="import-warnings">
                <Info size={14} />
                <div>
                  {warnings.slice(0, 5).map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              </div>
            )}

            {parsed.length === 0 ? (
              <div className="import-empty">
                <FileText size={24} />
                <p>在左侧粘贴文章后，这里会显示识别结果。</p>
              </div>
            ) : (
              <div className="import-list">
                {parsed.map((a) => (
                  <div className="import-item" key={a.id}>
                    <div className="import-item-top">
                      <span className="tag">{a.catName}</span>
                      <span className="import-item-meta">
                        {a.wordCount} words · {a.questions.length} 题
                      </span>
                    </div>
                    <b>{a.title}</b>
                    <p>{a.fallbackTitle}</p>
                    {a.questions.length > 0 && (
                      <span className="import-item-q">
                        已识别答案 {a.questions.filter((q) => q.answer).length} / {a.questions.length}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="import-right">
          <div className="import-guide">
            <h3>格式说明</h3>
            <p>不需要严格排版，只要保持“文章 → 题目 → 选项”的顺序即可。</p>
            <pre>{`# 健康与医学

Passage 1

English passage...

1. Question ______.
A. Option A
B. Option B
C. Option C
D. Option D
答案：A
解析：在原文第 2 段...`}</pre>
            <ul>
              <li>用 <code>Passage 1</code> 或 <code>## Passage 1</code> 分隔多篇。</li>
              <li>题目以 <code>1.</code> 开头，选项以 <code>A.</code> 开头。</li>
              <li><code>答案：A</code> 与 <code>解析：…</code> 可选；没有答案也能导入为练习。</li>
              <li>用 <code>-</code> 或 <code>*</code> 开头的行会显示为列表。</li>
            </ul>
          </div>

          <div className="imported-manage">
            <div className="imported-manage-head">
              <h3>已导入的文章</h3>
              <span>{imported.length} 篇</span>
            </div>
            {imported.length === 0 ? (
              <p className="imported-empty">还没有导入过文章。</p>
            ) : (
              <div className="imported-list">
                {imported.map((a) => (
                  <div className="imported-item" key={a.id}>
                    <a href={hrefFor(`/read/${a.id}`)}>
                      <BookOpen size={14} />
                      <span>
                        <b>{a.title}</b>
                        <small>
                          {a.catName} · {a.wordCount} 词 · {relativeTime(a.addedAt || Date.now())}
                        </small>
                      </span>
                    </a>
                    <button
                      onClick={() => {
                        if (window.confirm(`删除《${a.title}》？相关批注与作答记录不会自动删除。`)) {
                          removeImported(a.id);
                          toast('已删除导入文章');
                        }
                      }}
                      aria-label="删除导入文章"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="imported-tip">
              导入的文章保存在浏览器本地，换设备请先在「设置」里导出备份。
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
