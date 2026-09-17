# DPRENTAL Frontend

Ứng dụng web của hệ thống DPRENTAL, xây dựng bằng Next.js App Router theo kiến
trúc feature-based.

## Cấu trúc

```text
dprental-frontend/
  src/
    app/          # Route, layout và các file đặc biệt của App Router
    components/   # UI và component dùng chung toàn ứng dụng
    features/     # Component, logic và service theo từng nghiệp vụ
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

`app` chịu trách nhiệm routing và điều phối view; business logic nằm trong
`features`. Mỗi feature tự quản lý component, hook, service, type và utility
riêng, đồng thời có thể dùng các module dùng chung ở cấp `src`.

Chỉ tạo thư mục khi có nhu cầu thực tế. `page.tsx` nên mỏng và không chứa khối
business logic lớn. Dự án chỉ sử dụng App Router, không tạo `pages` hoặc
`src/pages`.
