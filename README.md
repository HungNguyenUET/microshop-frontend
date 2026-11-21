# MicroShop Frontend

Storefront React + TypeScript (Vite) cho backend [microshop](../microshop). Bundle build ra được API Gateway phục vụ như static resource, nên UI và `/api/**` chạy **cùng origin** (`http://localhost:8080`).

## Chạy

```bash
npm ci
npm run build      # typecheck + build vào ../microshop/api-gateway/src/main/resources/static
```

Sau đó build lại jar/image của `api-gateway` (xem README của microshop).

### Dev (hot reload)

Cần stack backend đang chạy (`docker compose up -d` trong `microshop`).

```bash
npm run dev        # http://localhost:5173, proxy /api /oauth2 /login /logout sang gateway :8080
```

Đăng nhập do Auth-Service đảm nhận. Client OAuth2 chỉ đăng ký redirect về `localhost:8080`, nên sau khi đăng nhập trình duyệt sẽ quay về `:8080`. Cookie `SESSION` dùng chung cho `localhost` (không phân biệt port), vì vậy chỉ cần mở lại `http://localhost:5173` là đã ở trạng thái đăng nhập.

Đổi địa chỉ gateway: `GATEWAY_URL=http://host:8080 npm run dev`.

## Tích hợp với backend

| Điểm | Cách làm |
|---|---|
| Xác thực (BFF) | Frontend **không cầm token**. Chỉ có cookie `SESSION` (HttpOnly). Nút *Đăng nhập* chuyển tới `/oauth2/authorization/microshop`; `/api/me` cho biết ai đang đăng nhập |
| CSRF | Request ghi (POST/PUT/DELETE) gửi header `X-XSRF-TOKEN` đọc từ cookie `XSRF-TOKEN`. Đăng xuất là form `POST /logout` kèm `_csrf` |
| Lỗi | Đọc `ProblemDetail` (`detail`/`title`), hiện toast. 401 thì UI chuyển về trạng thái chưa đăng nhập |
| Thanh toán bất đồng bộ | `POST /api/orders/{id}/payment` trả 202, UI polling `GET /api/orders/{id}` tới khi `PAID` / `PAYMENT_FAILED` |
| Routing | `HashRouter` (`/#/cart`...): gateway chỉ cần cho phép `/`, `/index.html`, `/assets/**`, `/favicon.svg` |

## Màn hình

| Route | Service | Nội dung |
|---|---|---|
| `/` | product | Danh sách, tìm kiếm, lọc danh mục, thêm vào giỏ (xem không cần đăng nhập) |
| `/cart` | order | Đổi số lượng, xóa, cảnh báo số dư không đủ, đặt hàng |
| `/orders` | order, payment (Kafka) | Tiến trình đơn, thanh toán / thanh toán lại, polling trạng thái |
| `/wallet` | payment | Số dư, nạp tiền demo, lịch sử giao dịch |
| `/notifications` | notification | Thông báo sinh ra từ event `order-events` |
| `/admin` (ADMIN) | product, auth, order | CRUD sản phẩm, cấp/bỏ quyền ADMIN, tất cả đơn hàng |

## Cấu trúc

```text
src/
├── api/          # client.ts (fetch + CSRF + ProblemDetail), index.ts (endpoint), types.ts (khớp record Java)
├── context/      # SessionContext (me, giỏ, số dư), ToastContext
├── components/   # Header, RequireAuth, ui.tsx (Badge, Modal, EmptyState...)
├── pages/        # Products, Cart, Orders, Wallet, Notifications, Admin
├── lib/          # format (VND, ngày, trạng thái), hooks
└── styles.css
```

Script e2e của backend (`microshop/scripts/e2e.js`) vẫn dùng được: lưới sản phẩm giữ selector `#products .card` và nút `Đăng xuất`.
