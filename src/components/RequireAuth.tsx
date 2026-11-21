import type { ReactNode } from 'react';
import { useSession } from '../context/SessionContext';
import { EmptyState, Spinner } from './ui';

/** Trang can dang nhap: chua login thi hien loi moi dang nhap (login thuc hien o auth-service). */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { me, isAdmin, login } = useSession();
  if (me === undefined) return <Spinner label="Đang kiểm tra phiên đăng nhập..." />;
  if (me === null)
    return (
      <EmptyState
        icon="🔐"
        title="Bạn cần đăng nhập"
        description="Đăng nhập một lần qua Auth-Service (SSO) để dùng giỏ hàng, đơn hàng và ví."
        action={
          <button className="btn btn-primary" onClick={login}>
            Đăng nhập
          </button>
        }
      />
    );
  if (admin && !isAdmin)
    return <EmptyState icon="⛔" title="Không có quyền truy cập" description="Trang này chỉ dành cho tài khoản ADMIN." />;
  return <>{children}</>;
}
