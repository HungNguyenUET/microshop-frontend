import { useEffect, type ReactNode } from 'react';
import type { OrderStatus, WalletTransaction } from '../api/types';
import { ORDER_STATUS, TX_STATUS, categoryVisual, type Tone } from '../lib/format';

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: 'neutral' as Tone };
  return (
    <Badge tone={s.tone}>
      {status === 'PAYMENT_PROCESSING' && <span className="dot-pulse" aria-hidden />}
      {s.label}
    </Badge>
  );
}

export function TxStatusBadge({ status }: { status: WalletTransaction['status'] }) {
  const s = TX_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Spinner({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>
        {icon}
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-danger">
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-sm" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function ProductThumb({ category, size = 'lg' }: { category: string; size?: 'sm' | 'lg' }) {
  const { icon, hue } = categoryVisual(category);
  return (
    <div className={`thumb thumb-${size}`} style={{ ['--hue' as string]: hue }} aria-hidden>
      <span>{icon}</span>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
