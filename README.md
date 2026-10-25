# DPU Rental Frontend

Ứng dụng web DPU Rental của DP UNITY, xây dựng bằng Next.js App Router với cấu
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

## Mock chi tiết thiết bị

Khi chạy `npm run dev`, API mock trả cùng một thiết bị cho mọi ID:

```text
GET /api/mock/inventory/public/equipment-listings/any-id
```

Dữ liệu nằm trong `src/mocks/inventory/equipment-listing.ts`, có ảnh local để
không phụ thuộc backend. Trong Server Component, gọi
`getPublicEquipmentListing(id)` từ `src/services/queries/inventory-queries.ts`;
service tự dùng mock khi phát triển. Đặt `MOCK_PUBLIC_EQUIPMENT_DETAIL=false`
để chuyển sang API backend thật. Khi chạy production, service luôn dùng API thật.

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

Workflow `.github/workflows/frontend-dev.yml` chạy khi push `develop-ci-cd`.
Build/Buildx và publish GHCR chạy trên `ubuntu-24.04`, giữ nguyên Dockerfile,
build arguments và image `ghcr.io/huutawn/dprental-frontend:<full-git-sha>`.
Deploy chạy trên runner `[self-hosted, linux, x64, dprental-frontend-deploy]`
của Ubuntu VM. Hướng dẫn quyền, approval và recovery ở [DEPLOYMENT.md](DEPLOYMENT.md).

Giữ bốn environment secrets `dev`: `NEXT_PUBLIC_FIREBASE_API_KEY`,
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
`NEXT_PUBLIC_FIREBASE_APP_ID`; giữ các build variables SignalR/Payment hiện có.
Repository variable `DEV_DEPLOY_ENABLED=true` bật deploy, `false` ngừng nhận deploy mới.
Các SSH/VPS secrets không còn được workflow dùng; chưa xóa secret trên GitHub.

Kiểm tra deployment: `python3 -m unittest discover -s tests -p 'test_deploy*.py'`.
