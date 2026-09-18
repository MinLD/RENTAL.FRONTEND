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
