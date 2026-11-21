import { useState, type FormEvent } from 'react';
import { api, type AppUser, type Product, type ProductRequest } from '../api';
import { Badge, EmptyState, ErrorState, Modal, OrderStatusBadge, PageHeader, ProductThumb, Spinner } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { dateTime, shortId, vnd } from '../lib/format';
import { useAsync } from '../lib/useAsync';

type Tab = 'products' | 'users' | 'orders';

const TABS: { id: Tab; label: string; service: string }[] = [
  { id: 'products', label: 'Sản phẩm', service: 'product-service' },
  { id: 'users', label: 'Người dùng & quyền', service: 'auth-service' },
  { id: 'orders', label: 'Tất cả đơn hàng', service: 'order-service' },
];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('products');
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <PageHeader title="Quản trị" subtitle={`Gateway chặn /api/admin/** nếu không có ROLE_ADMIN · ${active.service} tự kiểm tra JWT lần nữa`} />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'products' && <ProductsAdmin />}
      {tab === 'users' && <UsersAdmin />}
      {tab === 'orders' && <OrdersAdmin />}
    </>
  );
}

// ------------------------------------------------------------------ products

function ProductsAdmin() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(() => api.products('', 0, 100), []);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  async function remove(p: Product) {
    if (!confirm(`Ngừng bán "${p.name}"? (xóa mềm, đơn cũ vẫn giữ nguyên)`)) return;
    try {
      await api.deleteProduct(p.id);
      toast.success('Đã ngừng bán sản phẩm');
      void reload(true);
    } catch (e) {
      toast.error(e);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => reload()} />;
  if (loading || !data) return <Spinner />;

  return (
    <>
      <div className="toolbar">
        <span className="muted">{data.totalElements} sản phẩm đang bán</span>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Thêm sản phẩm
        </button>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th className="num">Giá</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.content.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="cell-product">
                    <ProductThumb category={p.category} size="sm" />
                    <div>
                      <div>{p.name}</div>
                      <div className="muted small">{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td>{p.category}</td>
                <td className="num nowrap">{vnd(p.price)}</td>
                <td className="actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditing(p)}>
                    Sửa
                  </button>
                  <button className="btn btn-sm btn-ghost btn-danger-text" onClick={() => remove(p)}>
                    Ngừng bán
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload(true);
          }}
        />
      )}
    </>
  );
}

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<ProductRequest>({
    sku: product?.sku ?? '',
    name: product?.name ?? '',
    category: product?.category ?? '',
    price: product ? Number(product.price) : 0,
    description: product?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProductRequest>(key: K, value: ProductRequest[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (product) await api.updateProduct(product.id, form);
      else await api.createProduct(form);
      toast.success(product ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      onSaved();
    } catch (err) {
      toast.error(err);
      setSaving(false);
    }
  }

  return (
    <Modal title={product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            SKU
            {/* PUT khong doi duoc SKU (backend bo qua) */}
            <input value={form.sku} onChange={(e) => set('sku', e.target.value)} required maxLength={50} disabled={!!product} />
          </label>
          <label>
            Danh mục
            <input value={form.category} onChange={(e) => set('category', e.target.value)} required maxLength={50} list="categories" />
          </label>
        </div>
        <label>
          Tên sản phẩm
          <input value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={200} />
        </label>
        <label>
          Giá (VND)
          <input type="number" min={0} step={1000} value={form.price} onChange={(e) => set('price', Number(e.target.value))} required />
        </label>
        <label>
          Mô tả
          <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={1000} />
        </label>
        <datalist id="categories">
          {['Phụ kiện', 'Âm thanh', 'Màn hình', 'Laptop', 'Sách'].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------------ users

function UsersAdmin() {
  const toast = useToast();
  const { me } = useSession();
  const { data, setData, error, loading, reload } = useAsync(api.adminUsers, []);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleAdmin(u: AppUser) {
    const isAdmin = u.roles.includes('ADMIN');
    setBusy(u.id);
    try {
      const updated = await api.changeRoles(u.id, isAdmin ? ['USER'] : ['USER', 'ADMIN']);
      setData((list) => list?.map((x) => (x.id === u.id ? updated : x)) ?? null);
      toast.success(`Đã ${isAdmin ? 'bỏ' : 'cấp'} quyền ADMIN cho ${u.username}. Quyền mới có hiệu lực khi user đăng nhập lại.`);
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(null);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => reload()} />;
  if (loading || !data) return <Spinner />;

  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Đăng nhập bằng</th>
            <th>Quyền</th>
            <th>Lần đăng nhập cuối</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.map((u) => {
            const isAdmin = u.roles.includes('ADMIN');
            const isMe = u.id === me?.id;
            return (
              <tr key={u.id}>
                <td>
                  <div className="cell-product">
                    <span className="avatar">{u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : u.username.charAt(0).toUpperCase()}</span>
                    <div>
                      <div>{u.displayName || u.username}</div>
                      <div className="muted small">{u.email || u.username}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge>{u.provider}</Badge>
                </td>
                <td>
                  <div className="badges">
                    {u.roles.map((r) => (
                      <Badge key={r} tone={r === 'ADMIN' ? 'warning' : 'info'}>
                        {r}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="muted small nowrap">{u.lastLoginAt ? dateTime(u.lastLoginAt) : '—'}</td>
                <td className="actions">
                  {isMe ? (
                    <span className="muted small">(bạn)</span>
                  ) : (
                    <button className="btn btn-sm btn-ghost" disabled={busy === u.id} onClick={() => toggleAdmin(u)}>
                      {isAdmin ? 'Bỏ ADMIN' : 'Cấp ADMIN'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ orders

function OrdersAdmin() {
  const { data, error, loading, reload } = useAsync(api.adminOrders, []);

  if (error) return <ErrorState message={error} onRetry={() => reload()} />;
  if (loading || !data) return <Spinner />;
  if (data.length === 0) return <EmptyState icon="📦" title="Chưa có đơn hàng" />;

  const revenue = data.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <>
      <div className="stats">
        <div className="card stat">
          <span className="muted small">Đơn hàng (100 gần nhất)</span>
          <b>{data.length}</b>
        </div>
        <div className="card stat">
          <span className="muted small">Đã thanh toán</span>
          <b>{data.filter((o) => o.status === 'PAID').length}</b>
        </div>
        <div className="card stat">
          <span className="muted small">Doanh thu</span>
          <b>{vnd(revenue)}</b>
        </div>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách</th>
              <th>Sản phẩm</th>
              <th className="num">Tổng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.id}>
                <td className="nowrap">
                  {shortId(o.id)}
                  <div className="muted small">{dateTime(o.createdAt)}</div>
                </td>
                <td>{o.username}</td>
                <td className="small">
                  {o.items.map((i) => (
                    <div key={i.productId}>
                      {i.productName} × {i.quantity}
                    </div>
                  ))}
                </td>
                <td className="num nowrap">{vnd(o.totalAmount)}</td>
                <td>
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
