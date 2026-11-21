import { api, type Notification } from '../api';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import { dateTime, shortId } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const TYPE_STYLE: Record<string, { icon: string; tone: string }> = {
  ORDER_PLACED: { icon: '🧾', tone: 'info' },
  ORDER_PAID: { icon: '✅', tone: 'success' },
  PAYMENT_FAILED: { icon: '⚠️', tone: 'danger' },
};

export function NotificationsPage() {
  const { data, error, loading, reload } = useAsync(api.notifications, []);

  return (
    <>
      <PageHeader
        title="Thông báo"
        subtitle="notification-service lắng nghe topic order-events và lưu lại cho từng user"
        actions={
          <button className="btn btn-ghost" onClick={() => reload(true)}>
            Làm mới
          </button>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : loading || !data ? (
        <Spinner />
      ) : data.length === 0 ? (
        <EmptyState icon="🔔" title="Chưa có thông báo" description="Đặt một đơn hàng để nhận thông báo đầu tiên." />
      ) : (
        <div className="card list">
          {data.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}
    </>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const style = TYPE_STYLE[n.type] ?? { icon: '🔔', tone: 'neutral' };
  return (
    <div className="list-row notification">
      <span className={`notif-icon tone-${style.tone}`} aria-hidden>
        {style.icon}
      </span>
      <div className="notif-body">
        <div className="notif-title">
          {n.title}
          {n.orderId && <span className="muted small"> · Đơn {shortId(n.orderId)}</span>}
        </div>
        <div className="notif-message">{n.message}</div>
      </div>
      <time className="muted small nowrap" dateTime={n.createdAt}>
        {dateTime(n.createdAt)}
      </time>
    </div>
  );
}
