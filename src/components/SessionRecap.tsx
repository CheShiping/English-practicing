'use client';

import { useEffect } from 'react';
import { AlarmClock, AlertTriangle, X } from 'lucide-react';
import { useApp } from '@/state/AppProvider';
import { formatDuration } from '@/lib/utils';

/** 离开阅读 / 完型时弹出的本次用时结算框 */
export default function SessionRecapModal() {
  const { sessionRecap, dismissSessionRecap } = useApp();

  useEffect(() => {
    if (!sessionRecap) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissSessionRecap();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sessionRecap, dismissSessionRecap]);

  if (!sessionRecap) return null;

  const reading = sessionRecap.kind === 'reading';
  const unfinished = !reading && !sessionRecap.completed && sessionRecap.answered < sessionRecap.total;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && dismissSessionRecap()}
    >
      <div className="modal recap-modal" role="dialog" aria-modal="true" aria-labelledby="recap-title">
        <div className="modal-head">
          <div>
            <span className="eyebrow">{reading ? 'Reading session' : 'Cloze session'}</span>
            <h3 id="recap-title">{reading ? '本次阅读结束' : unfinished ? '本篇没做完' : '本篇已完成'}</h3>
          </div>
          <button className="icon-btn" onClick={dismissSessionRecap} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body recap-body">
          <div className="recap-time">{formatDuration(sessionRecap.ms)}</div>
          <div className="recap-caption">{reading ? '本次阅读用时' : '本次完型用时'}</div>

          <div className="recap-meter">
            {reading ? (
              <>
                <span>连续阅读 {sessionRecap.passages} 篇</span>
                <span className="recap-meter-ellipsis">最后一篇 · {sessionRecap.label}</span>
              </>
            ) : (
              <>
                <span>
                  已答 {sessionRecap.answered} / {sessionRecap.total} 空
                </span>
                <span className="recap-meter-ellipsis">{sessionRecap.label}</span>
              </>
            )}
          </div>

          {unfinished ? (
            <p className="recap-warn">
              <AlertTriangle size={14} />
              题没做完就退出，本次计时已经停止，不会在后台继续走；重新进入会从 00:00 开始。
            </p>
          ) : (
            <p className="recap-note">
              <AlarmClock size={14} />
              {reading
                ? '计时已清零，下一次进入阅读会自动重新开始。'
                : '本篇计时已停止，重新进入会从 00:00 开始。'}
            </p>
          )}
        </div>

        <div className="modal-foot recap-foot">
          <button className="btn small primary" onClick={dismissSessionRecap}>
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
