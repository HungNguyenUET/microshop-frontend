import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Cart, type CartLine } from '../api';
import { EmptyState, ErrorState, PageHeader, ProductThumb, Spinner } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { shortId, vnd } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export function CartPage() {
  const { setCartCount, balance } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const { data: cart, setData, error, loading, reload } = useAsync(api.cart, []);
  // CartLine khong co category -> lay tu product-service (public) de hien icon
  const { data: catalog } = useAsync(() => api.products('', 0, 100), []);
  const [busy, setBusy] = useState<string | null>(null);

  const categoryOf = (productId: string) => catalog?.content.find((p) => p.id === productId)?.category ?? '';

  function apply(next: Cart) {
    setData(next);
    setCartCount(next.items.reduce((n, i) => n + i.quantity, 0));
  }

  async function mutate(key: string, action: () => Promise<Cart | void>) {
    setBusy(key);
    try {
      const next = await action();
      if (next) apply(next);
      else await reload(true).then(() => setCartCount(0));
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function checkout() {
    setBusy('checkout');
    try {
      const order = await api.checkout();
      setCartCount(0);
      toast.success(`Đã tạo đơn ${shortId(order.id)}. Bấm "Thanh toán" để trả tiền.`);
      navigate('/orders');
    } catch (e) {
      toast.error(e);
      setBusy(null);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => reload()} />;
  if (loading || !cart) return <Spinner />;

  if (cart.items.length === 0)
    return (
      <>
        <PageHeader title="Giỏ hàng" />
        <EmptyState
          icon="🛒"
          title="Giỏ hàng trống"
          description="Thêm vài món đồ để bắt đầu đặt hàng."
          action={
            <Link to="/" className="btn btn-primary">
              Xem sản phẩm
            </Link>
          }
        />
      </>
    );

  const total = Number(cart.total);
  const hasUnavailable = cart.items.some((i) => !i.available);
  const notEnough = balance !== null && balance < total;

  return (
    <>
      <PageHeader
        title="Giỏ hàng"
        subtitle={`${cart.items.length} sản phẩm · order-service lấy giá mới nhất từ product-service`}
        actions={
          <button className="btn btn-ghost" disabled={!!busy} onClick={() => mutate('clear', api.clearCart)}>
            Xóa tất cả
          </button>
        }
      />
      <div className="cart-layout">
        <div className="card list">
          {cart.items.map((item) => (
            <CartRow
              key={item.productId}
              item={item}
              category={categoryOf(item.productId)}
              busy={busy === item.productId}
              onQuantity={(q) => mutate(item.productId, () => api.updateCartItem(item.productId, q))}
              onRemove={() => mutate(item.productId, () => api.removeCartItem(item.productId))}
            />
          ))}
        </div>

        <aside className="card summary">
          <h2>Tóm tắt</h2>
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{vnd(total)}</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển</span>
            <span className="muted">Miễn phí</span>
          </div>
          <div className="summary-row summary-total">
            <span>Tổng cộng</span>
            <span className="price">{vnd(total)}</span>
          </div>
          {balance !== null && (
            <div className={`summary-note${notEnough ? ' warn' : ''}`}>
              Số dư ví: <b>{vnd(balance)}</b>
              {notEnough && <div>Không đủ tiền: đơn sẽ thanh toán lỗi. Bạn có thể nạp thêm ở trang Ví.</div>}
            </div>
          )}
          {hasUnavailable && <div className="summary-note warn">Có sản phẩm không còn bán, hãy xóa khỏi giỏ.</div>}
          <button className="btn btn-primary btn-block" onClick={checkout} disabled={!!busy || hasUnavailable}>
            {busy === 'checkout' ? 'Đang đặt hàng...' : 'Đặt hàng'}
          </button>
        </aside>
      </div>
    </>
  );
}

function CartRow({
  item,
  category,
  busy,
  onQuantity,
  onRemove,
}: {
  item: CartLine;
  category: string;
  busy: boolean;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className={`list-row cart-row${item.available ? '' : ' unavailable'}`}>
      <ProductThumb category={category || item.productName} size="sm" />
      <div className="cart-info">
        <div className="cart-name">{item.productName}</div>
        <div className="muted">
          {vnd(item.unitPrice)}
          {!item.available && <span className="text-danger"> · Ngừng kinh doanh</span>}
        </div>
      </div>
      <div className="stepper" aria-label="Số lượng">
        <button onClick={() => onQuantity(item.quantity - 1)} disabled={busy || item.quantity <= 1} aria-label="Giảm">
          −
        </button>
        <span>{item.quantity}</span>
        <button onClick={() => onQuantity(item.quantity + 1)} disabled={busy || item.quantity >= 99} aria-label="Tăng">
          +
        </button>
      </div>
      <div className="cart-line-total">{vnd(item.lineTotal)}</div>
      <button className="icon-btn" onClick={onRemove} disabled={busy} aria-label={`Xóa ${item.productName}`}>
        🗑
      </button>
    </div>
  );
}
