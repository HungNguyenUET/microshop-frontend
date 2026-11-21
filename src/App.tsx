import { useEffect } from 'react';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { RequireAuth } from './components/RequireAuth';
import { EmptyState } from './components/ui';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { WalletPage } from './pages/WalletPage';

// HashRouter: gateway chi phuc vu "/" (index.html) cong khai, URL dang /#/cart khong can cau hinh them o backend.
export default function App() {
  return (
    <ToastProvider>
      <SessionProvider>
        <HashRouter>
          <LoginErrorNotice />
          <Header />
          <main className="container main">
            <Routes>
              <Route path="/" element={<ProductsPage />} />
              <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
              <Route path="/wallet" element={<RequireAuth><WalletPage /></RequireAuth>} />
              <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
              <Route
                path="*"
                element={
                  <EmptyState icon="🧭" title="Không tìm thấy trang" action={<Link to="/" className="btn btn-primary">Về trang chủ</Link>} />
                }
              />
            </Routes>
          </main>
          <footer className="footer container">
            Browser chỉ giữ cookie session HttpOnly · Access token nằm ở API Gateway (BFF pattern)
          </footer>
        </HashRouter>
      </SessionProvider>
    </ToastProvider>
  );
}

/** Gateway redirect ve /?loginError khi dang nhap that bai (SecurityConfig.authenticationFailureHandler). */
function LoginErrorNotice() {
  const toast = useToast();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('loginError')) {
      toast.error('Đăng nhập thất bại, vui lòng thử lại.');
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  }, [toast]);
  return null;
}
