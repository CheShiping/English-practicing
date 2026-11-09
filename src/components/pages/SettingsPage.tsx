'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Download,
  FileJson,
  Info,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { exportAll, importAll } from '@/lib/storage';
import { hrefFor } from '@/lib/router';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
    refreshFromStorage,
    clearAll,
    toast,
    vocab,
    imported,
    annotations,
    progress,
  } = useApp();
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨读英语-备份-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('备份已导出', 'success');
  };

  const handleImport = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      const r = importAll(String(reader.result || ''));
      setImporting(false);
      if (r.ok) {
        refreshFromStorage();
        toast('备份已恢复，刷新后生效', 'success');
        window.setTimeout(() => window.location.reload(), 800);
      } else {
        toast(r.error || '导入失败', 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="page settings-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Preferences & data</span>
          <h1 className="section-title" style={{ marginTop: 12 }}>
            设置
          </h1>
          <p className="section-sub">调整阅读体验，管理保存在本地的学习数据。</p>
        </div>
        <a className="btn" href={hrefFor('/import')}>
          <Upload size={15} /> 导入文章
        </a>
      </div>

      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-head">
            <h3>阅读偏好</h3>
            <button className="btn small ghost" onClick={resetSettings}>
              <RotateCcw size={13} /> 恢复默认
            </button>
          </div>

          <div className="setting-row column">
            <div className="setting-label">主题</div>
            <div className="theme-options">
              {[
                { key: 'paper', name: '纸感', desc: '暖米色' },
                { key: 'white', name: '纯白', desc: '干净' },
                { key: 'dark', name: '夜间', desc: '护眼' },
              ].map((t) => (
                <button
                  key={t.key}
                  className={cn('theme-option', settings.theme === t.key && 'active')}
                  onClick={() => updateSettings({ theme: t.key as typeof settings.theme })}
                >
                  <span className={`theme-swatch theme-${t.key}`} />
                  <b>{t.name}</b>
                  <span>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">正文字体</div>
            <div className="segmented small">
              <button
                className={settings.fontFamily === 'serif' ? 'active' : ''}
                onClick={() => updateSettings({ fontFamily: 'serif' })}
              >
                衬线
              </button>
              <button
                className={settings.fontFamily === 'sans' ? 'active' : ''}
                onClick={() => updateSettings({ fontFamily: 'sans' })}
              >
                无衬线
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">字号</div>
            <div className="stepper">
              <button onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}>
                <Minus size={14} />
              </button>
              <span>{settings.fontSize}px</span>
              <button onClick={() => updateSettings({ fontSize: Math.min(26, settings.fontSize + 1) })}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">行高</div>
            <div className="stepper">
              <button
                onClick={() =>
                  updateSettings({ lineHeight: Math.max(1.5, Number((settings.lineHeight - 0.05).toFixed(2))) })
                }
              >
                <Minus size={14} />
              </button>
              <span>{settings.lineHeight.toFixed(2)}</span>
              <button
                onClick={() =>
                  updateSettings({ lineHeight: Math.min(2.3, Number((settings.lineHeight + 0.05).toFixed(2))) })
                }
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">版心宽度</div>
            <div className="segmented small">
              {[640, 720, 840].map((w) => (
                <button
                  key={w}
                  className={settings.contentWidth === w ? 'active' : ''}
                  onClick={() => updateSettings({ contentWidth: w })}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-label">两端对齐</div>
              <div className="setting-desc">让正文右边缘更整齐</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={settings.justify} onChange={(e) => updateSettings({ justify: e.target.checked })} />
              <span />
            </label>
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-label">高亮生词</div>
              <div className="setting-desc">在正文中标记已加入生词本的单词</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.highlightVocab}
                onChange={(e) => updateSettings({ highlightVocab: e.target.checked })}
              />
              <span />
            </label>
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-label">点词自动发音</div>
              <div className="setting-desc">使用浏览器语音朗读</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => updateSettings({ autoSpeak: e.target.checked })}
              />
              <span />
            </label>
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-label">正文对照译文</div>
              <div className="setting-desc">每段下方显示已有译文</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.showTranslation}
                onChange={(e) => updateSettings({ showTranslation: e.target.checked })}
              />
              <span />
            </label>
          </div>
        </section>

        <div className="settings-side">
          <section className="settings-card">
            <div className="settings-card-head">
              <h3>
                <Database size={17} /> 数据与备份
              </h3>
            </div>
            <p className="settings-copy">
              所有数据（生词、批注、作答、进度）都保存在当前浏览器的 localStorage 中，不会上传到服务器。
              清除浏览器数据或更换设备前，请先导出备份。
            </p>

            <div className="data-stats">
              <div>
                <b>{vocab.length}</b>
                <span>生词</span>
              </div>
              <div>
                <b>{annotations.length}</b>
                <span>批注</span>
              </div>
              <div>
                <b>{imported.length}</b>
                <span>导入文章</span>
              </div>
              <div>
                <b>{Object.keys(progress).length}</b>
                <span>阅读记录</span>
              </div>
            </div>

            <div className="data-actions">
              <button className="btn" onClick={download}>
                <Download size={14} /> 导出完整备份
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()} disabled={importing}>
                <FileJson size={14} /> 恢复备份
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="danger-zone">
              <div>
                <b>
                  <AlertTriangle size={14} /> 清空全部数据
                </b>
                <span>删除生词、批注、作答、进度与导入文章，无法恢复。</span>
              </div>
              <button
                className="btn small danger"
                onClick={() => {
                  if (window.confirm('确定清空全部本地学习数据吗？此操作无法撤销。建议先导出备份。')) {
                    clearAll();
                    toast('已清空全部数据');
                  }
                }}
              >
                清空
              </button>
            </div>
          </section>

          <section className="settings-card about-card">
            <div className="settings-card-head">
              <h3>
                <Info size={17} /> 关于墨读
              </h3>
            </div>
            <p className="settings-copy">
              墨读英语是一个完全静态的英语精读工具：阅读、查词、批注、做题、复习都在浏览器里完成。
              文章数据来自公开的专升本专项训练材料，词库来自开源 ECDICT。
            </p>
            <ul className="about-list">
              <li>
                <ShieldCheck size={14} /> 无账号、无追踪、无服务器
              </li>
              <li>
                <Download size={14} /> 支持完整备份与恢复
              </li>
              <li>
                <Upload size={14} /> 支持导入自己的 Markdown 文章
              </li>
            </ul>
            <div className="about-footer">
              <a href={hrefFor('/import')}>导入文章</a>
              <a href={hrefFor('/library')}>浏览文章库</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
