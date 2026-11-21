import type { OrderStatus, WalletTransaction } from '../api/types';

const vndFormatter = new Intl.NumberFormat('vi-VN');
export const vnd = (n: number | string) => `${vndFormatter.format(Number(n))} đ`;

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export const shortId = (id: string | null | undefined) => (id ? `#${id.slice(0, 8)}` : '');

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', tone: 'warning' },
  PAYMENT_PROCESSING: { label: 'Đang thanh toán', tone: 'info' },
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  PAYMENT_FAILED: { label: 'Thanh toán lỗi', tone: 'danger' },
};

export const TX_STATUS: Record<WalletTransaction['status'], { label: string; tone: Tone }> = {
  SUCCESS: { label: 'Thành công', tone: 'success' },
  FAILED: { label: 'Thất bại', tone: 'danger' },
};

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Backend chua co anh san pham -> moi danh muc 1 bieu tuong + mau rieng. */
const CATEGORY_VISUALS: Record<string, { icon: string; hue: number }> = {
  'phụ kiện': { icon: '⌨️', hue: 245 },
  'âm thanh': { icon: '🎧', hue: 290 },
  'màn hình': { icon: '🖥️', hue: 200 },
  laptop: { icon: '💻', hue: 220 },
  sách: { icon: '📚', hue: 30 },
};

export function categoryVisual(category: string) {
  const known = CATEGORY_VISUALS[category.trim().toLowerCase()];
  if (known) return known;
  // Danh muc moi (admin them) -> hue on dinh theo ten
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return { icon: '📦', hue: hash };
}
