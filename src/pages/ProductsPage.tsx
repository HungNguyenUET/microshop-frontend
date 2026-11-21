import { useMemo, useState } from 'react';
import { api, type Product } from '../api';
import { EmptyState, ErrorState, ProductThumb, Spinner } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { vnd } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { useDebounced } from '../lib/useDebounced';

const PAGE_SIZE = 100; // backend gioi han size <= 100

export function ProductsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const q = useDebounced(query.trim());
  const { data, error, loading, reload } = useAsync(() => api.products(q, 0, PAGE_SIZE), [q]);

  const products = data?.content ?? [];
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);
  const visible = category ? products.filter((p) => p.category === category) : products;

  return (
    <>
      <section className="hero">
        <div>
          <h1>Đồ công nghệ cho dân lập trình</h1>
          <p>
            Mỗi thao tác đi qua API Gateway tới các microservice: Product, Order, Payment, Notification.
          </p>
        </div>
        <div className="search">
          <span className="search-icon" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm sản phẩm..."
            aria-label="Tìm sản phẩm"
          />
        </div>
      </section>

      {categories.length > 1 && (
        <div className="chips" role="tablist" aria-label="Danh mục">
          <button className={`chip${category === null ? ' active' : ''}`} onClick={() => setCategory(null)}>
            Tất cả
          </button>
          {categories.map((c) => (
            <button key={c} className={`chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => reload()} />
      ) : loading && !data ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState icon="🔍" title="Không tìm thấy sản phẩm" description="Thử từ khóa khác hoặc bỏ bộ lọc danh mục." />
      ) : (
        <div id="products" className="product-grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { me, login, setCartCount } = useSession();
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  async function addToCart() {
    if (!me) return login();
    setAdding(true);
    try {
      const cart = await api.addToCart(product.id, 1);
      setCartCount(cart.items.reduce((n, i) => n + i.quantity, 0));
      toast.success(`Đã thêm "${product.name}" vào giỏ`);
    } catch (e) {
      toast.error(e);
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="card product-card">
      <ProductThumb category={product.category} />
      <div className="product-body">
        <div className="product-meta">
          <span>{product.category}</span>
          <span className="sku">{product.sku}</span>
        </div>
        <h3 className="product-name">{product.name}</h3>
        {product.description && <p className="product-desc">{product.description}</p>}
      </div>
      <div className="product-foot">
        <span className="price">{vnd(product.price)}</span>
        <button className="btn btn-primary btn-sm" onClick={addToCart} disabled={adding}>
          {adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
        </button>
      </div>
    </article>
  );
}
