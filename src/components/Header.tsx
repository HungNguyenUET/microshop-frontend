import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { csrfToken } from '../api';
import { useSession } from '../context/SessionContext';
import { vnd } from '../lib/format';

export function Header() {
  const { me, isAdmin, cartCount, balance, login } = useSession();
  const csrfInput = useRef<HTMLInputElement>(null);

  const links = [
    { to: '/', label: 'Sản phẩm', end: true, show: true },
    { to: '/cart', label: 'Giỏ hàng', badge: cartCount, show: !!me },
    { to: '/orders', label: 'Đơn hàng', show: !!me },
    { to: '/wallet', label: 'Ví', show: !!me },
    { to: '/notifications', label: 'Thông báo', show: !!me },
    { to: '/admin', label: 'Quản trị', show: isAdmin },
  ].filter((l) => l.show);

  const initial = (me?.name || me?.username || '?').charAt(0).toUpperCase();

  return (
    <header className="header">
      <div className="header-inner container">
        <NavLink to="/" className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>MicroShop</span>
        </NavLink>

        <nav className="nav" aria-label="Điều hướng chính">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              {l.label}
              {!!l.badge && <span className="nav-badge">{l.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="account">
          {me === undefined ? null : me === null ? (
            <button className="btn btn-primary" onClick={login}>
              Đăng nhập
            </button>
          ) : (
            <>
              {balance !== null && (
                <NavLink to="/wallet" className="balance-chip" title="Số dư ví">
                  {vnd(balance)}
                </NavLink>
              )}
              <div className="user" title={`${me.username} · ${me.roles.join(', ')}`}>
                <span className="avatar">{me.picture ? <img src={me.picture} alt="" /> : initial}</span>
                <span className="user-meta">
                  <span className="user-name">{me.name}</span>
                  <span className="user-roles">{me.roles.join(' · ')}</span>
                </span>
              </div>
              {/* Logout la form POST (Spring Security), kem _csrf. Gateway xoa session roi goi OIDC end_session cua auth-service. */}
              <form
                method="post"
                action="/logout"
                className="logout-form"
                onSubmit={() => {
                  if (csrfInput.current) csrfInput.current.value = csrfToken();
                }}
              >
                <input ref={csrfInput} type="hidden" name="_csrf" defaultValue="" />
                <button type="submit" className="btn btn-ghost">
                  Đăng xuất
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
