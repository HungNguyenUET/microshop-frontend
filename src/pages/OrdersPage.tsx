import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Order } from '../api';
import { EmptyState, ErrorState, OrderStatusBadge, PageHeader, Spinner } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { dateTime, shortId, vnd } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const POLL_INTERVAL = 800;
const POLL_MAX_ATTEMPTS = 40; // ~30s: qua lau thi co the payment-service dang dung (xem lab "Kafka ben vung")

export function OrdersPage() {
  const toast = useToast();
  const { refreshBalance } = useSession();
  const { data: orders, setData, error, loading, reload } = useAsync(api.orders, []);
  const [paying, setPaying] = useState<string | null>(null);
  const attempts = useRef(new Map<string, number>());
  const [stalled, setStalled] = useState<ReadonlySet<string>>(new Set());
  const unstall = (id: string) => setStalled((set) => new Set([...set].filter((x) => x !== id)));

  const replace = (order: Order) => setData((list) => list?.map((o) => (o.id === order.id ? order : o)) ?? null);

  // Thanh toan BAT DONG BO: POST tra 202, ket qua den qua Kafka -> polling GET /api/orders/{id}
  const processing = orders?.filter((o) => o.status === 'PAYMENT_PROCESSING').map((o) => o.id) ?? [];
  const processingKey = processing.join(',');

  useEffect(() => {
    if (!processingKey) return;
    const ids = processingKey.split(',');
    const timer = setInterval(async () => {
      for (const id of ids) {
        const n = (attempts.current.get(id) ?? 0) + 1;
        attempts.current.set(id, n);
        if (n > POLL_MAX_ATTEMPTS) {
          if (n === POLL_MAX_ATTEMPTS + 1) setStalled((set) => new Set(set).add(id));
          continue;
        }
        try {
          const order = await api.order(id);
          if (order.status === 'PAYMENT_PROCESSING') continue;
          attempts.current.delete(id);
          unstall(id);
          replace(order);
          void refreshBalance();
          if (order.status === 'PAID') toast.success(`Đơn ${shortId(id)} đã thanh toán thành công`);
          else toast.error(`Đơn ${shortId(id)}: ${order.failureReason ?? 'thanh toán thất bại'}`);
        } catch {
          /* thu lai o lan sau */
        }
      }
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processingKey]);

  async function pay(order: Order) {
    setPaying(order.id);
    try {
      const updated = await api.pay(order.id);
      attempts.current.set(order.id, 0);
      unstall(order.id);
      replace(updated);
      toast.info('Đã gửi yêu cầu thanh toán, đang chờ payment-service xử lý...');
    } catch (e) {
      toast.error(e);
    } finally {
      setPaying(null);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => reload()} />;
  if (loading || !orders) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Đơn hàng"
        subtitle="Thanh toán xử lý bất đồng bộ qua Kafka: order → payment → order"
        actions={
          <button
            className="btn btn-ghost"
            onClick={() => {
              attempts.current.clear();
              setStalled(new Set());
              void reload(true);
            }}
          >
            Làm mới
          </button>
        }
      />
      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Chưa có đơn hàng"
          action={
            <Link to="/" className="btn btn-primary">
              Mua sắm ngay
            </Link>
          }
        />
      ) : (
        <div className="stack">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              paying={paying === o.id}
              stalled={stalled.has(o.id)}
              onPay={() => pay(o)}
            />
          ))}
        </div>
      )}
    </>
  );
}

const STEPS = ['Đặt hàng', 'Thanh toán', 'Hoàn tất'];

function stepOf(order: Order) {
  switch (order.status) {
    case 'PENDING_PAYMENT':
      return { current: 1, failed: false };
    case 'PAYMENT_PROCESSING':
      return { current: 1, failed: false };
    case 'PAYMENT_FAILED':
      return { current: 1, failed: true };
    case 'PAID':
      return { current: 3, failed: false };
  }
}

function OrderCard({
  order,
  paying,
  stalled,
  onPay,
}: {
  order: Order;
  paying: boolean;
  stalled: boolean;
  onPay: () => void;
}) {
  const canPay = order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_FAILED';
  const { current, failed } = stepOf(order);

  return (
    <article className="card order-card">
      <div className="order-head">
        <div>
          <div className="order-id">Đơn {shortId(order.id)}</div>
          <div className="muted small">{dateTime(order.createdAt)}</div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ol className="steps" aria-label="Tiến trình đơn hàng">
        {STEPS.map((label, i) => {
          const state = i < current ? 'done' : i === current ? (failed ? 'failed' : 'current') : 'todo';
          return (
            <li key={label} className={`step step-${state}`}>
              <span className="step-dot" />
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      <ul className="order-items">
        {order.items.map((i) => (
          <li key={i.productId}>
            <span>
              {i.productName} <span className="muted">× {i.quantity}</span>
            </span>
            <span>{vnd(Number(i.unitPrice) * i.quantity)}</span>
          </li>
        ))}
      </ul>

      {order.failureReason && <div className="alert alert-danger small">{order.failureReason}</div>}
      {order.status === 'PAYMENT_PROCESSING' && stalled && (
        <div className="alert alert-warning small">
          Chưa nhận được kết quả từ payment-service. Event vẫn nằm chờ trong Kafka, hãy bấm "Làm mới" sau.
        </div>
      )}

      <div className="order-foot">
        <span>
          Tổng: <b className="price">{vnd(order.totalAmount)}</b>
        </span>
        {canPay && (
          <button className="btn btn-primary" onClick={onPay} disabled={paying}>
            {paying ? 'Đang gửi...' : order.status === 'PAYMENT_FAILED' ? 'Thanh toán lại' : 'Thanh toán'}
          </button>
        )}
      </div>
    </article>
  );
}
