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

Workflow `.github/workflows/frontend-dev.yml` chỉ chạy khi có push vào
`develop-ci-cd`; nó không chạy cho pull request và không kiểm tra branch nền.
Job publish build và đẩy Docker image lên GHCR một lần bằng full Git SHA, sau
đó job deploy chạy trên VPS. Để kiểm tra lint thủ công trên máy phát triển, chạy
`npm run lint`.

Mỗi push sẽ publish image GHCR bất biến bằng full Git SHA:

```text
ghcr.io/huutawn/dprental-frontend:<git-sha>
```

Trước khi push, tạo bốn **environment secrets** trong GitHub Environment `dev`
với tên `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
`NEXT_PUBLIC_FIREBASE_PROJECT_ID` và `NEXT_PUBLIC_FIREBASE_APP_ID`. Cấu hình
API browser dùng `NEXT_PUBLIC_API_URL` định nghĩa trong workflow
(`https://dev-api.lazyops.cloud`). Kiểm tra các biến bắt buộc này được thực hiện
trong Dockerfile lúc build image; nếu thiếu giá trị, quá trình build sẽ dừng ngay
lập tức. Các biến trong Compose trên VPS được truyền lúc container chạy nên không
thay thế được giá trị cần thiết lúc build.

Job publish chỉ có quyền ghi package; job deploy có quyền đọc package và truy
cập SSH secrets của GitHub Environment
`dev`: `DEV_VPS_SSH_PRIVATE_KEY`,
`DEV_VPS_KNOWN_HOSTS`, `DEV_VPS_HOST`, `DEV_VPS_USER`, và tùy chọn
`DEV_VPS_PORT`.

Workflow nạp deploy key vào `ssh-agent` qua stdin và kiểm tra host key đã lưu
trong `DEV_VPS_KNOWN_HOSTS`. Nó truyền `GITHUB_TOKEN` cùng deploy script qua
stdin của kết nối SSH, không đặt token trong câu lệnh SSH. Trên VPS, script
đăng nhập GHCR bằng Docker config tạm rồi thực thi
[deploy-frontend.sh](scripts/deploy-frontend.sh) từ commit đang phát hành.
Docker credential tạm bị xóa ngay khi script kết thúc (cả khi thành công và
thất bại); user SSH của workflow cần quyền đọc `.env` và ghi `release.env`.

Script cập nhật **chỉ duy nhất biến `FRONTEND_IMAGE`** trong
`/opt/dprental/dev/release.env` bằng image tag full Git SHA (thay thế trực tiếp
image đang dùng digest trong lần deploy đầu tiên), bảo toàn nguyên vẹn mọi image
khác trong `release.env`. Sau đó script chạy `docker compose pull frontend` rồi
`docker compose up -d --no-deps --force-recreate frontend`, chờ container
Frontend đạt trạng thái healthy theo giới hạn thiết lập
(`FRONTEND_DEPLOY_HEALTH_ATTEMPTS=18`,
`FRONTEND_DEPLOY_HEALTH_INTERVAL_SECONDS=5`), và thực hiện một cuộc gọi kiểm tra
(smoke test) đến `https://${DEV_APP_DOMAIN}/` với timeout
(`FRONTEND_DEPLOY_HTTP_TIMEOUT_SECONDS=15`).

Hành vi khi có lỗi: nếu pull image, khởi động container, health check hoặc smoke
test thất bại, deploy script sẽ thoát với mã lỗi khác 0 và job deploy thất bại.
Hệ thống **không tự động rollback** về image trước đó; `release.env` giữ nguyên
tag SHA mới để phục vụ điều tra và xử lý sự cố.

Nếu branch rules đang bắt buộc check `Validate frontend`, cần gỡ bỏ required
check này khi chuyển workflow vì workflow mới không còn job này. Nếu chỉ muốn
triển khai sau khi merge PR, có thể tiếp tục yêu cầu PR và chặn push trực tiếp
cho nhánh `develop-ci-cd`.

Kiểm tra script deploy tại chỗ bằng `bash tests/deploy-frontend.sh`.
