import { useState, type FormEvent } from 'react';
import { api } from '../api';
import { EmptyState, ErrorState, PageHeader, Spinner, TxStatusBadge } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useToast } from '../context/ToastContext';
import { dateTime, shortId, vnd } from '../lib/format';
import { useAsync } from '../lib/useAsync';

const PRESETS = [1_000_000, 5_000_000, 10_000_000];
const MIN_TOP_UP = 10_000; // TopUpRequest @DecimalMin("10000")
const MAX_TOP_UP = 50_000_000; // microshop.wallet.max-top-up

export function WalletPage() {
  const toast = useToast();
  const { refreshBalance } = useSession();
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([api.wallet(), api.transactions()]),
    [],
  );
  const [amount, setAmount] = useState(String(PRESETS[2]));
  const [submitting, setSubmitting] = useState(false);

  async function topUp(e: FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < MIN_TOP_UP || value > MAX_TOP_UP) {
      toast.error(`Số tiền nạp phải từ ${vnd(MIN_TOP_UP)} đến ${vnd(MAX_TOP_UP)}`);
      return;
    }
    setSubmitting(true);
    try {
      const wallet = await api.topUp(value);
      toast.success(`Nạp ${vnd(value)} thành công. Số dư: ${vnd(wallet.balance)}`);
      await Promise.all([reload(true), refreshBalance()]);
    } catch (err) {
      toast.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => reload()} />;
  if (loading || !data) return <Spinner />;
  const [wallet, txs] = data;

  return (
    <>
      <PageHeader title="Ví" subtitle="payment-service trừ tiền khi nhận event PaymentRequested từ Kafka" />

      <div className="wallet-layout">
        <div className="card wallet-card">
          <span className="wallet-label">Số dư hiện tại</span>
          <span className="wallet-balance">{vnd(wallet.balance)}</span>
          <span className="wallet-updated">Cập nhật {dateTime(wallet.updatedAt)}</span>
        </div>

        <form className="card topup" onSubmit={topUp}>
          <h2>Nạp tiền (demo)</h2>
          <div className="chips">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                className={`chip${Number(amount) === p ? ' active' : ''}`}
                onClick={() => setAmount(String(p))}
              >
                {vnd(p)}
              </button>
            ))}
          </div>
          <div className="input-row">
            <input
              type="number"
              min={MIN_TOP_UP}
              max={MAX_TOP_UP}
              step={10_000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Số tiền nạp"
            />
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang nạp...' : 'Nạp tiền'}
            </button>
          </div>
          <p className="muted small">Tối đa {vnd(MAX_TOP_UP)} mỗi lần.</p>
        </form>
      </div>

      <h2 className="section-title">Lịch sử giao dịch</h2>
      {txs.length === 0 ? (
        <EmptyState icon="🧾" title="Chưa có giao dịch" />
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Nội dung</th>
                <th className="num">Số tiền</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id}>
                  <td className="nowrap">{dateTime(t.createdAt)}</td>
                  <td>
                    {t.type === 'TOP_UP' ? 'Nạp tiền' : `Thanh toán đơn ${shortId(t.orderId)}`}
                    {t.reason && <div className="muted small">{t.reason}</div>}
                  </td>
                  <td className={`num nowrap ${t.status === 'FAILED' ? 'muted strike' : t.type === 'TOP_UP' ? 'text-success' : ''}`}>
                    {t.type === 'TOP_UP' ? '+' : '−'}
                    {vnd(t.amount)}
                  </td>
                  <td>
                    <TxStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
