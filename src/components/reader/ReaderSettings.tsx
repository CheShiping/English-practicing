'use client';

import { useEffect } from 'react';
import { Minus, Plus, RotateCcw, X, Type, AlignLeft, AlignJustify } from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { cn } from '@/lib/utils';

export default function ReaderSettings({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, resetSettings } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal settings-modal" role="dialog" aria-modal="true" aria-label="阅读排版设置">
        <div className="modal-head">
          <div>
            <span className="eyebrow">Reading comfort</span>
            <h3>阅读排版</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body settings-body">
          <div className="setting-row column">
            <div className="setting-label">
              <Type size={15} /> 主题
            </div>
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
              <button
                onClick={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })}
                aria-label="减小字号"
              >
                <Minus size={14} />
              </button>
              <span>{settings.fontSize}px</span>
              <button
                onClick={() => updateSettings({ fontSize: Math.min(26, settings.fontSize + 1) })}
                aria-label="增大字号"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">行高</div>
            <div className="stepper">
              <button
                onClick={() => updateSettings({ lineHeight: Math.max(1.5, Number((settings.lineHeight - 0.05).toFixed(2))) })}
                aria-label="减小行高"
              >
                <Minus size={14} />
              </button>
              <span>{settings.lineHeight.toFixed(2)}</span>
              <button
                onClick={() => updateSettings({ lineHeight: Math.min(2.3, Number((settings.lineHeight + 0.05).toFixed(2))) })}
                aria-label="增大行高"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="setting-row">
            <div className="setting-label">
              <AlignLeft size={15} /> 版心宽度
            </div>
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
            <div className="setting-label">
              <AlignJustify size={15} /> 两端对齐
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.justify}
                onChange={(e) => updateSettings({ justify: e.target.checked })}
              />
              <span />
            </label>
          </div>

          <div className="settings-divider" />

          <div className="setting-row">
            <div>
              <div className="setting-label">防误触</div>
              <div className="setting-desc">开启后，点词、划句都不会弹出工具条</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.guardMode}
                onChange={(e) => updateSettings({ guardMode: e.target.checked })}
              />
              <span />
            </label>
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-label">高亮生词</div>
              <div className="setting-desc">在正文中给已加入生词本的单词加下划线</div>
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
              <div className="setting-desc">使用浏览器语音朗读单词</div>
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
              <div className="setting-desc">在每段下方显示已有译文（没有译文时可用「翻译」生成）</div>
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
        </div>
        <div className="modal-foot">
          <button className="btn small ghost" onClick={resetSettings}>
            <RotateCcw size={14} /> 恢复默认
          </button>
          <button className="btn small primary" onClick={onClose}>
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
