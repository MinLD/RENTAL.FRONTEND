# DPRENTAL Frontend

Ứng dụng web của hệ thống DPRENTAL, xây dựng bằng Next.js App Router với cấu
trúc gọn, dễ mở rộng và ưu tiên tái sử dụng component.

## Cấu trúc

```text
dprental-frontend/
  src/
    app/          # Route, layout và các file đặc biệt của App Router
    components/   # UI và component dùng chung toàn ứng dụng
    config/       # Cấu hình tĩnh của frontend
    hooks/        # React hook dùng chung
    lib/          # Cấu hình thư viện và helper cấp thấp
    providers/    # React Provider dùng chung
    services/     # API client và service dùng chung
    types/        # TypeScript type dùng chung
    utils/        # Hàm tiện ích thuần, không chứa nghiệp vụ
  public/
    icons/        # Icon tĩnh
    images/       # Hình ảnh tĩnh
```

`app` chịu trách nhiệm routing và điều phối view. Root layout chỉ giữ các concern
cấp toàn ứng dụng như `html`, `body`, metadata, font và global CSS.

Route group hiện tại:

```text
src/app/
  (public)/      # Layout public có Header/Footer
  (auth)/        # Layout dành cho các route auth sau này
  layout.tsx     # Root layout
  loading.tsx    # Loading UI mặc định
  not-found.tsx  # 404 UI mặc định
```

Component dùng lại nhiều nơi được đặt trong `components`; API/service dùng chung
đặt trong `services`; logic nhỏ có thể tách ra `hooks`, `lib`, `utils` hoặc
`types` theo đúng mục đích.

Chỉ tạo thư mục/file khi có nhu cầu thực tế. `page.tsx` nên mỏng và không chứa
khối business logic lớn. Dự án chỉ sử dụng App Router, không tạo `pages` hoặc
`src/pages`.

## Docker và dev VPS

Image runtime dùng Next.js standalone, chạy bằng user `node` và lắng nghe cổng
`3000`. `NEXT_PUBLIC_API_URL` và bốn biến `NEXT_PUBLIC_FIREBASE_*` là cấu hình
browser nên bắt buộc truyền lúc build; `BACKEND_API_URL` chỉ là override
server-side cho các route handler.

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://dev-api.lazyops.cloud \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID \
  --tag dprental-frontend:local .
docker run --rm -p 3000:3000 \
  -e BACKEND_API_URL=http://gateway:8080 \
  dprental-frontend:local
```

Workflow `.github/workflows/frontend-dev.yml` kiểm tra lint cho PR vào
`develop-ci-cd`. Khi push lên nhánh này, workflow lint và build đúng một lần
trong Docker, đẩy image gắn tag commit SHA lên GHCR, rồi deploy bằng digest.
Trước khi push, tạo bốn **environment secrets** trong GitHub Environment `dev`
với tên `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID` và `NEXT_PUBLIC_FIREBASE_APP_ID`. Job publish
sử dụng Environment `dev` và sẽ dừng trước khi build nếu thiếu giá trị. Các biến
trong Compose trên VPS được truyền lúc container chạy nên không thay thế được
giá trị cần thiết lúc build.
Job publish chỉ có quyền ghi package; job deploy có quyền đọc package và mới
truy cập SSH secret của GitHub Environment
`dev`: `DEV_VPS_SSH_PRIVATE_KEY`,
`DEV_VPS_KNOWN_HOSTS`, `DEV_VPS_HOST`, `DEV_VPS_USER`, và tùy chọn
`DEV_VPS_PORT`. Job deploy dùng token GHCR chỉ có quyền đọc qua SSH stdin và
xóa cấu hình đăng nhập tạm trên VPS sau khi chạy. Image nằm tại
`ghcr.io/huutawn/dprental-frontend`.
Environment `dev` chỉ cho phép deploy từ `develop-ci-cd`; nhánh này yêu cầu PR
và check `Validate frontend` thành công. VPS cần bundle `deploy/dev` với
`.env`, `release.env` và `compose.yaml` đã cấu hình. Script deploy pull image
trước khi đổi `release.env` và khôi phục image trước đó nếu health check hoặc
kiểm tra URL công khai thất bại.

Kiểm tra script deploy tại chỗ bằng `bash tests/deploy-frontend.sh`. Sau khi
workflow được cập nhật, đo ít nhất năm lần push thành công bằng thời gian từ
`createdAt` đến `updatedAt` của GitHub Actions; mục tiêu trung vị không quá
155 giây (nền trước thay đổi: 259,5 giây từ hai lần push không chờ runner).
