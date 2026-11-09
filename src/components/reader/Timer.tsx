'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlarmClock,
  GripVertical,
  Pause,
  Play,
  RotateCcw,
  Timer,
  X,
  EyeOff,
} from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { cn, formatDuration } from '@/lib/utils';

const PRESETS = [5, 10, 15, 20, 25, 30, 45, 60];

export function TimerModal({ onClose }: { onClose: () => void }) {
  const { timer, timerElapsed, timerRemaining, startTimer, pauseTimer, resumeTimer, resetTimer } = useApp();
  const [mode, setMode] = useState<'up' | 'down'>(timer.mode === 'down' ? 'down' : 'up');
  const [minutes, setMinutes] = useState(() => {
    if (timer.mode === 'down' && timer.totalMs) return Math.round(timer.totalMs / 60000);
    return 15;
  });
  const [custom, setCustom] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const running = timer.status === 'running';
  const paused = timer.status === 'paused';
  const active = running || paused;

  const start = () => {
    if (mode === 'up') startTimer('up', 0);
    else {
      const mins = custom ? Number(custom) : minutes;
      if (!mins || mins < 1) return;
      startTimer('down', mins * 60000);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal timer-modal" role="dialog" aria-modal="true" aria-label="计时器">
        <div className="modal-head">
          <div>
            <span className="eyebrow">Focus timer</span>
            <h3>阅读计时</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {active ? (
            <div className="timer-live">
              <div className="timer-live-time">
                {formatDuration(timer.mode === 'down' ? timerRemaining : timerElapsed)}
              </div>
              <div className="timer-live-label">
                {timer.mode === 'down' ? `倒计时 · 剩余（共 ${Math.round(timer.totalMs / 60000)} 分钟）` : '正计时'}
                {timer.status === 'paused' ? ' · 已暂停' : ' · 进行中'}
              </div>
              <div className="timer-live-actions">
                {running ? (
                  <button className="btn primary" onClick={pauseTimer}>
                    <Pause size={15} /> 暂停
                  </button>
                ) : (
                  <button className="btn primary" onClick={resumeTimer}>
                    <Play size={15} /> 继续
                  </button>
                )}
                <button
                  className="btn"
                  onClick={() => {
                    resetTimer();
                    onClose();
                  }}
                >
                  <RotateCcw size={15} /> 结束计时
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="segmented timer-mode">
                <button className={mode === 'up' ? 'active' : ''} onClick={() => setMode('up')}>
                  正计时 <small>累计用时</small>
                </button>
                <button className={mode === 'down' ? 'active' : ''} onClick={() => setMode('down')}>
                  倒计时 <small>限时完成</small>
                </button>
              </div>

              {mode === 'down' && (
                <div className="timer-duration">
                  <div className="timer-label">选择时长</div>
                  <div className="timer-presets">
                    {PRESETS.map((m) => (
                      <button
                        key={m}
                        className={cn('timer-preset', !custom && minutes === m && 'active')}
                        onClick={() => {
                          setMinutes(m);
                          setCustom('');
                        }}
                      >
                        {m} 分
                      </button>
                    ))}
                  </div>
                  <label className="timer-custom">
                    自定义
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      placeholder="分钟"
                    />
                    分钟
                  </label>
                </div>
              )}

              <p className="timer-tip">
                <AlarmClock size={14} /> 计时器会以悬浮卡片显示，可暂停、隐藏，离开页面也不会丢失。
              </p>
            </>
          )}
        </div>
        {!active && (
          <div className="modal-foot">
            <span className="modal-hint">建议每篇阅读 15–25 分钟</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn small ghost" onClick={onClose}>
                取消
              </button>
              <button className="btn small primary" onClick={start}>
                <Play size={14} /> 开始计时
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TimerWidget({ onOpen }: { onOpen: () => void }) {
  const { timer, timerElapsed, timerRemaining, pauseTimer, resumeTimer, resetTimer, hideTimer } = useApp();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (pos) return;
    setPos({ x: 20, y: Math.max(80, window.innerHeight - 190) });
  }, [pos]);

  if (timer.status === 'idle' || timer.hidden || !pos) return null;
  const running = timer.status === 'running';
  const done = timer.status === 'done';

  const onPointerDown = (e: React.PointerEvent) => {
    const el = e.currentTarget.parentElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const x = Math.min(Math.max(8, e.clientX - drag.current.dx), window.innerWidth - 190);
    const y = Math.min(Math.max(8, e.clientY - drag.current.dy), window.innerHeight - 120);
    setPos({ x, y });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div
      className={cn('timer-float', done && 'done')}
      style={{ left: pos.x, top: pos.y }}
      role="timer"
      aria-label="阅读计时器"
    >
      <div
        className="timer-float-head"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="timer-float-grip">
          <GripVertical size={13} />
        </span>
        <Timer size={13} />
        <span>{timer.mode === 'down' ? '倒计时' : '正计时'}</span>
        <button
          className="timer-mini"
          onClick={() => hideTimer(true)}
          aria-label="隐藏计时器"
          title="隐藏计时器"
        >
          <EyeOff size={13} />
        </button>
      </div>
      <button className="timer-float-time" onClick={onOpen} title="点开计时设置">
        {formatDuration(timer.mode === 'down' ? timerRemaining : timerElapsed)}
      </button>
      <div className="timer-float-actions">
        {done ? (
          <button onClick={resetTimer}>
            <RotateCcw size={13} /> 结束
          </button>
        ) : running ? (
          <button onClick={pauseTimer}>
            <Pause size={13} /> 暂停
          </button>
        ) : (
          <button onClick={resumeTimer}>
            <Play size={13} /> 继续
          </button>
        )}
        <button
          onClick={() => {
            resetTimer();
            hideTimer(false);
          }}
        >
          <X size={13} /> 关闭
        </button>
      </div>
    </div>
  );
}
