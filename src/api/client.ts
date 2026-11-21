// HTTP client goi API qua API Gateway (BFF).
// - Cung origin -> browser tu gui cookie SESSION (HttpOnly). Frontend KHONG bao gio cam access token.
// - Request thay doi du lieu phai kem header X-XSRF-TOKEN (doc tu cookie XSRF-TOKEN) vi gateway bat CSRF.
// - Loi tra ve dang ProblemDetail (RFC 9457): { title, detail, status }.

export const LOGIN_URL = '/oauth2/authorization/microshop';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function csrfToken(): string {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/** Phat su kien khi session het han / chua dang nhap de SessionProvider cap nhat UI. */
export const UNAUTHORIZED_EVENT = 'microshop:unauthorized';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

const FALLBACK_MESSAGES: Record<number, string> = {
  401: 'Bạn cần đăng nhập để tiếp tục.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu.',
  429: 'Bạn thao tác quá nhanh, vui lòng thử lại sau giây lát.',
  503: 'Dịch vụ tạm thời không phản hồi, vui lòng thử lại sau.',
};

export async function request<T>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-XSRF-TOKEN'] = csrfToken();

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Không kết nối được tới API Gateway.');
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (data && (data.detail || data.title || data.message)) ||
      FALLBACK_MESSAGES[res.status] ||
      `Lỗi ${res.status}`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path, 'GET'),
  post: <T>(path: string, body?: unknown) => request<T>(path, 'POST', body),
  put: <T>(path: string, body?: unknown) => request<T>(path, 'PUT', body),
  del: <T>(path: string) => request<T>(path, 'DELETE'),
};
