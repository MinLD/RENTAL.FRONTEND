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
`3000`. `NEXT_PUBLIC_API_URL` là cấu hình browser nên bắt buộc truyền lúc build;
`BACKEND_API_URL` chỉ là override server-side cho các route handler.

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://dev-api.lazyops.cloud \
  --tag dprental-frontend:local .
docker run --rm -p 3000:3000 \
  -e BACKEND_API_URL=http://gateway:8080 \
  dprental-frontend:local
```

Workflow `.github/workflows/frontend-dev.yml` chạy trên nhánh `develop-ci-cd`:
lint, build, build/push image SHA bất biến tới GHCR, rồi SSH deploy Frontend.
GitHub Environment `dev` cần variable `GHCR_IMAGE_NAMESPACE` (lowercase) và các
secret dùng chung với Backend/AuthService: `DEV_VPS_SSH_PRIVATE_KEY`,
`DEV_VPS_KNOWN_HOSTS`, `DEV_VPS_HOST`, `DEV_VPS_USER`, và tùy chọn
`DEV_VPS_PORT`. VPS phải được cập nhật bundle `deploy/dev` trước release đầu
tiên, bao gồm `.env` và `release.env` theo hai file example tại đó.
